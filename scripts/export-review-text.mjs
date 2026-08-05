import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const outputPath = path.resolve(process.argv[2] || path.join(rootDir, "TEXT_REVIEW_EXPORT.md"));

const gameSource = fs.readFileSync(path.join(rootDir, "js", "game.js"), "utf8");
const artworkSource = fs.readFileSync(path.join(rootDir, "js", "artworks-data.js"), "utf8");
const htmlSource = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
const rankingSource = fs.readFileSync(path.join(rootDir, "ranking-apps-script.gs"), "utf8");
const rankingConfigSource = fs.readFileSync(path.join(rootDir, "js", "ranking-config.js"), "utf8");
const cssSource = fs.readFileSync(path.join(rootDir, "styles.css"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function extractConstant(source, name) {
  const marker = new RegExp(`\\bconst\\s+${name}\\s*=`);
  const match = marker.exec(source);
  assert(match, `상수 ${name}을 찾지 못했습니다.`);

  let index = match.index + match[0].length;
  while (/\s/.test(source[index])) index += 1;
  const opening = source[index];
  assert(opening === "[" || opening === "{", `${name}은 배열이나 객체 리터럴이어야 합니다.`);

  const pairs = { "[": "]", "{": "}", "(": ")" };
  const stack = [];
  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let cursor = index; cursor < source.length; cursor += 1) {
    const character = source[cursor];
    const next = source[cursor + 1];

    if (lineComment) {
      if (character === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (character === "*" && next === "/") {
        blockComment = false;
        cursor += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = "";
      }
      continue;
    }
    if (character === "/" && next === "/") {
      lineComment = true;
      cursor += 1;
      continue;
    }
    if (character === "/" && next === "*") {
      blockComment = true;
      cursor += 1;
      continue;
    }
    if (character === "'" || character === '"' || character === "`") {
      quote = character;
      continue;
    }
    if (pairs[character]) {
      stack.push(pairs[character]);
      continue;
    }
    if (stack.at(-1) === character) {
      stack.pop();
      if (!stack.length) return source.slice(index, cursor + 1);
    }
  }

  throw new Error(`${name} 리터럴의 끝을 찾지 못했습니다.`);
}

function evaluateConstant(name, context = {}) {
  const expression = extractConstant(gameSource, name);
  return vm.runInNewContext(`(${expression})`, context, { timeout: 3000 });
}

function step(name, instruction, tool, diagnosis, targets) {
  return { name, instruction, tool, diagnosis, targets };
}

const tools = evaluateConstant("TOOLS");
const musicThemes = evaluateConstant("MUSIC_THEMES");
const mechanicNames = evaluateConstant("MECHANIC_NAMES");
const mechanicEasyNames = evaluateConstant("MECHANIC_EASY_NAMES");
const easyReplacements = evaluateConstant("EASY_COPY_REPLACEMENTS");
const mechanicGuides = evaluateConstant("MECHANIC_GUIDES");
const toolGuides = evaluateConstant("TOOL_MECHANIC_GUIDES");
const materialGuides = evaluateConstant("MATERIAL_GUIDES");
const defaultMaterialGuide = evaluateConstant("DEFAULT_MATERIAL_GUIDE");
const upgrades = evaluateConstant("UPGRADES");
const annexPrograms = evaluateConstant("ANNEX_PROGRAMS");
const practiceChallenges = evaluateConstant("PRACTICE_CHALLENGES", { step });
const dayEvents = evaluateConstant("DAY_EVENTS");
const prologueStory = evaluateConstant("PROLOGUE_STORY");
const storyChapters = evaluateConstant("STORY_CHAPTERS");
const coreArtworks = evaluateConstant("CORE_ARTWORKS", { step });

const artworkSandbox = { window: {} };
vm.runInNewContext(artworkSource, artworkSandbox, { timeout: 5000 });
const generatedArtworks = artworkSandbox.window.RESTORATION_ARTWORKS;
assert(Array.isArray(generatedArtworks), "생성 작품 데이터를 불러오지 못했습니다.");
const artworks = [...coreArtworks, ...generatedArtworks];
assert(artworks.length === 500, `작품 수가 500점이 아닙니다: ${artworks.length}`);

const easyCopyParticles = /^(?:을|를|이|가|은|는|과|와|으로|로)$/;
const easyCopyParticleSuffix = "(으로|로|을|를|이|가|은|는|과|와)?";
const finalConsonantDigits = new Set(["0", "1", "3", "6", "7", "8"]);

function escapeEasyCopyPattern(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function finalConsonantIndex(value) {
  const cleaned = String(value).trim().replace(/[\s.!?,:;~…'"”’）)\]}]+$/g, "");
  const lastCharacter = Array.from(cleaned).at(-1) || "";
  const code = lastCharacter.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28;
  if (/\d/.test(lastCharacter)) return finalConsonantDigits.has(lastCharacter) ? 1 : 0;
  return null;
}

function hasFinalConsonant(value) {
  const index = finalConsonantIndex(value);
  return index !== null && index !== 0;
}

function particleForEasyCopy(value, particle) {
  if (!easyCopyParticles.test(particle)) return particle;
  const consonantIndex = finalConsonantIndex(value);
  if (consonantIndex === null) return particle;
  if (particle === "으로" || particle === "로") return consonantIndex !== 0 && consonantIndex !== 8 ? "으로" : "로";
  const pair = {
    "을": ["을", "를"], "를": ["을", "를"],
    "이": ["이", "가"], "가": ["이", "가"],
    "은": ["은", "는"], "는": ["은", "는"],
    "과": ["과", "와"], "와": ["과", "와"]
  }[particle];
  return pair?.[hasFinalConsonant(value) ? 0 : 1] || particle;
}

function replaceEasyCopyTerm(copy, formal, easy) {
  const pattern = new RegExp(`${escapeEasyCopyPattern(formal)}${easyCopyParticleSuffix}`, "g");
  const replaced = copy.replace(pattern, (_, particle = "") => `${easy}${particleForEasyCopy(easy, particle)}`);
  const duplicate = new RegExp(`(${escapeEasyCopyPattern(easy)})(?:\\s+\\1)+`, "g");
  return replaced.replace(duplicate, "$1");
}

function collapseRepeatedEojeol(value) {
  let copy = String(value);
  let previous = "";
  while (copy !== previous) {
    previous = copy;
    copy = copy.replace(/(^|\s)([^\s]+)(?:\s+\2)+(?=\s|$)/g, "$1$2");
  }
  return copy;
}

function easyCopy(value) {
  const replaced = easyReplacements.reduce(
    (copy, [formal, easy]) => replaceEasyCopyTerm(copy, formal, easy),
    String(value ?? "")
  );
  return collapseRepeatedEojeol(replaced);
}

function decodeEntities(value) {
  const entities = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", middot: "·"
  };
  return String(value)
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => entities[name] ?? match);
}

function normalizeText(value) {
  return decodeEntities(value)
    .replace(/\r/g, "")
    .replace(/\n/g, " ")
    .replace(/\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function markdown(value) {
  return normalizeText(value).replace(/\|/g, "\\|");
}

function unique(values) {
  return [...new Set(values.map(normalizeText).filter(Boolean))];
}

function extractHtmlText(source) {
  const withoutCode = source
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const textNodes = [...withoutCode.matchAll(/>([^<>]+)</g)]
    .map(match => match[1])
    .map(normalizeText)
    .filter(text => text && !/^[-–—·•|]+$/.test(text));
  const semanticAttributes = [...withoutCode.matchAll(/\b(?:aria-label|title|placeholder|alt)=(?:"([^"]*)"|'([^']*)')/gi)]
    .map(match => match[1] ?? match[2])
    .map(normalizeText)
    .filter(Boolean);
  return { textNodes: unique(textNodes), semanticAttributes: unique(semanticAttributes) };
}

function cleanTemplateFragment(value) {
  return String(value)
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\([`'"\\])/g, "$1");
}

function scanStringLiterals(source, fileLabel, skippedLineRanges = []) {
  const results = [];
  const lineStarts = [0];
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === "\n") lineStarts.push(index + 1);
  }

  function lineAt(index) {
    let low = 0;
    let high = lineStarts.length;
    while (low + 1 < high) {
      const middle = Math.floor((low + high) / 2);
      if (lineStarts[middle] <= index) low = middle;
      else high = middle;
    }
    return low + 1;
  }

  function addCandidate(raw, sourceIndex) {
    const startLine = lineAt(sourceIndex);
    if (skippedLineRanges.some(([start, end]) => startLine >= start && startLine <= end)) return;
    const fragments = cleanTemplateFragment(raw)
      .split(/\n+/)
      .map(normalizeText)
      .filter(Boolean);
    for (const cleaned of fragments) {
      if (cleaned.length < 2) continue;
      const semanticText = cleaned.replace(/\{\{값\}\}/g, "");
      const hasKorean = /[가-힣]/.test(semanticText);
      const visibleEnglish = /(?:ART MUSEUM|CASUAL ART RESTORATION|CONSERVATION|DIRECTOR LEADERBOARD|MUSEUM STORY|START STORY|PRACTICE|BGM)/i.test(cleaned);
      if (!hasKorean && !visibleEnglish) continue;
      if (/^[.#][a-z0-9_-]+$/i.test(cleaned) || /\[data-[^\]]+\]/i.test(cleaned)) continue;
      results.push({ text: easyCopy(cleaned), reference: `${fileLabel} L${startLine}` });
    }
  }

  function previousSignificantCharacter(index) {
    for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
      if (!/\s/.test(source[cursor])) return source[cursor];
    }
    return "";
  }

  function skipRegex(index) {
    const previous = previousSignificantCharacter(index);
    if (previous && !/[({[=,:;!?&|]/.test(previous)) return index;
    let inClass = false;
    let escaped = false;
    for (let cursor = index + 1; cursor < source.length; cursor += 1) {
      const character = source[cursor];
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === "[") inClass = true;
      else if (character === "]") inClass = false;
      else if (character === "/" && !inClass) {
        while (/[a-z]/i.test(source[cursor + 1])) cursor += 1;
        return cursor + 1;
      } else if (character === "\n") {
        return index;
      }
    }
    return index;
  }

  function readQuoted(index, quote) {
    let raw = "";
    let escaped = false;
    for (let cursor = index + 1; cursor < source.length; cursor += 1) {
      const character = source[cursor];
      if (escaped) {
        raw += `\\${character}`;
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        addCandidate(raw, index);
        return cursor + 1;
      } else {
        raw += character;
      }
    }
    return source.length;
  }

  function scanCode(index, stopAtClosingBrace = false) {
    let braceDepth = 0;
    while (index < source.length) {
      const character = source[index];
      const next = source[index + 1];
      if (stopAtClosingBrace && character === "}" && braceDepth === 0) return index + 1;
      if (character === "/" && next === "/") {
        const newline = source.indexOf("\n", index + 2);
        index = newline < 0 ? source.length : newline + 1;
        continue;
      }
      if (character === "/" && next === "*") {
        const end = source.indexOf("*/", index + 2);
        index = end < 0 ? source.length : end + 2;
        continue;
      }
      if (character === "/") {
        const regexEnd = skipRegex(index);
        if (regexEnd !== index) {
          index = regexEnd;
          continue;
        }
      }
      if (character === "'" || character === '"') {
        index = readQuoted(index, character);
        continue;
      }
      if (character === "`") {
        index = readTemplate(index);
        continue;
      }
      if (stopAtClosingBrace && character === "{") braceDepth += 1;
      else if (stopAtClosingBrace && character === "}") braceDepth -= 1;
      index += 1;
    }
    return index;
  }

  function readTemplate(index) {
    let raw = "";
    const startIndex = index;
    let escaped = false;
    for (let cursor = index + 1; cursor < source.length; cursor += 1) {
      const character = source[cursor];
      const next = source[cursor + 1];
      if (escaped) {
        raw += `\\${character}`;
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === "`") {
        addCandidate(raw, startIndex);
        return cursor + 1;
      } else if (character === "$" && next === "{") {
        raw += "{{값}}";
        cursor = scanCode(cursor + 2, true) - 1;
      } else {
        raw += character;
      }
    }
    return source.length;
  }

  scanCode(0);
  return results;
}

function constantLineRange(source, name) {
  const expression = extractConstant(source, name);
  const marker = new RegExp(`\\bconst\\s+${name}\\s*=`).exec(source);
  const start = source.slice(0, marker.index).split("\n").length;
  const expressionStart = source.indexOf(expression, marker.index);
  const end = source.slice(0, expressionStart + expression.length).split("\n").length;
  return [start, end];
}

function variableArrayLineRange(source, name) {
  const marker = new RegExp(`\\b(?:const|var)\\s+${name}\\s*=`).exec(source);
  assert(marker, `배열 ${name}을 찾지 못했습니다.`);
  const endIndex = source.indexOf("];", marker.index);
  assert(endIndex >= 0, `배열 ${name}의 끝을 찾지 못했습니다.`);
  return [
    source.slice(0, marker.index).split("\n").length,
    source.slice(0, endIndex + 2).split("\n").length
  ];
}

const structuredConstantNames = [
  "MUSIC_THEMES", "TOOLS", "CORE_ARTWORKS", "MECHANIC_NAMES", "MECHANIC_EASY_NAMES",
  "EASY_COPY_REPLACEMENTS", "MECHANIC_GUIDES", "TOOL_MECHANIC_GUIDES", "MATERIAL_GUIDES",
  "DEFAULT_MATERIAL_GUIDE", "UPGRADES", "ANNEX_PROGRAMS", "PRACTICE_CHALLENGES", "DAY_EVENTS",
  "PROLOGUE_STORY", "STORY_CHAPTERS", "FORBIDDEN_NAME_TOKENS"
];
const skippedGameRanges = structuredConstantNames.map(name => constantLineRange(gameSource, name));
const skippedRankingRanges = [variableArrayLineRange(rankingSource, "FORBIDDEN_NAME_TOKENS")];
const dynamicCandidates = [
  ...scanStringLiterals(gameSource, "js/game.js", skippedGameRanges),
  ...scanStringLiterals(rankingSource, "ranking-apps-script.gs", skippedRankingRanges),
  ...scanStringLiterals(rankingConfigSource, "js/ranking-config.js")
];
const dynamicMap = new Map();
for (const candidate of dynamicCandidates) {
  const text = normalizeText(candidate.text);
  if (!dynamicMap.has(text)) dynamicMap.set(text, []);
  const references = dynamicMap.get(text);
  if (!references.includes(candidate.reference) && references.length < 6) references.push(candidate.reference);
}

const cssContentTexts = unique(
  [...cssSource.matchAll(/content:\s*(?:"([^"]*)"|'([^']*)')/g)]
    .map(match => match[1] ?? match[2])
    .filter(text => /[가-힣A-Za-z]/.test(text))
);
const htmlText = extractHtmlText(htmlSource);

const lines = [];
const write = (...values) => lines.push(...values);

write(
  "# 반짝! 복원 미술관 전체 텍스트 검수본",
  "",
  `- 생성일: ${new Date().toISOString().slice(0, 10)}`,
  `- 작품: ${artworks.length}점 (핵심 ${coreArtworks.length} + 생성 ${generatedArtworks.length})`,
  `- 미니게임: ${Object.keys(mechanicNames).length}종`,
  "- 기준: 실제 화면에 표시되는 쉬운말을 우선 수록하고, 학습용 정식 복원 용어는 별도로 함께 표시했습니다.",
  "- 제외: 코드 식별자, CSS 클래스, 저장 키, 욕설 차단용 내부 목록, 음원 파일명처럼 플레이어에게 보이지 않는 값",
  "- 검수 요청: 맞춤법·띄어쓰기·조사, 초등학생 이상 난이도, 용어 일관성, 어색한 번역투, 같은 뜻의 다른 표현을 중점적으로 확인해 주세요.",
  ""
);

write("## 1. 첫 화면·공통 UI 고정 문구", "", "### 화면 본문", "");
for (const text of htmlText.textNodes) write(`- ${text}`);
write("", "### 접근성 이름·도움말", "");
for (const text of htmlText.semanticAttributes) write(`- ${text}`);
if (cssContentTexts.length) {
  write("", "### CSS로 표시되는 문구", "");
  for (const text of cssContentTexts) write(`- ${text}`);
}

write("", "## 2. 배경음악 이름", "", "| 공간 | 음악 이름 |", "| --- | --- |");
for (const [id, theme] of Object.entries(musicThemes)) write(`| ${id} | ${markdown(theme.label)} |`);

write("", "## 3. 도구 문구", "", "| ID | 표시 이름 | 설명 |", "| --- | --- | --- |");
for (const [id, tool] of Object.entries(tools)) write(`| ${id} | ${markdown(tool.name)} | ${markdown(tool.desc)} |`);

write("", `## 4. 미니게임 ${Object.keys(mechanicNames).length}종`, "");
for (const challenge of practiceChallenges) {
  const id = challenge.id;
  const guide = mechanicGuides[id];
  write(
    `### ${challenge.icon} ${mechanicEasyNames[id]}`,
    "",
    `- ID: \`${id}\``,
    `- 배우는 정식 용어: ${mechanicNames[id]}`,
    `- 연습 분류: ${challenge.difficulty}`,
    `- 지금 할 일: ${easyCopy(challenge.copy)}`,
    `- 쉽게 설명: ${easyCopy(guide.easy)}`,
    `- 작품에 좋은 점: ${easyCopy(guide.impact)}`,
    `- 연습 단계 이름: ${easyCopy(challenge.step.name)}`,
    `- 조작 안내: ${easyCopy(challenge.step.instruction)}`,
    `- 상태 기록 안내: ${easyCopy(challenge.step.diagnosis)}`,
    `- 연습 도구: ${tools[challenge.step.tool]?.name || challenge.step.tool}`,
    ""
  );
}

write("## 5. 도구별 쉬운 설명", "");
for (const [toolId, guide] of Object.entries(toolGuides)) {
  write(`### ${tools[toolId]?.icon || "🧰"} ${tools[toolId]?.name || toolId}`, "", `- 쉽게 설명: ${easyCopy(guide.easy)}`, `- 작품에 좋은 점: ${easyCopy(guide.impact)}`, "");
}

write("## 6. 재질별 안내", "");
for (const [material, guide] of Object.entries(materialGuides)) {
  write(`### ${material}`, "", `- 살펴볼 점: ${easyCopy(guide.watch)}`, `- 작품에 좋은 점: ${easyCopy(guide.effect)}`, "");
}
write("### 그 밖의 재질", "", `- 살펴볼 점: ${easyCopy(defaultMaterialGuide.watch)}`, `- 작품에 좋은 점: ${easyCopy(defaultMaterialGuide.effect)}`, "");

write("## 7. 시설 업그레이드와 편의동 프로그램", "", "### 시설 업그레이드", "", "| 분류 | 시설 | 설명 | 비용 |", "| --- | --- | --- | ---: |");
for (const upgrade of upgrades) write(`| ${markdown(upgrade.category)} | ${upgrade.icon} ${markdown(upgrade.name)} | ${markdown(upgrade.desc)} | ${upgrade.cost} |`);
for (const [facilityId, programs] of Object.entries(annexPrograms)) {
  const facilityName = upgrades.find(item => item.id === facilityId)?.name || facilityId;
  write("", `### ${facilityName} 프로그램`, "");
  for (const program of programs) {
    write(`- ${program.icon} **${program.name}**`, `  - 안내: ${program.copy}`, `  - 결과: ${program.result}`);
  }
}

write("", "## 8. 이야기와 하루 이벤트", "", "### 처음 이야기", "");
write(`- 표지: ${easyCopy(prologueStory.label)}`, `- 제목: ${easyCopy(prologueStory.title)}`, `- 본문: ${easyCopy(prologueStory.text)}`, `- 윤슬의 말: ${easyCopy(prologueStory.quote)}`, "");
write("### 이야기 목록", "");
for (const story of storyChapters) {
  write(`#### ${story.icon} ${easyCopy(story.title)}`, "", `- 열리는 전시 매력도: ${story.threshold}`, `- 본문: ${easyCopy(story.text)}`, `- 윤슬의 말: ${easyCopy(story.quote)}`, "");
}
write("### 하루 이벤트", "");
dayEvents.forEach((event, index) => write(`${index + 1}. ${easyCopy(event.text)}`));

write("", "## 9. 쉬운말 변환 사전", "", "| 정식·어려운 표현 | 화면의 쉬운 표현 |", "| --- | --- |");
for (const [formal, easy] of easyReplacements) write(`| ${markdown(formal)} | ${markdown(easy)} |`);

write("", "## 10. 작품 500점 전체 텍스트", "");
artworks.forEach((art, artworkIndex) => {
  write(
    `### ${String(artworkIndex + 1).padStart(3, "0")}. ${art.title}`,
    "",
    `- 작품 ID: \`${art.id}\``,
    `- 재질: ${art.material}`,
    `- 분류 문구: ${art.rarity}`,
    `- 시대: ${easyCopy(art.era)}`,
    `- 작가: ${easyCopy(art.artist)}`,
    `- 작품 종류: ${easyCopy(art.artType)}`,
    `- 어디서 왔나요?: ${easyCopy(art.origin)}`,
    `- 작품 가치: ${easyCopy(art.culturalValue)}`,
    `- 작품 이야기: ${easyCopy(art.story)}`,
    `- 손상 설명: ${easyCopy(art.damage)}`,
    `- 복원 완료 요약: ${easyCopy(art.summary)}`,
    `- 복원 윤리 설명: ${easyCopy(art.ethics)}`,
    `- 가상 작품 여부: ${art.fictional ? "게임을 위해 만든 가상 작품" : "실제 자료 기반"}`,
    "",
    "#### 복원 단계",
    ""
  );
  art.steps.forEach((artStep, stepIndex) => {
    write(
      `${stepIndex + 1}. **${easyCopy(artStep.name)}**`,
      `   - 안내: ${easyCopy(artStep.instruction)}`,
      `   - 상태 기록: ${easyCopy(artStep.diagnosis)}`,
      `   - 도구: ${tools[artStep.tool]?.name || artStep.tool}`
    );
  });
  write("");
});

write(
  "## 11. 동적으로 조합되는 나머지 화면 문구",
  "",
  "아래 목록은 상수 표와 작품 데이터에 들어 있지 않은 버튼, 성공·실패, 비서 안내, 관람객 말풍선, 결과, 랭킹 문구를 소스에서 추가로 추출한 것입니다. `{{값}}`은 작품명·금액·점수처럼 실행 중 바뀌는 자리입니다.",
  ""
);
for (const [text, references] of [...dynamicMap.entries()].sort((a, b) => a[0].localeCompare(b[0], "ko"))) {
  write(`- ${text}`, `  - 위치: ${references.join(", ")}`);
}

write(
  "",
  "## 12. 클로드 검수 결과 작성 형식",
  "",
  "각 문제는 아래 형식으로 정리하면 코드에 다시 반영하기 쉽습니다.",
  "",
  "| 위치/작품명 | 현재 문구 | 제안 문구 | 이유 | 중요도 |",
  "| --- | --- | --- | --- | --- |",
  "| 예: 미니게임 02 | 현재 문구 | 바꿀 문구 | 조사 오류/너무 어려움/용어 불일치 | 높음·중간·낮음 |",
  ""
);

fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");

const partDirectory = path.join(path.dirname(outputPath), "docs", "text-review");
fs.mkdirSync(partDirectory, { recursive: true });
const artworkSectionIndex = lines.indexOf("## 10. 작품 500점 전체 텍스트");
const dynamicSectionIndex = lines.indexOf("## 11. 동적으로 조합되는 나머지 화면 문구");
assert(artworkSectionIndex >= 0 && dynamicSectionIndex > artworkSectionIndex, "분할할 문서 구역을 찾지 못했습니다.");

function writePart(fileName, partLines) {
  fs.writeFileSync(path.join(partDirectory, fileName), `${partLines.join("\n")}\n`, "utf8");
}

writePart("TEXT_REVIEW_00_SYSTEM.md", [
  "# 전체 텍스트 검수본 00 · 공통 UI와 시스템 문구",
  "",
  `이 파일은 첫 화면, 메뉴, 도구, 미니게임 ${Object.keys(mechanicNames).length}종, 재질 안내, 시설, 이야기, 쉬운말 사전을 담습니다.`,
  "",
  ...lines.slice(lines.indexOf("## 1. 첫 화면·공통 UI 고정 문구"), artworkSectionIndex)
]);

for (let start = 1; start <= 500; start += 100) {
  const end = Math.min(500, start + 99);
  const startHeading = `### ${String(start).padStart(3, "0")}.`;
  const nextHeading = end < 500 ? `### ${String(end + 1).padStart(3, "0")}.` : "## 11.";
  const startIndex = lines.findIndex(line => line.startsWith(startHeading));
  const endIndex = lines.findIndex((line, index) => index > startIndex && line.startsWith(nextHeading));
  assert(startIndex >= 0 && endIndex > startIndex, `작품 ${start}~${end} 구역을 나누지 못했습니다.`);
  const partNumber = String(Math.floor((start - 1) / 100) + 1).padStart(2, "0");
  writePart(`TEXT_REVIEW_${partNumber}_ARTWORKS_${String(start).padStart(3, "0")}-${String(end).padStart(3, "0")}.md`, [
    `# 전체 텍스트 검수본 ${partNumber} · 작품 ${start}~${end}`,
    "",
    "각 작품의 화면 표시용 설명, 이야기, 손상, 복원 요약, 윤리 설명과 복원 단계를 담습니다.",
    "",
    ...lines.slice(startIndex, endIndex)
  ]);
}

writePart("TEXT_REVIEW_06_DYNAMIC.md", [
  "# 전체 텍스트 검수본 06 · 동적 버튼·피드백·랭킹 문구",
  "",
  ...lines.slice(dynamicSectionIndex)
]);

writePart("README.md", [
  "# 클로드 검수용 텍스트 분할본",
  "",
  "아래 순서로 한 파일씩 검수하면 문맥 한도를 넘기지 않고 전체 문구를 확인할 수 있습니다.",
  "",
  "1. `TEXT_REVIEW_00_SYSTEM.md` — 공통 UI, 미니게임, 도구, 시설, 이야기",
  "2. `TEXT_REVIEW_01_ARTWORKS_001-100.md`",
  "3. `TEXT_REVIEW_02_ARTWORKS_101-200.md`",
  "4. `TEXT_REVIEW_03_ARTWORKS_201-300.md`",
  "5. `TEXT_REVIEW_04_ARTWORKS_301-400.md`",
  "6. `TEXT_REVIEW_05_ARTWORKS_401-500.md`",
  "7. `TEXT_REVIEW_06_DYNAMIC.md` — 성공·실패·버튼·비서·관람객·랭킹 문구",
  "",
  "검수 결과는 각 항목의 현재 문구, 제안 문구, 이유, 중요도를 함께 적어 주세요.",
  "전체를 한 파일로 볼 때는 저장소 루트의 `TEXT_REVIEW_EXPORT.md`를 사용합니다."
]);

console.log(`전체 텍스트 검수본 생성 완료: ${outputPath}`);
console.log(`분할 검수본 생성 완료: ${partDirectory}`);
console.log(`작품 ${artworks.length}점, 미니게임 ${practiceChallenges.length}종, 동적 문구 후보 ${dynamicMap.size}개`);
