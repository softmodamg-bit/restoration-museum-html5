import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../ranking-apps-script.gs", import.meta.url), "utf8");
const scriptProperties = new Map([
  ["RANKING_HASH_SALT", "test-only-salt"],
  ["RANKING_SPREADSHEET_ID", "test-sheet"]
]);
const context = vm.createContext({
  console,
  PropertiesService: {
    getScriptProperties() {
      return {
        getProperty(key) { return scriptProperties.get(key) || null; },
        setProperty(key, value) { scriptProperties.set(key, value); }
      };
    }
  },
  Utilities: {
    DigestAlgorithm: { SHA_256: "SHA_256" },
    Charset: { UTF_8: "UTF_8" },
    computeDigest(_algorithm, value) {
      return Array.from(crypto.createHash("sha256").update(String(value), "utf8").digest())
        .map(byte => byte > 127 ? byte - 256 : byte);
    },
    getUuid() { return crypto.randomUUID(); },
    formatDate() { return "2026.08.05 14:30:00"; }
  }
});

vm.runInContext(source, context, { filename: "ranking-apps-script.gs" });

const validSubmission = {
  format: "sparkle-restoration-ranking-submission",
  schemaVersion: 1,
  season: "공모전 시즌 1",
  gameVersion: "prototype-2026-08",
  rulesVersion: "director-score-v3",
  submissionId: "director-score-v3-test123",
  playerId: "player-test-1234567890",
  directorName: "서리",
  museumName: "반짝 복원 미술관",
  progress: {
    day: 25,
    totalVisitors: 1200,
    totalMuseumIncome: 25000,
    storyMilestone: 2500,
    storyCompletionDay: 25,
    upgradeCount: 2
  },
  records: [
    { artId: "moon-jar", day: 1, accuracy: 96, risk: 4, durationSeconds: 150 },
    { artId: "paper-01", day: 2, accuracy: 90, risk: 10, durationSeconds: 300 }
  ]
};

const scored = context.validateAndScore_(validSubmission);
assert.equal(scored.restoredCount, 2);
assert.equal(scored.averageAccuracy, 93);
assert.equal(scored.averageRisk, 7);
assert.equal(scored.restorationScore, 19360);
assert.equal(scored.incomeScore, 1000);
assert.equal(scored.visitorScore, 240);
assert.equal(scored.storySpeedScore, 4500);
assert.equal(scored.directorScore, 25100);
assert.equal(scored.totalMuseumIncome, 25000);
assert.equal(scored.totalVisitors, 1200);
assert.equal(scored.storyCompletionDay, 25);
assert.equal(scored.status, "정상");
assert.equal(scored.playerHash.length, 64);

const unfinishedStory = context.validateAndScore_({
  ...validSubmission,
  submissionId: "director-score-v3-unfinished",
  progress: { ...validSubmission.progress, storyMilestone: 2200, storyCompletionDay: 20 }
});
assert.equal(unfinishedStory.storyCompletionDay, 0);
assert.equal(unfinishedStory.storySpeedScore, 0);

const cappedOperations = context.validateAndScore_({
  ...validSubmission,
  submissionId: "director-score-v3-capped",
  progress: { ...validSubmission.progress, totalVisitors: 999999999, totalMuseumIncome: 999999999 }
});
assert.equal(cappedOperations.visitorScore, 5000);
assert.equal(cappedOperations.incomeScore, 5000);

assert.throws(
  () => context.validateAndScore_({
    ...validSubmission,
    records: [validSubmission.records[0], validSubmission.records[0]]
  }),
  /중복되거나 잘못된 작품 기록/
);

assert.throws(
  () => context.validateAndScore_({ ...validSubmission, directorName: "도박왕" }),
  /공개할 수 없는 표현/
);

const receiptHtml = context.renderReceiptPage_(scored, 1, [scored]);
assert.match(receiptHtml, /랭킹 탭 닫고 게임으로 돌아가기/);
assert.match(receiptHtml, /window\.top\.close\(\)/);
assert.match(receiptHtml, /RESTORATION_RANKING_RETURN/);
assert.match(receiptHtml, /전체 저장 파일과 보유 코인은 저장하지 않습니다/);
assert.match(receiptHtml, /욕설, 개인정보 노출 등 타인에게 피해를 줄 수 있는 내용은 관리자가 임의로 수정하거나 숨김 처리할 수 있습니다/);
assert.match(receiptHtml, /랭킹 저장 시각 · 2026\.08\.05 14:30:00 KST/);
assert.match(receiptHtml, /누적 개관 수입/);
assert.match(receiptHtml, /누적 관람객/);
assert.match(receiptHtml, /이야기 완주/);
assert.match(receiptHtml, /운영 보너스/);
assert.match(receiptHtml, /<small>저장 시각<\/small>/);
assert.match(receiptHtml, /class='row-saved-at'>저장 2026\.08\.05 14:30:00 KST/);

const leaderboardHtml = context.renderLeaderboardPage_([scored], "공모전 시즌 1");
assert.match(leaderboardHtml, /랭킹 탭 닫고 게임으로 돌아가기/);
assert.match(leaderboardHtml, /window\.top\.close\(\)/);
assert.match(leaderboardHtml, /RESTORATION_RANKING_RETURN/);
assert.match(leaderboardHtml, /\.wrap\{width:min\(1280px,100%\)/);
assert.match(leaderboardHtml, /\.hero\{width:min\(920px,100%\);margin-inline:auto/);
assert.match(leaderboardHtml, /table\{width:100%;border-collapse:collapse;min-width:1040px\}/);
assert.doesNotMatch(leaderboardHtml, /\.wrap\{width:min\(920px,100%\)/);
assert.match(leaderboardHtml, /욕설, 개인정보 노출 등 타인에게 피해를 줄 수 있는 내용은 관리자가 임의로 수정하거나 숨김 처리할 수 있습니다/);
assert.match(leaderboardHtml, /누적 수입/);
assert.match(leaderboardHtml, /누적 관람객/);
assert.match(leaderboardHtml, /이야기 완주/);

const storedIdentity = { directorName: "서리", museumName: "반짝 복원 미술관", updatedAt: new Date(0) };
const identityChanged = context.applyIdentityUpdate_(storedIdentity, {
  directorName: "윤슬",
  museumName: "새빛 미술관",
  updatedAt: new Date(1000)
});
assert.equal(identityChanged, true);
assert.equal(storedIdentity.directorName, "윤슬");
assert.equal(storedIdentity.museumName, "새빛 미술관");
const identityReceiptHtml = context.renderReceiptPage_({ ...scored, ...storedIdentity, identityUpdated: true }, 1, [scored]);
assert.match(identityReceiptHtml, /관장 명패를 반영했습니다/);
assert.match(identityReceiptHtml, /최고 기록은 그대로 유지했습니다/);

console.log("Ranking backend validation passed: score=25,100, capped operation bonuses, 25-day story bonus, identity refresh, timestamp and rejection passed");
