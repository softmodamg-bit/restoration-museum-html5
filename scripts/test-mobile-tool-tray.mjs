import assert from "node:assert/strict";
import fs from "node:fs";

const index = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const game = fs.readFileSync(new URL("../js/game.js", import.meta.url), "utf8");

assert.match(index, /id="toolSelectionCard" class="panel-card tool-selection-card"/);
assert.match(index, /id="mobileToolBriefText"/);
assert.match(index, /styles\.css\?v=20260808-fold-practice-v2/);
assert.match(index, /js\/game\.js\?v=20260808-mobile-ranking-view-v2/);
const resultTitleIndex = index.indexOf('id="resultTitle"');
const resultActionIndex = index.indexOf('id="resultConfirm"');
const resultSummaryIndex = index.indexOf('id="resultSummary"');
assert.ok(resultTitleIndex >= 0 && resultActionIndex > resultTitleIndex && resultActionIndex < resultSummaryIndex,
  "The exhibit action should appear immediately after the restoration result title, before the scrollable details.");
assert.match(styles, /@media \(max-width: 900px\)[\s\S]*?\.tool-panel \{ display: contents; \}/);
assert.match(styles, /\.tool-selection-card \{ order: -1;/);
assert.match(styles, /\.mobile-tool-brief \{ display: none; \}/);
assert.match(styles, /@media \(max-width: 900px\)[\s\S]*?\.mobile-tool-brief \{ display: grid;/);
assert.match(styles, /\.tool-selection-card \.tool-grid \{ grid-template-columns: repeat\(4,minmax\(0,1fr\)\); \}/);
assert.match(styles, /@media \(max-width: 680px\)[\s\S]*?\.tool-selection-card \.tool-button \{ min-height: 72px;/);
assert.match(game, /function revealMobileToolSelection\(\)/);
assert.match(game, /el\.toolSelectionCard\.scrollIntoView\(\{ behavior, block: "start" \}\)/);
assert.match(game, /bindMechanicControls\(\);\s*revealMobileToolSelection\(\);/);
assert.match(game, /el\.resultModal\.scrollTop = 0;\s*el\.resultModal\.classList\.remove\("is-hidden"\);/);
assert.match(game, /function revealMobileMechanicStage\(\)/);
assert.match(game, /el\.artStage\.closest\("\.art-stage-card"\)\?\.scrollIntoView\(\{ behavior, block: "start" \}\)/);
assert.match(game, /activateCurrentMechanic\(\);\s*revealMobileMechanicStage\(\);/);
assert.match(game, /window\.matchMedia\("\(max-width: 820px\)"\)\.matches/);
assert.match(game, /mobileToolBriefText: \$\("#mobileToolBriefText"\)/);
assert.match(game, /el\.mobileToolBriefText\.textContent = `\$\{currentStepName\} · \$\{currentStepInstruction\}`;/);
assert.match(styles, /@media \(max-width: 820px\)[\s\S]*?\.lab-layout \{ order: 1; gap: 10px; \}[\s\S]*?\.lab-header \{ order: 2;/);
assert.match(styles, /@media \(max-width: 820px\)[\s\S]*?\.workflow-strip \{ order: 3;/);
assert.match(styles, /\.stage-topline \{ display: grid; grid-template-columns: minmax\(0,\.82fr\) minmax\(0,1\.18fr\);/);
assert.match(styles, /\.art-stage:is\(\[data-mechanic="spot"\][\s\S]*?min-height: clamp\(400px,54svh,470px\);/);

console.log("Mobile gameplay layout OK: current-step tool clue, compact navigation, play-first ordering, two-row status HUD, tool-to-game auto focus, and shorter interactive stages verified.");
