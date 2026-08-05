import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const game = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");
const generatedSource = fs.readFileSync(path.join(root, "js", "artworks-data.js"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sourceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert(start >= 0 && end > start, `Could not extract source between ${startMarker} and ${endMarker}`);
  return source.slice(start + startMarker.length, end).trim();
}

const mechanicIds = game.match(/const MECHANIC_IDS = \[([^\]]+)\]/)?.[1]
  ?.split(",")
  .map(value => value.trim().replaceAll('"', ""))
  .filter(Boolean) || [];
assert(mechanicIds.length === 14, `Expected 14 mechanics, found ${mechanicIds.length}`);

const generatedSandbox = { window: {} };
vm.runInNewContext(generatedSource, generatedSandbox, { filename: "artworks-data.js" });
const generatedArtworks = generatedSandbox.window.RESTORATION_ARTWORKS;
assert(Array.isArray(generatedArtworks) && generatedArtworks.length === 496, `Expected 496 generated artworks, found ${generatedArtworks?.length}`);

const coreLiteral = sourceBetween(game, "const CORE_ARTWORKS = ", "\n\n  const MECHANIC_IDS");
const coreArtworks = vm.runInNewContext(`(() => { const step = (name, instruction, tool, diagnosis, targets) => ({ name, instruction, tool, diagnosis, targets }); return ${coreLiteral} })()`);
const artworks = [...coreArtworks, ...generatedArtworks];
assert(artworks.length === 500, `Expected 500 total artworks, found ${artworks.length}`);

const mappingLiteral = game.match(/function mechanicCandidatesForTool\(toolId\) \{\s*const safeMappings = (\{[\s\S]*?\});\s*return safeMappings/)?.[1];
assert(mappingLiteral, "Could not extract tool-to-mechanic mappings");
const toolMappings = vm.runInNewContext(`(${mappingLiteral})`);
const cleaningTools = new Set(game.match(/const CLEANING_MECHANIC_TOOLS = new Set\(\[([^\]]+)\]\)/)?.[1]
  ?.split(",")
  .map(value => value.trim().replaceAll('"', ""))
  .filter(Boolean) || []);
const balanceTools = new Set(game.match(/const BALANCE_MECHANIC_TOOLS = new Set\(\[([^\]]+)\]\)/)?.[1]
  ?.split(",")
  .map(value => value.trim().replaceAll('"', ""))
  .filter(Boolean) || []);

function hashText(text) {
  let hash = 2166136261;
  for (const character of String(text)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function preferredMechanicForStep(current, seed) {
  if (current.tool === "magnifier") return seed % 4 === 0 ? "uv" : "spot";
  if (current.tool === "testSwab") return seed % 3 === 0 ? "sequence" : "choice";
  if (current.tool === "reversibleAdhesive") return ["drag", "align", "rhythm"][seed % 3];
  const candidates = toolMappings[current.tool];
  if (balanceTools.has(current.tool)) return candidates[seed % candidates.length];
  if (cleaningTools.has(current.tool)) return candidates[seed % candidates.length];
  return candidates[0];
}

function mechanicPlanForArtwork(art) {
  if (art.id === "moon-jar") return ["spot", "choice", "rhythm", "precision", "tone"];
  if (art.id === "sunset-painting") return ["spot", "uv", "trace", "cleaning", "tone"];
  const seed = hashText(art.id);
  return art.steps.map((current, stepIndex) => {
    const semantic = toolMappings[current.tool];
    const preferred = preferredMechanicForStep(current, seed + stepIndex);
    return semantic.includes(preferred) ? preferred : semantic[(seed + stepIndex) % semantic.length];
  });
}

const mechanicAssignments = Object.fromEntries(mechanicIds.map(id => [id, 0]));
const artworkCoverage = Object.fromEntries(mechanicIds.map(id => [id, 0]));
const toolUseCounts = {};
const invalid = [];

for (const art of artworks) {
  if (!Array.isArray(art.steps) || art.steps.length < 4 || art.steps.length > 5) {
    invalid.push(`${art.id}: invalid step count ${art.steps?.length}`);
    continue;
  }
  for (const [stepIndex, current] of art.steps.entries()) {
    toolUseCounts[current.tool] = (toolUseCounts[current.tool] || 0) + 1;
    const candidates = toolMappings[current.tool];
    if (!Array.isArray(candidates) || !candidates.length) invalid.push(`${art.id} step ${stepIndex + 1}: unmapped tool ${current.tool}`);
    else if (candidates.some(id => !mechanicIds.includes(id))) invalid.push(`${art.id} step ${stepIndex + 1}: invalid candidate for ${current.tool}`);
  }
  if (invalid.length) continue;
  const plan = mechanicPlanForArtwork(art);
  if (plan.length !== art.steps.length) invalid.push(`${art.id}: plan length ${plan.length}/${art.steps.length}`);
  const present = new Set();
  plan.forEach((mechanic, stepIndex) => {
    const candidates = toolMappings[art.steps[stepIndex].tool];
    if (!candidates.includes(mechanic)) invalid.push(`${art.id} step ${stepIndex + 1}: ${mechanic} mismatches ${art.steps[stepIndex].tool}`);
    mechanicAssignments[mechanic] += 1;
    present.add(mechanic);
  });
  present.forEach(mechanic => { artworkCoverage[mechanic] += 1; });
}

assert(invalid.length === 0, `Invalid artwork plans:\n${invalid.slice(0, 20).join("\n")}`);
assert(Object.keys(toolUseCounts).every(tool => Array.isArray(toolMappings[tool]) && toolMappings[tool].length), "At least one used tool has an empty mapping");
assert(mechanicIds.every(id => mechanicAssignments[id] > 0), "At least one mechanic is never assigned");
assert(artworkCoverage.cleaning >= 20 && artworkCoverage.cleaning <= 200, `Cleaning distribution is suspicious: ${artworkCoverage.cleaning}/500 artworks`);
assert(artworkCoverage.uv >= 20 && artworkCoverage.uv <= 200, `UV distribution is suspicious: ${artworkCoverage.uv}/500 artworks`);
assert(artworkCoverage.budget >= 20 && artworkCoverage.budget <= 200, `Budget distribution is suspicious: ${artworkCoverage.budget}/500 artworks`);
assert(artworkCoverage.balance >= 20 && artworkCoverage.balance <= 200, `Balance distribution is suspicious: ${artworkCoverage.balance}/500 artworks`);

const selectToolBody = sourceBetween(game, "function selectTool(toolId, correctToolId, button) {", "\n  function activateCurrentMechanic");
const wrongBranch = sourceBetween(selectToolBody, "if (toolId !== correctToolId) {", "\n    selectedTool = toolId;");
assert(!wrongBranch.includes("activateCurrentMechanic"), "A wrong tool can activate a mechanic");
assert(wrongBranch.includes("return;"), "Wrong-tool branch must return before activation");

const lifecycleBody = sourceBetween(game, "function bindMechanicControls() {", "\n  function completeStep");
const lifecycleWithoutRegistry = lifecycleBody.replace(/function scheduleMechanicTimeout\([\s\S]*?\n  \}/, "");
assert(!/(?:window\.)?setInterval\s*\(/.test(lifecycleBody), "A mechanic owns an untracked interval");
assert(!/(?:window\.)?setTimeout\s*\(/.test(lifecycleWithoutRegistry), "A mechanic owns an untracked timeout");
assert(!/(?:window|document)\.addEventListener/.test(lifecycleBody), "A mechanic attaches a global event listener");
for (const line of lifecycleBody.match(/^.*requestAnimationFrame.*$/gm) || []) {
  assert(line.includes("mechanicAnimationFrame ="), `Untracked mechanic animation frame: ${line.trim()}`);
}
assert(/function cancelMechanicSchedules\(\)[\s\S]*?cancelAnimationFrame[\s\S]*?mechanicTimers\.forEach[\s\S]*?mechanicTimers\.clear/.test(game), "Common mechanic schedule cleanup is incomplete");
assert(/function clearMechanicTimers\(\)[\s\S]*?timingState = null[\s\S]*?memoryState = null[\s\S]*?rhythmState = null[\s\S]*?cleaningState = null[\s\S]*?layerCleaningState = null[\s\S]*?budgetState = null[\s\S]*?balanceState = null/.test(game), "Mechanic transient state cleanup is incomplete");
assert(/function clearMechanicTimers\(\)[\s\S]*?dragPreviewState = null/.test(game), "Drag preview transient state cleanup is incomplete");

const restartBody = sourceBetween(game, "function restartCurrentStep() {", "\n  function mechanicCandidatesForTool");
for (const field of ["streak", "maxStreak"]) assert(new RegExp(`session\\.${field}\\s*=\\s*0`).test(restartBody), `Restart does not reset ${field}`);
assert(restartBody.includes("session.cleaningResults ="), "Restart does not clear current cleaning progress/result");
assert(restartBody.includes("session.uvHistoryConfirmed = false"), "Restart does not clear current UV result");
assert(restartBody.includes("session.budgetResults ="), "Restart does not clear the current budget result");
assert(restartBody.includes("session.balanceRerolls[session.stepIndex]"), "Restart does not refresh balance physical parameters");
assert(/session = createRestorationSession\(art\.id, false\)/.test(game), "Practice does not create a fresh session");

for (const migration of [
  "overcleaned: Boolean(record?.overcleaned)",
  "uvHistoryConfirmed: Boolean(record?.uvHistoryConfirmed)",
  "overcleaned: Boolean(record.overcleaned)",
  "uvHistoryConfirmed: Boolean(record.uvHistoryConfirmed)",
  "appealPenalty: asNumber(record?.appealPenalty, 0, 0, 40)",
  "appealPenalty: asNumber(record.appealPenalty, 0, 0, 40)",
  "difficultyFiveCueSeen: Boolean(candidate.difficultyFiveCueSeen)",
  "alwaysShowSafeZones: Boolean(candidate.alwaysShowSafeZones)",
  "extendedPuzzlePreview: Boolean(candidate.extendedPuzzlePreview)"
]) assert(game.includes(migration), `Missing backward-compatible migration: ${migration}`);

const runtimeHardcoding = ["index.html", "styles.css", path.join("js", "game.js")]
  .flatMap(relativePath => fs.readFileSync(path.join(root, relativePath), "utf8").split(/\r?\n/).map((line, index) => ({ relativePath, line, index: index + 1 })))
  .filter(item => /(?:미니게임|복원 기술|mechanic)[^\n]{0,30}(?:10종|10개|\/10\b)|(?:10종|10개|\/10\b)[^\n]{0,30}(?:미니게임|복원 기술|mechanic)/i.test(item.line));
assert(runtimeHardcoding.length === 0, `Runtime still assumes 10 mechanics:\n${runtimeHardcoding.map(item => `${item.relativePath}:${item.index} ${item.line.trim()}`).join("\n")}`);

console.log(`Artwork plans OK: ${artworks.length} artworks, ${artworks.reduce((sum, art) => sum + art.steps.length, 0)} assigned steps.`);
console.log(`Assignments by mechanic: ${Object.entries(mechanicAssignments).map(([id, count]) => `${id}=${count}`).join(", ")}`);
console.log(`Artwork coverage: cleaning=${artworkCoverage.cleaning}/500, uv=${artworkCoverage.uv}/500, budget=${artworkCoverage.budget}/500, balance=${artworkCoverage.balance}/500.`);
console.log("Lifecycle registry, wrong-tool guard, restart isolation, optional migrations, and runtime mechanic-count hardcoding checks passed.");
