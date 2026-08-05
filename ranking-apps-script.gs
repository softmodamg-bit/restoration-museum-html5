/**
 * 반짝 복원 미술관 · Google Apps Script 관장 랭킹
 *
 * 설치 순서
 * 1. 빈 Google Sheet에서 확장 프로그램 → Apps Script를 엽니다.
 * 2. 기본 Code.gs 내용을 이 파일 전체로 교체합니다.
 * 3. setupRankingSheet를 한 번 직접 실행하고 권한을 승인합니다.
 * 4. 배포 → 새 배포 → 웹 앱에서 "다음 사용자로 실행: 나",
 *    "액세스 권한: 모든 사용자"로 배포합니다.
 * 5. 배포된 /exec 주소를 js/ranking-config.js의 endpoint에 넣습니다.
 */

var RANKING_SHEET_NAME = "관장 랭킹";
var RANKING_SEASON = "공모전 시즌 1";
var RANKING_GAME_VERSION = "prototype-2026-08";
var RANKING_RULES_VERSION = "director-score-v2";
var FINAL_STORY_THRESHOLD = 1500;
var MAX_RECORDS = 500;
var MAX_PAYLOAD_CHARS = 400000;
var HEADERS = [
  "createdAt", "updatedAt", "season", "playerHash", "directorName", "museumName",
  "restoredCount", "averageAccuracy", "averageRisk", "totalTimeSeconds", "directorScore",
  "totalVisitors", "gameDay", "upgradeCount", "submissionId", "gameVersion", "rulesVersion",
  "recordDigest", "status", "totalMuseumIncome", "storyMilestone", "storyCompletionDay",
  "incomeScore", "visitorScore", "storySpeedScore"
];
var FORBIDDEN_NAME_TOKENS = [
  "시발", "씨발", "병신", "개새끼", "좆", "마약", "도박", "카지노", "나치", "테러",
  "fuck", "shit", "bitch", "cunt", "nigger", "nigga", "faggot", "retard", "casino"
];

function setupRankingSheet() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error("Google Sheet에 연결된 Apps Script에서 실행해 주세요.");
  var properties = PropertiesService.getScriptProperties();
  properties.setProperty("RANKING_SPREADSHEET_ID", spreadsheet.getId());
  if (!properties.getProperty("RANKING_HASH_SALT")) {
    properties.setProperty("RANKING_HASH_SALT", Utilities.getUuid() + Utilities.getUuid());
  }
  var sheet = spreadsheet.getSheetByName(RANKING_SHEET_NAME) || spreadsheet.insertSheet(RANKING_SHEET_NAME);
  ensureHeader_(sheet);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setBackground("#6f5260")
    .setFontColor("#ffffff")
    .setFontWeight("bold");
  sheet.autoResizeColumns(1, HEADERS.length);
  return "랭킹 시트 준비 완료";
}

function doGet(event) {
  try {
    var season = normalizeSeason_(event && event.parameter && event.parameter.season);
    var leaders = readLeaderboard_(season, 100);
    return HtmlService.createHtmlOutput(renderLeaderboardPage_(leaders, season))
      .setTitle("반짝 복원 미술관 · 관장 랭킹")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (error) {
    console.error(error);
    return HtmlService.createHtmlOutput(renderErrorPage_("랭킹을 불러오지 못했습니다.", error.message))
      .setTitle("관장 랭킹 오류");
  }
}

function doPost(event) {
  var lock;
  try {
    var raw = event && event.parameter ? event.parameter.payload : "";
    if (!raw || raw.length > MAX_PAYLOAD_CHARS) throw new Error("제출 데이터의 크기가 올바르지 않습니다.");
    var submission = JSON.parse(raw);
    var scored = validateAndScore_(submission);

    lock = LockService.getScriptLock();
    lock.waitLock(20000);
    var stored = upsertBestScore_(scored);
    var leaders = readLeaderboard_(scored.season, 100);
    var rank = stored.status === "정상"
      ? leaders.findIndex(function (entry) { return entry.playerHash === stored.playerHash; }) + 1
      : 0;
    return HtmlService.createHtmlOutput(renderReceiptPage_(stored, rank, leaders.slice(0, 10)))
      .setTitle("관장 랭킹 제출 결과")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (error) {
    console.error(error);
    return HtmlService.createHtmlOutput(renderErrorPage_("랭킹 제출을 완료하지 못했습니다.", error.message))
      .setTitle("관장 랭킹 제출 오류");
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

function validateAndScore_(submission) {
  if (!submission || typeof submission !== "object" || Array.isArray(submission)) throw new Error("제출 형식이 올바르지 않습니다.");
  if (submission.format !== "sparkle-restoration-ranking-submission" || Number(submission.schemaVersion) !== 1) {
    throw new Error("지원하지 않는 랭킹 제출 형식입니다.");
  }
  if (submission.gameVersion !== RANKING_GAME_VERSION || submission.rulesVersion !== RANKING_RULES_VERSION) {
    throw new Error("현재 랭킹 시즌과 게임 버전이 다릅니다.");
  }
  var season = normalizeSeason_(submission.season);
  var playerId = String(submission.playerId || "");
  if (!/^[a-zA-Z0-9-]{16,64}$/.test(playerId)) throw new Error("플레이어 식별값이 올바르지 않습니다.");
  var directorName = validateName_(submission.directorName, "관장 이름", 1, 12);
  var museumName = validateName_(submission.museumName, "미술관 이름", 2, 20);
  var submissionId = String(submission.submissionId || "");
  if (!/^[a-zA-Z0-9-]{8,80}$/.test(submissionId)) throw new Error("제출 식별값이 올바르지 않습니다.");

  var records = submission.records;
  if (!Array.isArray(records) || records.length < 1 || records.length > MAX_RECORDS) {
    throw new Error("복원 기록은 1~" + MAX_RECORDS + "개만 제출할 수 있습니다.");
  }
  var seen = {};
  var previousDay = 0;
  var totalAccuracy = 0;
  var totalRisk = 0;
  var totalTime = 0;
  var directorScore = 0;
  var requiresReview = false;
  var compactRecords = records.map(function (record) {
    if (!record || typeof record !== "object" || Array.isArray(record)) throw new Error("손상된 복원 기록이 포함되어 있습니다.");
    var artId = String(record.artId || "");
    if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(artId) || seen[artId]) throw new Error("중복되거나 잘못된 작품 기록이 포함되어 있습니다.");
    seen[artId] = true;
    var day = requireInteger_(record.day, 1, 999999, "복원 날짜");
    var accuracy = requireInteger_(record.accuracy, 0, 100, "정확도");
    var risk = requireInteger_(record.risk, 0, 100, "위험도");
    var durationSeconds = requireInteger_(record.durationSeconds, 0, 86400, "복원 시간");
    if (day < previousDay) throw new Error("복원 날짜의 순서가 올바르지 않습니다.");
    previousDay = day;
    if (durationSeconds > 0 && durationSeconds < 5) requiresReview = true;
    var speedScore = calculateSpeedScore_(durationSeconds, accuracy);
    var recordScore = Math.max(0, accuracy * 100 + speedScore - risk * 10 + 250);
    totalAccuracy += accuracy;
    totalRisk += risk;
    totalTime += durationSeconds;
    directorScore += recordScore;
    return [artId, day, accuracy, risk, durationSeconds];
  });

  var progress = submission.progress && typeof submission.progress === "object" ? submission.progress : {};
  var totalVisitors = safeInteger_(progress.totalVisitors, 0, 999999999);
  var totalMuseumIncome = safeInteger_(progress.totalMuseumIncome, 0, 999999999);
  var gameDay = safeInteger_(progress.day, 1, 999999);
  var storyMilestone = Math.min(
    FINAL_STORY_THRESHOLD,
    Math.floor(safeInteger_(progress.storyMilestone, 0, 999999900) / 100) * 100
  );
  var storyCompletionDay = storyMilestone >= FINAL_STORY_THRESHOLD
    ? safeInteger_(progress.storyCompletionDay, 0, gameDay)
    : 0;
  var restorationScore = directorScore;
  var incomeScore = calculateIncomeScore_(totalMuseumIncome);
  var visitorScore = calculateVisitorScore_(totalVisitors);
  var storySpeedScore = calculateStorySpeedScore_(storyMilestone, storyCompletionDay);
  directorScore += incomeScore + visitorScore + storySpeedScore;
  var properties = PropertiesService.getScriptProperties();
  var salt = properties.getProperty("RANKING_HASH_SALT");
  if (!salt) throw new Error("관리자가 setupRankingSheet를 먼저 실행해야 합니다.");
  return {
    createdAt: new Date(),
    updatedAt: new Date(),
    season: season,
    playerHash: sha256_(salt + ":" + playerId),
    directorName: directorName,
    museumName: museumName,
    restoredCount: compactRecords.length,
    averageAccuracy: Math.round(totalAccuracy / compactRecords.length),
    averageRisk: Math.round(totalRisk / compactRecords.length),
    totalTimeSeconds: totalTime,
    restorationScore: restorationScore,
    directorScore: directorScore,
    totalVisitors: totalVisitors,
    totalMuseumIncome: totalMuseumIncome,
    storyMilestone: storyMilestone,
    storyCompletionDay: storyCompletionDay,
    incomeScore: incomeScore,
    visitorScore: visitorScore,
    storySpeedScore: storySpeedScore,
    gameDay: gameDay,
    upgradeCount: safeInteger_(progress.upgradeCount, 0, 1000),
    submissionId: submissionId,
    gameVersion: submission.gameVersion,
    rulesVersion: submission.rulesVersion,
    recordDigest: sha256_(JSON.stringify(compactRecords)),
    status: requiresReview ? "검토 필요" : "정상"
  };
}

function calculateSpeedScore_(durationSeconds, accuracy) {
  if (accuracy < 80 || durationSeconds <= 0) return 0;
  if (durationSeconds <= 165) return 300;
  if (durationSeconds <= 240) return 200;
  if (durationSeconds <= 300) return 100;
  return 0;
}

function calculateIncomeScore_(totalMuseumIncome) {
  return Math.min(5000, Math.floor(Math.max(0, Number(totalMuseumIncome) || 0) / 25));
}

function calculateVisitorScore_(totalVisitors) {
  return Math.min(5000, Math.floor(Math.max(0, Number(totalVisitors) || 0) / 5));
}

function calculateStorySpeedScore_(storyMilestone, storyCompletionDay) {
  if (Number(storyMilestone) < FINAL_STORY_THRESHOLD || Number(storyCompletionDay) <= 0) return 0;
  if (storyCompletionDay <= 20) return 5000;
  if (storyCompletionDay <= 25) return 4500;
  if (storyCompletionDay <= 35) return 3500;
  if (storyCompletionDay <= 50) return 2500;
  return 1500;
}

function upsertBestScore_(entry) {
  var sheet = getRankingSheet_();
  ensureHeader_(sheet);
  var values = sheet.getDataRange().getValues();
  var existingRow = 0;
  var existing = null;
  for (var row = 1; row < values.length; row += 1) {
    if (String(values[row][2]) === entry.season
      && String(values[row][3]) === entry.playerHash
      && String(values[row][16]) === entry.rulesVersion) {
      existingRow = row + 1;
      existing = rowToEntry_(values[row]);
      break;
    }
  }
  if (existing && !isBetterScore_(entry, existing)) {
    existing.identityUpdated = applyIdentityUpdate_(existing, entry);
    existing.wasUpdated = false;
    if (existing.identityUpdated) {
      sheet.getRange(existingRow, 1, 1, HEADERS.length).setValues([entryToRow_(existing)]);
    }
    return existing;
  }
  if (existing) entry.createdAt = existing.createdAt;
  entry.wasUpdated = Boolean(existing);
  var rowValues = entryToRow_(entry);
  if (existingRow) sheet.getRange(existingRow, 1, 1, HEADERS.length).setValues([rowValues]);
  else sheet.appendRow(rowValues);
  return entry;
}

function applyIdentityUpdate_(existing, entry) {
  var changed = existing.directorName !== entry.directorName || existing.museumName !== entry.museumName;
  if (!changed) return false;
  existing.directorName = entry.directorName;
  existing.museumName = entry.museumName;
  existing.updatedAt = entry.updatedAt;
  return true;
}

function isBetterScore_(candidate, current) {
  if (candidate.status !== "정상" && current.status === "정상") return false;
  if (candidate.status === "정상" && current.status !== "정상") return true;
  if (candidate.directorScore !== current.directorScore) return candidate.directorScore > current.directorScore;
  if (candidate.averageAccuracy !== current.averageAccuracy) return candidate.averageAccuracy > current.averageAccuracy;
  if (candidate.averageRisk !== current.averageRisk) return candidate.averageRisk < current.averageRisk;
  if (candidate.totalTimeSeconds === 0) return false;
  if (current.totalTimeSeconds === 0) return true;
  return candidate.totalTimeSeconds < current.totalTimeSeconds;
}

function readLeaderboard_(season, limit) {
  var sheet = getRankingSheet_();
  ensureHeader_(sheet);
  var values = sheet.getDataRange().getValues();
  return values.slice(1)
    .map(rowToEntry_)
    .filter(function (entry) {
      return entry.season === season && entry.rulesVersion === RANKING_RULES_VERSION && entry.status === "정상";
    })
    .sort(function (a, b) {
      return b.directorScore - a.directorScore
        || b.averageAccuracy - a.averageAccuracy
        || a.averageRisk - b.averageRisk
        || normalizedTime_(a.totalTimeSeconds) - normalizedTime_(b.totalTimeSeconds);
    })
    .slice(0, Math.max(1, Math.min(100, limit || 100)));
}

function normalizedTime_(seconds) {
  return Number(seconds) > 0 ? Number(seconds) : Number.MAX_SAFE_INTEGER;
}

function entryToRow_(entry) {
  return [
    entry.createdAt, entry.updatedAt, entry.season, entry.playerHash, entry.directorName, entry.museumName,
    entry.restoredCount, entry.averageAccuracy, entry.averageRisk, entry.totalTimeSeconds, entry.directorScore,
    entry.totalVisitors, entry.gameDay, entry.upgradeCount, entry.submissionId, entry.gameVersion,
    entry.rulesVersion, entry.recordDigest, entry.status, entry.totalMuseumIncome, entry.storyMilestone,
    entry.storyCompletionDay, entry.incomeScore, entry.visitorScore, entry.storySpeedScore
  ];
}

function rowToEntry_(row) {
  return {
    createdAt: row[0], updatedAt: row[1], season: String(row[2] || ""), playerHash: String(row[3] || ""),
    directorName: String(row[4] || ""), museumName: String(row[5] || ""), restoredCount: Number(row[6]) || 0,
    averageAccuracy: Number(row[7]) || 0, averageRisk: Number(row[8]) || 0, totalTimeSeconds: Number(row[9]) || 0,
    directorScore: Number(row[10]) || 0, totalVisitors: Number(row[11]) || 0, gameDay: Number(row[12]) || 0,
    upgradeCount: Number(row[13]) || 0, submissionId: String(row[14] || ""), gameVersion: String(row[15] || ""),
    rulesVersion: String(row[16] || ""), recordDigest: String(row[17] || ""), status: String(row[18] || "정상"),
    totalMuseumIncome: Number(row[19]) || 0, storyMilestone: Number(row[20]) || 0,
    storyCompletionDay: Number(row[21]) || 0, incomeScore: Number(row[22]) || 0,
    visitorScore: Number(row[23]) || 0, storySpeedScore: Number(row[24]) || 0
  };
}

function getRankingSheet_() {
  var id = PropertiesService.getScriptProperties().getProperty("RANKING_SPREADSHEET_ID");
  if (!id) throw new Error("setupRankingSheet를 한 번 실행해 주세요.");
  var spreadsheet = SpreadsheetApp.openById(id);
  return spreadsheet.getSheetByName(RANKING_SHEET_NAME) || spreadsheet.insertSheet(RANKING_SHEET_NAME);
}

function ensureHeader_(sheet) {
  var current = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (current.join("|") !== HEADERS.join("|")) sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
}

function normalizeSeason_(value) {
  var season = String(value || RANKING_SEASON).normalize("NFKC").trim();
  if (season !== RANKING_SEASON) throw new Error("현재 운영 중인 랭킹 시즌이 아닙니다.");
  return season;
}

function validateName_(value, label, minimum, maximum) {
  var name = String(value || "").normalize("NFKC").replace(/\s+/g, " ").trim();
  if (name.length < minimum || name.length > maximum) throw new Error(label + "의 길이가 올바르지 않습니다.");
  if (!/^[가-힣a-zA-Z0-9][가-힣a-zA-Z0-9\s·&'’-]*$/.test(name)) throw new Error(label + "에 허용되지 않는 문자가 있습니다.");
  if (/(.)\1{4,}/.test(name)) throw new Error(label + "에 같은 글자를 지나치게 반복할 수 없습니다.");
  var compact = name.toLowerCase().replace(/[^가-힣a-z0-9]/g, "");
  if (FORBIDDEN_NAME_TOKENS.some(function (token) { return compact.indexOf(token) !== -1; })) {
    throw new Error(label + "에 공개할 수 없는 표현이 포함되어 있습니다.");
  }
  if (name.replace(/\D/g, "").length >= 7 || /(?:https?:\/\/|www\.|@)/i.test(name)) {
    throw new Error(label + "에 연락처나 인터넷 주소를 넣을 수 없습니다.");
  }
  return name;
}

function requireInteger_(value, minimum, maximum, label) {
  var number = Number(value);
  if (!Number.isFinite(number) || Math.floor(number) !== number || number < minimum || number > maximum) {
    throw new Error(label + " 값이 올바르지 않습니다.");
  }
  return number;
}

function safeInteger_(value, minimum, maximum) {
  var number = Number(value);
  if (!Number.isFinite(number)) return minimum;
  return Math.max(minimum, Math.min(maximum, Math.round(number)));
}

function sha256_(value) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8);
  return bytes.map(function (byte) { return (byte + 256).toString(16).slice(-2); }).join("");
}

function formatNumber_(value) {
  return Math.round(Number(value) || 0).toLocaleString("ko-KR");
}

function formatTime_(seconds) {
  var total = Math.max(0, Math.round(Number(seconds) || 0));
  if (!total) return "미기록";
  var hours = Math.floor(total / 3600);
  var minutes = Math.floor((total % 3600) / 60);
  var rest = total % 60;
  return (hours ? hours + "시간 " : "") + (minutes ? minutes + "분 " : "") + rest + "초";
}

function formatSavedAt_(value) {
  var date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return "미기록";
  return Utilities.formatDate(date, "Asia/Seoul", "yyyy.MM.dd HH:mm:ss") + " KST";
}

function formatStoryCompletion_(entry) {
  return entry.storyCompletionDay > 0 ? formatNumber_(entry.storyCompletionDay) + "일" : "미완주";
}

function escapeHtml_(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" }[character];
  });
}

function baseStyles_() {
  return "<style>"
    + "*{box-sizing:border-box}body{margin:0;padding:24px;color:#654b58;background:linear-gradient(145deg,#fffaf0,#f4eee3);font-family:Arial,'Noto Sans KR',sans-serif}"
    + ".wrap{width:min(1280px,100%);margin:auto}.hero,.card{border:3px solid #ead5c7;border-radius:26px;background:white;box-shadow:0 14px 32px rgba(85,55,66,.1)}"
    + ".hero{width:min(920px,100%);margin-inline:auto;padding:25px;text-align:center;background:linear-gradient(135deg,#fff1b8,#ffd9c8 55%,#dff4e9)}h1{margin:5px 0 8px;font-size:34px}p{line-height:1.6}"
    + ".badge{display:inline-block;padding:7px 11px;border-radius:999px;color:#397258;background:#ebf8f1;font-weight:800}.score{color:#c15f4f;font-size:42px;font-weight:900}"
    + ".grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:16px 0}.grid div{padding:12px 7px;border:2px solid #ead9cd;border-radius:15px;background:#fff}.grid span,.grid strong{display:block}.grid span{font-size:11px;color:#987e88}.grid strong{margin-top:4px;font-size:18px}"
    + ".card{margin-top:18px;padding:18px;overflow:auto}table{width:100%;border-collapse:collapse;min-width:1040px}th,td{padding:12px 9px;border-bottom:1px solid #eadfd7;text-align:left}th{color:#95727d;font-size:11px}th small{display:block;margin-top:3px;font:inherit;color:#b198a1}td strong{color:#bd5d50}.rank{width:54px;font-size:18px;font-weight:900}.row-saved-at{display:block;margin-top:5px;white-space:nowrap;font-size:11px;color:#806a74}"
    + ".identity{margin:4px 0;font-weight:900}.saved-at{display:inline-block;margin:2px 0 8px;padding:7px 11px;border-radius:999px;color:#765f69;background:rgba(255,255,255,.7);font-size:12px;font-weight:800}.notice{padding:12px 14px;border-radius:14px;color:#527363;background:#eaf7f0;font-weight:700}.moderation-notice{margin:14px 4px 2px;padding:11px 13px;border-radius:13px;color:#7b6069;background:#fff4e8;font-size:12px;font-weight:700;text-align:center}button,a.button{display:inline-block;margin-top:14px;padding:12px 18px;border:0;border-radius:14px;color:white;background:linear-gradient(145deg,#ff9474,#e86661);font-weight:900;text-decoration:none;cursor:pointer}"
    + "@media(max-width:620px){body{padding:10px}.hero{padding:19px 12px}h1{font-size:27px}.grid{grid-template-columns:1fr 1fr}.score{font-size:34px}.card{padding:8px}}"
    + "</style>";
}

function renderLeaderboardRows_(leaders) {
  if (!leaders.length) return "<tr><td colspan='10'>아직 등록된 기록이 없습니다. 첫 관장이 되어 보세요.</td></tr>";
  return leaders.map(function (entry, index) {
    return "<tr><td class='rank'>" + (index + 1) + "</td><td><strong>" + escapeHtml_(entry.directorName) + "</strong></td>"
      + "<td>" + escapeHtml_(entry.museumName) + "<span class='row-saved-at'>저장 " + escapeHtml_(formatSavedAt_(entry.updatedAt)) + "</span></td>"
      + "<td>" + formatNumber_(entry.restoredCount) + "점</td>"
      + "<td>" + formatNumber_(entry.totalMuseumIncome) + "코인</td><td>" + formatNumber_(entry.totalVisitors) + "명</td>"
      + "<td>" + escapeHtml_(formatStoryCompletion_(entry)) + "</td>"
      + "<td>" + formatNumber_(entry.averageAccuracy) + "%</td><td>" + formatNumber_(entry.averageRisk) + "%</td>"
      + "<td><strong>" + formatNumber_(entry.directorScore) + "점</strong></td></tr>";
  }).join("");
}

function leaderboardTable_(leaders) {
  return "<div class='card'><table><thead><tr><th>순위</th><th>관장</th><th>미술관<small>저장 시각</small></th><th>복원</th><th>누적 수입</th><th>누적 관람객</th><th>이야기 완주</th><th>정확도</th><th>위험도</th><th>관장 점수</th></tr></thead>"
    + "<tbody>" + renderLeaderboardRows_(leaders) + "</tbody></table>"
    + "<p class='moderation-notice'>욕설, 개인정보 노출 등 타인에게 피해를 줄 수 있는 내용은 관리자가 임의로 수정하거나 숨김 처리할 수 있습니다.</p></div>";
}

function closeRankingButton_() {
  return "<button type='button' onclick='closeRankingTab()'>랭킹 탭 닫고 게임으로 돌아가기</button>"
    + "<p id='closeHint' style='display:none;margin:10px 0 0;color:#8b6f78;font-size:12px;font-weight:700' role='status'>탭이 닫히지 않으면 Ctrl+W 또는 브라우저의 탭 닫기 버튼을 눌러 주세요.</p>"
    + "<script>function closeRankingTab(){try{window.top.close();}catch(error){try{window.close();}catch(ignore){}}setTimeout(function(){var hint=document.getElementById('closeHint');if(hint)hint.style.display='block';},250);}<\/script>";
}

function renderLeaderboardPage_(leaders, season) {
  return "<!doctype html><html lang='ko'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>"
    + baseStyles_() + "</head><body><main class='wrap'><section class='hero'><span class='badge'>" + escapeHtml_(season) + "</span>"
    + "<h1>🏆 반짝 복원 미술관 관장 랭킹</h1><p>복원 성과와 누적 개관 수입·관람객·이야기 완주 속도를 서버에서 다시 계산한 순위입니다.</p>"
    + closeRankingButton_() + "</section>"
    + leaderboardTable_(leaders) + "</main></body></html>";
}

function renderReceiptPage_(entry, rank, leaders) {
  var title = entry.status === "정상"
    ? (entry.wasUpdated ? "최고 기록을 갱신했습니다!" : (entry.identityUpdated ? "관장 명패를 반영했습니다!" : "랭킹 등록 완료!"))
    : "기록 검토가 필요합니다";
  var message = entry.status === "정상"
    ? (entry.identityUpdated
      ? "변경한 관장명과 미술관명을 반영했고, 최고 기록은 그대로 유지했습니다."
      : (rank ? "현재 " + rank + "위입니다. 같은 관장이 다시 제출하면 더 높은 기록만 남습니다." : "기록을 안전하게 저장했습니다."))
    : "비현실적으로 짧은 작업 시간이 감지되어 공개 순위에는 아직 반영하지 않았습니다.";
  return "<!doctype html><html lang='ko'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>"
    + baseStyles_() + "</head><body><main class='wrap'><section class='hero'><span class='badge'>" + escapeHtml_(entry.season) + "</span>"
    + "<h1>" + escapeHtml_(title) + "</h1><p class='identity'>" + escapeHtml_(entry.directorName) + " 관장 · " + escapeHtml_(entry.museumName) + "</p>"
    + "<div class='score'>" + formatNumber_(entry.directorScore) + "점</div><p>" + escapeHtml_(message) + "</p>"
    + "<p class='saved-at'>랭킹 저장 시각 · " + escapeHtml_(formatSavedAt_(entry.updatedAt)) + "</p>"
    + "<div class='grid'><div><span>복원 작품</span><strong>" + formatNumber_(entry.restoredCount) + "점</strong></div>"
    + "<div><span>평균 정확도</span><strong>" + formatNumber_(entry.averageAccuracy) + "%</strong></div>"
    + "<div><span>평균 위험도</span><strong>" + formatNumber_(entry.averageRisk) + "%</strong></div>"
    + "<div><span>총 작업 시간</span><strong>" + escapeHtml_(formatTime_(entry.totalTimeSeconds)) + "</strong></div>"
    + "<div><span>누적 개관 수입</span><strong>" + formatNumber_(entry.totalMuseumIncome) + "코인</strong></div>"
    + "<div><span>누적 관람객</span><strong>" + formatNumber_(entry.totalVisitors) + "명</strong></div>"
    + "<div><span>이야기 완주</span><strong>" + escapeHtml_(formatStoryCompletion_(entry)) + "</strong></div></div>"
    + "<p class='notice'>운영 보너스 · 수입 +" + formatNumber_(entry.incomeScore) + "점 · 관람객 +" + formatNumber_(entry.visitorScore) + "점 · 이야기 +" + formatNumber_(entry.storySpeedScore) + "점</p>"
    + "<p class='notice'>전체 저장 파일과 보유 코인은 저장하지 않습니다. 공개 랭킹에는 관장 이름·미술관 이름·복원 성과·누적 개관 수입·누적 관람객·이야기 완주일만 표시됩니다.</p>"
    + closeRankingButton_() + "</section>" + leaderboardTable_(leaders) + "</main></body></html>";
}

function renderErrorPage_(title, message) {
  return "<!doctype html><html lang='ko'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>"
    + baseStyles_() + "</head><body><main class='wrap'><section class='hero'><h1>⚠️ " + escapeHtml_(title) + "</h1>"
    + "<p>" + escapeHtml_(message || "잠시 후 다시 시도해 주세요.") + "</p>" + closeRankingButton_() + "</section></main></body></html>";
}
