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
assert.deepEqual(Array.from(chapters, chapter => chapter.threshold), Array.from({ length: 15 }, (_, index) => (index + 1) * 100));
assert.equal(chapters.filter(chapter => chapter.epilogue).length, 5);
assert.equal(chapters.at(-1).threshold, 1500);
assert.equal(chapters.at(-1).finale, true);
assert.match(index, /이야기 0\/15/);
assert.match(index, /매력도 1,500까지 후일담 5편/);

assert.match(game, /const FINAL_STORY_THRESHOLD = STORY_CHAPTERS\[STORY_CHAPTERS\.length - 1\]\.threshold/);
assert.match(game, /Math\.min\(FINAL_STORY_THRESHOLD, Math\.floor\(appeal \/ 100\) \* 100\)/);
assert.match(game, /if \(story\.finale && !state\.storyCompletionDay\) state\.storyCompletionDay = state\.day/);
assert.match(game, /storyCompletionDay: 0/);
assert.match(game, /const storyCompletionDay = storyMilestone >= FINAL_STORY_THRESHOLD/);

for (const source of [game, config, backend]) {
  assert.match(source, /director-score-v2/, "client, config and backend must share score rules v2");
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

console.log("Story and ranking validation passed: 15 authored chapters, 1500 finale, compatible completion-day migration and director-score-v2 fields");
