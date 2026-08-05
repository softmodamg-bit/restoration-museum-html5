import fs from "node:fs";
import vm from "node:vm";

const game = fs.readFileSync(new URL("../js/game.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const ranking = fs.readFileSync(new URL("../ranking-apps-script.gs", import.meta.url), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const easyNames = [
  "옆빛으로 손상 찾기",
  "작은 시험 결과 고르기",
  "결을 따라 먼지 털기",
  "붙이기 전 조각 맞춤",
  "온도·습도 안전하게 맞추기",
  "알맞은 양에서 손 떼기",
  "안전한 다음 행동 고르기",
  "접착제 한 방울 맞추기",
  "구별되는 복원 색 고르기",
  "금과 무늬 이어 맞추기",
  "오염을 걷고 멈출 때 고르기",
  "자외선으로 옛 수리 흔적 찾기",
  "꼭 필요한 곳에 작업 나누기",
  "약한 곳을 피해 받침 놓기"
];

const formalNames = [
  "사광 손상 조사",
  "시험구 안전 판정",
  "결 따라 표면 정리",
  "파편 가접합",
  "환경 안정화 조절",
  "미세량 홀드 조절",
  "처리 절차 판단",
  "접착제 점적 타이밍",
  "식별 가능한 보색",
  "접합면 방향 정렬",
  "세척 강도 판단",
  "자외선 형광 조사",
  "처리량 나누기",
  "받침 무게 잡기"
];

easyNames.forEach(name => assert(game.includes(name), `Missing easy mechanic name: ${name}`));
formalNames.forEach(name => assert(game.includes(name), `Formal learning term was removed: ${name}`));

assert(game.includes("const MECHANIC_EASY_NAMES ="), "Easy mechanic name registry is missing");
assert(game.includes("function easyCopy(value)"), "Shared easy-copy display transformer is missing");
const easyCopySourceStart = game.indexOf("const EASY_COPY_REPLACEMENTS =");
const easyCopySourceEnd = game.indexOf("const MECHANIC_GUIDES =", easyCopySourceStart);
assert(easyCopySourceStart >= 0 && easyCopySourceEnd > easyCopySourceStart, "Easy-copy implementation could not be isolated for runtime checks");
const easyCopySandbox = {};
vm.runInNewContext(
  `${game.slice(easyCopySourceStart, easyCopySourceEnd)}\nthis.easyCopy = easyCopy; this.hasFinalConsonant = hasFinalConsonant; this.particleForEasyCopy = particleForEasyCopy;`,
  easyCopySandbox,
  { timeout: 3000 }
);
assert(easyCopySandbox.hasFinalConsonant("물감"), "Final-consonant detection failed for a Hangul syllable with jongseong");
assert(!easyCopySandbox.hasFinalConsonant("도구"), "Final-consonant detection failed for a Hangul syllable without jongseong");
assert(easyCopySandbox.particleForEasyCopy("길", "으로") === "로", "The rieul exception for 으로/로 is broken");
assert(easyCopySandbox.particleForEasyCopy("물감", "로") === "으로", "으로/로 correction failed after a consonant");
assert(easyCopySandbox.particleForEasyCopy("도구", "으로") === "로", "으로/로 correction failed after a vowel");
assert(
  easyCopySandbox.easyCopy("안료가 안료를 안료와 안료는") === "그림 물감이 그림 물감을 그림 물감과 그림 물감은",
  "Easy-copy particle correction failed for 이/가, 을/를, 과/와, or 은/는"
);
assert(easyCopySandbox.easyCopy("안료 안료") === "그림 물감", "Repeated replacement phrases were not collapsed");
assert(easyCopySandbox.easyCopy("표면 표면 상태") === "표면 상태", "Repeated eojeol were not collapsed");
assert(easyCopySandbox.easyCopy("작가가 기록합니다.") === "작가가 기록합니다.", "Particles outside replaced terms must remain untouched");
assert(game.includes("${easyCopy(renderMechanicMarkup(art, current, mechanicTargets))}"), "Minigame markup is not routed through the easy-copy display layer");
assert(game.includes("<p>${easyCopy(art.damage)}</p>"), "Artwork damage summaries are not simplified at display time");
assert(game.includes("el.toast.textContent = easyCopy(message)"), "Dynamic toast feedback is not simplified consistently");
assert(game.includes("배우는 용어 · ${challenge.title}"), "Practice cards do not keep the formal term below the easy title");
assert(css.includes(".practice-card-copy > div em"), "Formal learning-term styling is missing from practice cards");
assert(!game.includes('label: "PROLOGUE"'), "English prologue label remains in the story archive");
assert(!game.includes("`CHAPTER ${"), "English chapter labels remain in the story archive");
assert(!game.includes('"ENDING · 1000"'), "English ending label remains in the story archive");
assert(!game.includes('"미도전"'), "Hard practice status wording remains");

const staticVisibleText = html
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ");

for (const avoided of ["프롤로그", "챕터", "에필로그", "해금", "튜토리얼", "전체 세이브", "정산하기", "키오스크", "뮤지엄 카페"]) {
  assert(!staticVisibleText.includes(avoided), `Hard static UI wording remains: ${avoided}`);
}

assert(html.includes("배우는 복원 용어"), "The formal-term learning label is missing");
assert(html.includes("작품에 좋은 점"), "The direct artwork-impact label is missing");
assert(ranking.includes("전체 저장 파일과 보유 코인은 저장하지 않습니다."), "Ranking privacy copy is not written in plain language");
assert(!ranking.includes("전체 세이브와 보유 코인은 저장하지 않습니다."), "Old ranking jargon remains");

console.log(`Easy-language validation passed: ${easyNames.length} minigames, particle correction, duplicate collapse, formal terms, static UI and ranking copy checked.`);
