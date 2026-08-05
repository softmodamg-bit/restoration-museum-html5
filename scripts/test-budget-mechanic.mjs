import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const game = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function functionSource(name, nextName) {
  const start = game.indexOf(`function ${name}(`);
  const end = game.indexOf(`function ${nextName}(`, start + 1);
  assert(start >= 0 && end > start, `Could not extract ${name}()`);
  return game.slice(start, end).trim();
}

const sandbox = {};
vm.runInNewContext(`
  ${functionSource("budgetDifficultyParameters", "budgetPresentation")}
  ${functionSource("budgetPresentation", "budgetLevelText")}
  ${functionSource("budgetAreaResult", "confirmBudgetAllocation")}
  this.budgetDifficultyParameters = budgetDifficultyParameters;
  this.budgetPresentation = budgetPresentation;
  this.budgetAreaResult = budgetAreaResult;
`, sandbox);

const { budgetDifficultyParameters, budgetPresentation, budgetAreaResult } = sandbox;
const painting = budgetPresentation({ material: "유화", artType: "캔버스 회화" });
const difficulty2 = budgetDifficultyParameters(2);
const difficulty5 = budgetDifficultyParameters(5);

assert(difficulty2.regionCount === 3 && difficulty2.showNeeds, "Difficulty 2 must show three areas and their needs");
assert(difficulty2.needs.reduce((sum, value) => sum + value, 0) < 100, "Difficulty 2 must have spare treatment amount");
assert(difficulty5.regionCount === 4 && !difficulty5.showNeeds, "Difficulty 5 must hide needs for four areas");
assert(difficulty5.needs.reduce((sum, value) => sum + value, 0) > 100, "Difficulty 5 must force a tradeoff");

function evaluateAllocations(parameters, allocations) {
  const areas = painting.areas.slice(0, parameters.regionCount).map((area, index) => ({ ...area, need: parameters.needs[index] }));
  const outcomes = areas.map((area, index) => ({ ...area, ...budgetAreaResult(area, allocations[index] || 0) }));
  const risk = Math.min(16, Math.round(outcomes.reduce((sum, outcome) => sum + outcome.structuralShortage * 3, 0)));
  const appeal = Math.min(8, Math.round(outcomes.reduce((sum, outcome) => sum + outcome.appearanceShortage, 0)));
  return { risk, appeal, outcomes };
}

const d2Allocations = [
  [34, 26, 18],
  [0, 60, 18],
  [55, 0, 18]
];
const d2Results = d2Allocations.map(values => evaluateAllocations(difficulty2, values));
assert(d2Allocations.every(values => values.reduce((sum, value) => sum + value, 0) <= 100), "Difficulty 2 test allocations exceed 100");
assert(d2Results[0].risk === 0 && d2Results[0].appeal === 0, "A sufficient D2 allocation must preserve safety and appeal");
assert(d2Results[1].risk > 0, "Neglecting the high-risk D2 area must add structural risk");
assert(d2Results[2].risk === 0 && d2Results[2].appeal > 0, "Protecting structure while neglecting a visible D2 area must only reduce appeal");

const d5Allocations = [
  [43, 1, 31, 25],
  [40, 35, 0, 25],
  [30, 25, 25, 20]
];
const d5Results = d5Allocations.map(values => evaluateAllocations(difficulty5, values));
assert(d5Allocations.every(values => values.reduce((sum, value) => sum + value, 0) === 100), "Difficulty 5 test allocations must use exactly 100");
assert(d5Results.every(result => result.outcomes.some(outcome => outcome.coverage < 1)), "Every D5 allocation must leave at least one area unfinished");
assert(new Set(d5Results.map(result => `${result.risk}/${result.appeal}`)).size === 3, "Three D5 allocations must produce different results");

for (const [material, expectedArea] of [
  ["도자기", "접합부"],
  ["책·문서", "책등"],
  ["금속", "번지는 녹"],
  ["벽화", "들뜬 그림층"]
]) {
  const presentation = budgetPresentation({ material, artType: material });
  assert(presentation.areas.some(area => area.name === expectedArea), `${material} budget presentation is missing ${expectedArea}`);
}

assert(/const allocation = Math\.min\(requested, Math\.max\(0, 100 - otherTotal\)\)/.test(game), "Shared total must be clamped before updating a slider");
assert(/appealPenalty: asNumber\(record\?\.appealPenalty, 0, 0, 40\)/.test(game), "Old record migration must default appeal penalty to zero");
assert(/appealPenalty: asNumber\(record\.appealPenalty, 0, 0, 40\)/.test(game), "Old restored-state migration must default appeal penalty to zero");
assert(game.includes('id: "budget", artId: "sunset-painting"'), "Budget practice challenge is missing");
assert(css.includes(".budget-area input[type=\"range\"] { min-height:48px; }"), "390px touch slider height is not protected by the mobile rule");

console.log("Budget mechanic OK: D2/D5 parameters, three allocation outcomes per level, five material presentations, shared-total clamp, practice entry, optional migration, and mobile slider sizing verified.");
