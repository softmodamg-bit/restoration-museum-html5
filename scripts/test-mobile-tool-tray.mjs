import assert from "node:assert/strict";
import fs from "node:fs";

const index = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const game = fs.readFileSync(new URL("../js/game.js", import.meta.url), "utf8");

assert.match(index, /id="toolSelectionCard" class="panel-card tool-selection-card"/);
assert.match(index, /styles\.css\?v=20260806-mobile-tool-tray-v1/);
assert.match(index, /js\/game\.js\?v=20260806-mobile-tool-tray-v1/);
assert.match(styles, /@media \(max-width: 900px\)[\s\S]*?\.tool-panel \{ display: contents; \}/);
assert.match(styles, /\.tool-selection-card \{ order: -1;/);
assert.match(styles, /\.tool-selection-card \.tool-grid \{ grid-template-columns: repeat\(4,minmax\(0,1fr\)\); \}/);
assert.match(styles, /@media \(max-width: 680px\)[\s\S]*?\.tool-selection-card \.tool-button \{ min-height: 72px;/);
assert.match(game, /function revealMobileToolSelection\(\)/);
assert.match(game, /el\.toolSelectionCard\.scrollIntoView\(\{ behavior, block: "center" \}\)/);
assert.match(game, /bindMechanicControls\(\);\s*revealMobileToolSelection\(\);/);

console.log("Mobile tool tray OK: stacked layouts show the four-tool tray before the artwork and reveal it on each step.");
