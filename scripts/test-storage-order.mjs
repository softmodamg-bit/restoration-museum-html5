import assert from "node:assert/strict";
import fs from "node:fs";

const game = fs.readFileSync(new URL("../js/game.js", import.meta.url), "utf8");
const functionStart = game.indexOf("  function sortStorageArtworksPendingFirst");
const functionEnd = game.indexOf("\n  function renderStorage", functionStart);

assert.ok(functionStart >= 0 && functionEnd > functionStart, "Storage sorting helper must remain next to renderStorage().");
const functionSource = game.slice(functionStart, functionEnd).trim();
const sortStorageArtworksPendingFirst = Function(`${functionSource}; return sortStorageArtworksPendingFirst;`)();

const artworks = [
  { id: "restored-first" },
  { id: "pending-a" },
  { id: "restored-second" },
  { id: "pending-b" }
];
const restored = { "restored-first": {}, "restored-second": {} };
const sorted = sortStorageArtworksPendingFirst(artworks, restored);

assert.deepEqual(sorted.map(art => art.id), ["pending-a", "pending-b", "restored-first", "restored-second"]);
assert.deepEqual(artworks.map(art => art.id), ["restored-first", "pending-a", "restored-second", "pending-b"], "Sorting must not mutate the catalog array.");
assert.deepEqual(sortStorageArtworksPendingFirst(artworks.slice(0, 2), restored).map(art => art.id), ["pending-a", "restored-first"], "The same order must work after search or material filtering.");
assert.match(game, /const filteredArts = sortStorageArtworksPendingFirst\(ARTWORKS\.filter\([\s\S]*?\}\), state\.restored\);/);

console.log("Storage ordering OK: pending artworks stay first, restored artworks move to the end, and filter order remains stable.");
