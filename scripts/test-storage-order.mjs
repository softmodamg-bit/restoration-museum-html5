import assert from "node:assert/strict";
import fs from "node:fs";

const game = fs.readFileSync(new URL("../js/game.js", import.meta.url), "utf8");
const functionStart = game.indexOf("  function sortStorageArtworksByPriority");
const functionEnd = game.indexOf("\n  function renderStorage", functionStart);

assert.ok(functionStart >= 0 && functionEnd > functionStart, "Storage sorting helper must remain next to renderStorage().");
const functionSource = game.slice(functionStart, functionEnd).trim();
const sortStorageArtworksByPriority = Function(`${functionSource}; return sortStorageArtworksByPriority;`)();

const artworks = [
  { id: "restored-first", unlockRep: 0 },
  { id: "locked-by-reputation", unlockRep: 80 },
  { id: "available-a", unlockRep: 5 },
  { id: "license-locked", unlockRep: 0, licenseLocked: true },
  { id: "restored-second", unlockRep: 0 },
  { id: "available-b", unlockRep: 10 }
];
const restored = { "restored-first": {}, "restored-second": {} };
const sorted = sortStorageArtworksByPriority(artworks, restored, 20);

assert.deepEqual(sorted.map(art => art.id), ["available-a", "available-b", "locked-by-reputation", "license-locked", "restored-first", "restored-second"]);
assert.deepEqual(artworks.map(art => art.id), ["restored-first", "locked-by-reputation", "available-a", "license-locked", "restored-second", "available-b"], "Sorting must not mutate the catalog array.");
assert.deepEqual(sortStorageArtworksByPriority(artworks.slice(0, 3), restored, 20).map(art => art.id), ["available-a", "locked-by-reputation", "restored-first"], "The same priority must apply after search or material filtering.");
assert.deepEqual(sortStorageArtworksByPriority(artworks, restored, 100).map(art => art.id), ["locked-by-reputation", "available-a", "available-b", "license-locked", "restored-first", "restored-second"], "Reputation-unlocked work must move ahead while rights-locked work stays locked.");
assert.match(game, /const filteredArts = sortStorageArtworksByPriority\(ARTWORKS\.filter\([\s\S]*?\}\), state\.restored, state\.reputation\);/);

console.log("Storage ordering OK: restorable, locked, and restored groups stay stable after filtering.");
