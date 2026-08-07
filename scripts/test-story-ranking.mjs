import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const game = fs.readFileSync(new URL("../js/game.js", import.meta.url), "utf8");
const index = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const config = fs.readFileSync(new URL("../js/ranking-config.js", import.meta.url), "utf8");
const backend = fs.readFileSync(new URL("../ranking-apps-script.gs", import.meta.url), "utf8");

const chapterMatch = game.match(/const STORY_CHAPTERS = (\[[\s\S]*?\n  \]);/);
assert(chapterMatch, "STORY_CHAPTERS could not be extracted");
const chapters = vm.runInNewContext(`(${chapterMatch[1]})`);

assert.equal(chapters.length, 15, "story archive must contain 10 main chapters and 5 epilogues");
assert.deepEqual(Array.from(chapters, chapter => chapter.threshold), [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1300, 1600, 1900, 2200, 2500]);
assert.equal(chapters.filter(chapter => chapter.epilogue).length, 5);
assert.equal(chapters.at(-1).threshold, 2500);
assert.equal(chapters.at(-1).finale, true);
assert.match(index, /이야기 0\/15/);
assert.match(index, /매력도 300마다 후일담이 열리며, 매력도 2,500에서 5편/);

assert.match(game, /const FINAL_STORY_THRESHOLD = STORY_CHAPTERS\[STORY_CHAPTERS\.length - 1\]\.threshold/);
assert.match(game, /filter\(chapter => chapter\.threshold > state\.storyMilestone && chapter\.threshold <= appeal\)/);
assert.match(game, /const STORY_PROGRESS_VERSION = 2/);
assert.match(game, /rawStoryMilestone >= 1500 \? 2500/);
assert.match(game, /if \(story\.finale && !state\.storyCompletionDay\) state\.storyCompletionDay = state\.day/);
assert.match(game, /storyCompletionDay: 0/);
assert.match(game, /const storyCompletionDay = storyMilestone >= FINAL_STORY_THRESHOLD/);

for (const source of [game, config, backend]) {
  assert.match(source, /director-score-v3/, "client, config and backend must share score rules v3");
}
for (const field of ["totalMuseumIncome", "totalVisitors", "storyMilestone", "storyCompletionDay"]) {
  assert(game.includes(field), `client ranking payload is missing ${field}`);
  assert(backend.includes(field), `backend ranking validation is missing ${field}`);
}
assert.match(game, /function rankingIncomeScore/);
assert.match(game, /function rankingVisitorScore/);
assert.match(game, /function rankingStorySpeedScore/);
assert.match(backend, /function calculateIncomeScore_/);
assert.match(backend, /function calculateVisitorScore_/);
assert.match(backend, /function calculateStorySpeedScore_/);
assert.match(backend, /entry\.rulesVersion === RANKING_RULES_VERSION/);
assert.match(index, /<a id="viewRankingButton"[^>]+target="_blank"[^>]+rel="noopener noreferrer"/);
assert.match(game, /function rankingLeaderboardUrl\(\)/);
assert.match(game, /el\.viewRankingButton\.href = leaderboardUrl \|\| "#"/);
assert.match(game, /function rankingUsesSameTab\(\)[\s\S]*?\(pointer: coarse\)/, "터치 기기에서는 팝업 없이 현재 탭에서 랭킹을 열어야 합니다.");
assert.match(game, /function syncRankingLinkTarget\(\)[\s\S]*?removeAttribute\("target"\)/, "모바일 랭킹 링크는 새 탭 차단을 피해야 합니다.");
const leaderboardHandler = game.match(/function openLeaderboard\(event\) \{[\s\S]*?\n  \}/)?.[0] || "";
assert.match(leaderboardHandler, /event\.preventDefault\(\)/);
assert.doesNotMatch(leaderboardHandler, /window\.open/);
assert.match(backend, /canGoBack=window\.history\.length>1[\s\S]*?window\.history\.back\(\)/, "현재 탭에서 연 모바일은 게임 화면으로 돌아갈 수 있어야 합니다.");

console.log("Story and ranking validation passed: 15 authored chapters, 300-appeal epilogue spacing, 2500 finale, compatible legacy migration and director-score-v3 fields");
