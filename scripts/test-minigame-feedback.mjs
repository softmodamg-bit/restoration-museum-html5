import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const game = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const mechanicList = game.match(/const MECHANIC_IDS = \[([^\]]+)\]/)?.[1]
  ?.split(",")
  .map(value => value.trim().replaceAll('"', ""))
  .filter(Boolean) || [];

const legacyMechanics = ["spot", "choice", "trace", "drag", "stability", "precision", "sequence", "rhythm", "tone", "align"];
assert(mechanicList.length === legacyMechanics.length + 4, `Expected ${legacyMechanics.length + 4} mechanics, found ${mechanicList.length}`);
assert(new Set(mechanicList).size === mechanicList.length, "Mechanic IDs must be unique");
assert(legacyMechanics.every((id, index) => mechanicList[index] === id), "Legacy mechanic IDs or registration order changed");
assert(mechanicList[legacyMechanics.length] === "cleaning", "Cleaning registration order changed");
assert(mechanicList[legacyMechanics.length + 1] === "uv", "UV registration order changed");
assert(mechanicList[legacyMechanics.length + 2] === "budget", "Budget registration order changed");
assert(mechanicList.at(-1) === "balance", "Balance must be registered after the existing mechanics");

for (const field of ["streak", "maxStreak", "streakStepIndex", "streakRecordedStepIndex", "stepHadMistake"]) {
  assert(new RegExp(`\\b${field}:`).test(game), `Missing session feedback field: ${field}`);
}

assert(/function finishMechanicSoon\([^)]*\)[\s\S]*?registerStepSuccess\(\)/.test(game), "Success hook is not connected to finishMechanicSoon()");
assert(/function addMechanicMistake\(riskAmount, message, numericFeedback = null\)[\s\S]*?session\.streak = 0/.test(game), "Failure hook is not backward-compatible or does not reset streak");
assert((game.match(/session\.mechanicComplete = true/g) || []).length === 1, "A mechanic bypasses the common success hook");

const renderStepBody = game.match(/function renderCurrentStep\(\) \{([\s\S]*?)\n  function restartCurrentStep/)?.[1] || "";
const restartBody = game.match(/function restartCurrentStep\(\) \{([\s\S]*?)\n  function mechanicCandidatesForTool/)?.[1] || "";
const practiceStartBody = game.match(/function startPracticeChallenge\(id, difficultyLevel = 2\) \{([\s\S]*?)\n  function completePracticeChallenge/)?.[1] || "";
const pauseBody = game.match(/function pauseRestoration\(\) \{([\s\S]*?)\n  function resumeRestoration/)?.[1] || "";
const resumeBody = game.match(/function resumeRestoration\(\) \{([\s\S]*?)\n  function clearMechanicTimers/)?.[1] || "";

assert(/session\.streakStepIndex !== session\.stepIndex[\s\S]*?session\.stepHadMistake = false/.test(renderStepBody), "Step transition does not reset the per-step mistake flag");
assert(/renderCurrentStep\(\)/.test(restartBody), "Restart must reuse the common render path");
for (const field of ["streak", "maxStreak"]) {
  assert(new RegExp(`session\\.${field}\\s*=\\s*0`).test(restartBody), `Restart must reset ${field}`);
}
assert(/session\.cleaningResults\s*=\s*\(session\.cleaningResults \|\| \[\]\)\.filter/.test(restartBody), "Cleaning restart must remove the current-step result");
assert(/currentMechanic === "uv"[\s\S]*?session\.uvHistoryConfirmed = false[\s\S]*?session\.uvFindingLabel = ""/.test(restartBody), "UV restart must reset the current finding");
assert(/currentMechanic === "budget"[\s\S]*?session\.budgetResults\s*=\s*\(session\.budgetResults \|\| \[\]\)\.filter/.test(restartBody), "Budget restart must remove the current-step result");
assert(/currentMechanic === "balance"[\s\S]*?session\.balanceRerolls\[session\.stepIndex\]/.test(restartBody), "Balance restart must refresh the session-only physical setup");
assert(/session = createRestorationSession\(art\.id, false\)/.test(practiceStartBody), "Practice mode must start with a fresh session-only streak");
assert(/session\.practiceDifficulty = selectedDifficulty/.test(practiceStartBody), "Practice mode must store the selected difficulty in its fresh session");
assert(!/session\.(?:streak|maxStreak)\s*=/.test(pauseBody + resumeBody), "Pause/resume must not mutate streak state");
assert(/document\.addEventListener\("visibilitychange"[\s\S]*?pauseRestoration\(\)[\s\S]*?resumeRestoration\(\)/.test(game), "Tab visibility must use the common pause/resume path");
assert(["pointerdown", "pointerup", "pointercancel"].every(type => game.includes(`addEventListener("${type}"`)), "Pointer controls must keep mouse/touch-compatible events");
assert(/currentMechanic === "choice"[\s\S]*?completeTestChoiceObservation/.test(resumeBody), "Paused choice observation must resume without a stuck disabled sample");
assert(/currentMechanic === "sequence"[\s\S]*?renderProcedureScenario\(\)/.test(resumeBody), "Paused sequence transition must rebuild the active scenario");
assert(/timingState\.overMoistureReady = true/.test(resumeBody), "Paused stability overflow cooldown must recover");
assert(/\.swipe-spark, \[data-damage-target\]\.is-hit, \[data-uv-target\]\.is-hit/.test(pauseBody), "Paused inspection effects must not leave canceled-timeout DOM residue");
assert(/scheduleMechanicTimeout\(\(\) => target\.remove\(\), 240\)/.test(game), "Spot/UV target cleanup must use the common mechanic timer registry");
assert(/scheduleMechanicTimeout\(\(\) => spark\.remove\(\), 400\)/.test(game), "Mechanic spark cleanup must use the common mechanic timer registry");

for (const label of ["환경 안정화 수치", "presentation.title", "presentation.target"]) {
  assert(game.includes(`label: ${label.startsWith("presentation") ? label : `"${label}"`}`), `Missing numeric feedback mapping: ${label}`);
}

assert(/function streakRewardFor\([\s\S]*?coinRate: \.2/.test(game), "Streak reward is missing or exceeds the intended path");
assert(!/state\.restored\[[^\]]+\]\s*=\s*\{[\s\S]{0,500}\bmaxStreak\b/.test(game), "maxStreak must remain session-only in this version");

for (const id of ["streakHud", "streakValue", "streakBest", "nearMissFeedback", "nearMissComparison"]) {
  assert(html.includes(`id="${id}"`), `Missing feedback HUD element: ${id}`);
}

assert(css.includes(".streak-hud.is-bumping"), "Missing streak emphasis style");
assert(css.includes(".near-miss-feedback.is-near"), "Missing near-miss style");
assert(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.streak-hud\.is-bumping/.test(css), "Reduced-motion override is missing");
assert(/@media \(max-width: 680px\)[\s\S]*?\.streak-hud/.test(css), "Mobile streak HUD layout is missing");

for (const field of ["difficultyFiveCueSeen", "alwaysShowSafeZones", "extendedPuzzlePreview"]) {
  assert(new RegExp(`\\b${field}: false`).test(game), `Missing default expert-cue field: ${field}`);
  assert(new RegExp(`\\b${field}: Boolean\\(candidate\\.${field}\\)`).test(game), `Missing backward-compatible migration for: ${field}`);
}

assert(/function usesExpertMaterialCues\([\s\S]*?mechanicDifficulty\(art\) === 5[\s\S]*?!state\.alwaysShowSafeZones/.test(game), "Expert material cues must be limited to difficulty 5 and disabled by the accessibility preference");
assert(game.includes('["stability", "precision", "rhythm"].includes(mechanic)'), "Expert material cues must be limited to the three numeric mechanics");
assert(game.includes('expert ? "" : \'<span class="stability-safe-zone"></span>\''), "Stability D5 safe zone is not render-gated");
assert(game.includes('expert ? "" : \'<span id="precisionSafeZone"></span>\''), "Precision D5 safe zone is not render-gated");
assert(game.includes('expert ? "" : \'<span id="adhesiveTargetCircle" class="adhesive-target-circle"></span>\''), "Rhythm D5 target zone is not render-gated");

for (const stateName of ["state-low", "state-safe", "state-high"]) {
  assert(css.includes(`.material-state-surface.${stateName}`), `Missing material surface state: ${stateName}`);
  assert(css.includes(`.expert-material-state.${stateName}`) || stateName === "state-low", `Missing non-color cue state: ${stateName}`);
}
assert(css.includes("border-style:dashed") && css.includes("border-style:solid") && css.includes("border-style:double"), "Material cues must include non-color border-shape changes");
assert(css.includes("repeating-linear-gradient") && css.includes("repeating-radial-gradient"), "Material cues must include non-color surface textures");
assert(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.material-state-surface/.test(css), "Reduced-motion material transition override is missing");

assert(game.includes("const safeWidth = Math.max(18, 28 - difficulty * 2);"), "Stability safe width changed");
assert(game.includes("safeStart: 48,") && game.includes("safeEnd: 48 + safeWidth,"), "Stability target range changed");
assert(game.includes("goal: 1700 + difficulty * 170,"), "Stability hold goal changed");
assert(game.includes("timingState.position += (timingState.active ? 18 : -8)"), "Stability motion rates changed");
assert(game.includes("timingState.position >= 94"), "Stability overflow threshold changed");
assert(game.includes("const width = Math.max(12, 21 - difficulty * 2);"), "Precision safe width changed");
assert(game.includes("timingState.safeStart = 48 + (seed % 22);"), "Precision target start changed");
assert(game.includes("timingState.speed = 38 + difficulty * 6 + timingState.hits * 4;"), "Precision speed changed");
assert(game.includes("targetRadii: [34, 29, 32],") && game.includes("speed: 38 + difficulty * 4,") && game.includes("tolerance: Math.max(5, 8 - difficulty * .55),"), "Rhythm target, speed, or tolerance changed");
assert(game.includes("Math.abs(rhythmState.radius - rhythmState.targetRadius) <= rhythmState.tolerance"), "Rhythm success condition changed");

assert(/function dragPreviewDurationMs\([^)]+\)[\s\S]*?state\.extendedPuzzlePreview\) return 5000[\s\S]*?level === 2\) return 3000[\s\S]*?level === 5\) return 1500[\s\S]*?return 2500/.test(game), "Drag preview duration mapping is incomplete");
assert(game.includes('if (currentMechanic === "drag") startDragPreview()'), "Drag activation does not start the memory preview");
assert(game.includes("data-drag-preview") && game.includes("data-drag-play"), "Drag preview/play phases are not separately rendered");
assert(/function completeDragPreview\([\s\S]*?tabIndex = 0[\s\S]*?aria-disabled", "false"/.test(game), "Drag pieces are not unlocked after the preview");
assert(/function beginPieceDrag\([\s\S]*?!dragPreviewState\?\.complete/.test(game), "Pointer dragging is not guarded during the preview");
assert(/function placeDragPieceWithKeyboard\([\s\S]*?!dragPreviewState\?\.complete/.test(game), "Keyboard placement is not guarded during the preview");
assert(/dragPreviewState && !dragPreviewState\.complete\) dragPreviewState\.running = false/.test(pauseBody), "Drag preview does not pause through the common lifecycle");
assert(/currentMechanic === "drag"[\s\S]*?resumeDragPreview\(\)/.test(resumeBody), "Drag preview does not resume through the common lifecycle");
assert(css.includes(".drag-preview-timer") && css.includes(".drag-play-area.is-concealed"), "Drag preview countdown or concealed play state is not styled");

assert(game.includes("deadlineEnabled: difficulty === 5"), "Rhythm deadline is not limited to difficulty 5");
assert(game.includes('hasDeadline ? `<div class="adhesive-deadline'), "Rhythm deadline gauge is not render-gated by difficulty 5");
assert(/function handleAdhesiveDeadlineExpired\([\s\S]*?rhythmState\.index \+= 1[\s\S]*?addMechanicMistake\(6, message\)/.test(game), "Rhythm deadline expiry must advance and record a mistake");
assert(/function handleAdhesiveDeadlineExpired\([\s\S]*?finishMechanicSoon/.test(game), "Rhythm deadline expiry cannot complete the final drop");
assert(/function updateAdhesiveChallenge\([\s\S]*?deadlineRemainingMs[\s\S]*?handleAdhesiveDeadlineExpired/.test(game), "Rhythm deadline is not connected to its animation lifecycle");
assert(!/function startAdhesiveChallenge\([\s\S]*?deadlineEnabled:\s*(?:true|difficulty\s*[<>]=?)/.test(game), "Rhythm deadline gating must remain exactly difficulty 5");
assert(css.includes(".adhesive-deadline.is-urgent"), "Rhythm deadline pressure state is not styled");
assert(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.drag-preview-timer i,\.adhesive-deadline i/.test(css), "New countdown gauges lack reduced-motion handling");

for (const id of ["difficultyFiveNotice", "alwaysShowSafeZones", "extendedPuzzlePreview"]) {
  assert(html.includes(`id="${id}"`), `Missing D5 guide/accessibility control: ${id}`);
}
assert(/function renderDifficultyFiveNotice\([\s\S]*?state\.difficultyFiveCueSeen = true;[\s\S]*?saveState\(\)/.test(game), "One-time D5 guidance is not persisted");

for (const registration of [
  'if (currentMechanic === "cleaning") startLayerCleaningMechanic()',
  'data-layer-cleaning-board',
  'data-layer-cleaning-stop',
  'globalCompositeOperation = "destination-out"',
  'finishMechanicSoon(outcome === "under"',
  'if (outcome === "over") addMechanicMistake'
]) {
  assert(game.includes(registration), `Missing cleaning integration: ${registration}`);
}
assert(/const offsetPercent = \(seed % 31\) - 15/.test(game), "Cleaning threshold must use a deterministic ±15% offset");
assert(/cleaningRerolls\[session\.stepIndex\][\s\S]*?\+ 1/.test(game), "Cleaning restart must explicitly reroll its deterministic threshold");
assert(/function restorationAccuracy\([\s\S]*?underCleaningCount[\s\S]*?underCleaningCount \* 6/.test(game), "Under-cleaning must produce a small non-mistake achievement penalty");
assert(/overcleaned: Boolean\(record\.overcleaned\)/.test(game), "Restored-record cleaning migration is missing");
assert(/cleaningOutcomes: Array\.isArray\(record\.cleaningOutcomes\)/.test(game), "Cleaning outcome migration is missing");
assert(css.includes(".layer-cleaning-board.state-low") && css.includes(".layer-cleaning-board.state-safe") && css.includes(".layer-cleaning-board.state-high"), "Cleaning material-state visuals are incomplete");
assert(css.includes("touch-action:none") && css.includes(".layer-cleaning-stop"), "Cleaning touch controls are incomplete");
assert(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.layer-cleaning-board/.test(css), "Cleaning reduced-motion override is missing");
assert(html.includes('id="practiceCountDescription"'), "Dynamic practice mechanic count copy is missing");

assert(/function choiceDifficultyParameters\([\s\S]*?sampleCount = level === 5 \? 4 : 3/.test(game), "Choice D5 must add a fourth sample");
assert(/noSafeSample = level === 5 \? seed % 2 === 0 : seed % 4 === 0/.test(game), "Choice D5 must raise the stop-treatment frequency");
for (const risk of [8, 9, 10, 12]) {
  assert(game.includes(`mistakeRisk: ${risk}`), `Choice difficulty risk ${risk} is missing`);
}
assert(game.includes("session.choiceMistakeRisk || 8"), "Choice mistakes do not use the difficulty-scaled risk");
assert(game.includes("session.choiceSampleCount || 3"), "Choice completion does not use the dynamic sample count");
assert(game.includes("[2, 3, 4, 5].map(level"), "Practice difficulty options 2-5 are missing");
assert(game.includes("data-practice-difficulty"), "Practice cards do not expose a difficulty selector");
assert(/startPracticeChallenge\(button\.dataset\.startPractice, Number\(difficultySelect\?\.value\)\)/.test(game), "Practice start does not read the selected difficulty");
assert(/session\?\.practiceDifficulty \|\| getPracticeChallenge\(practiceMechanicId\)\?\.difficultyLevel/.test(game), "Practice difficulty override is not connected to mechanicDifficulty()");
assert(css.includes(".practice-difficulty-select") && css.includes(".practice-card-actions"), "Practice difficulty controls are not styled");
assert(game.includes('el.artStage.classList.toggle("has-four-choice", currentMechanic === "choice" && session.choiceSampleCount === 4)'), "Choice D5 does not expand the artwork stage");
assert(css.includes(".art-stage.has-four-choice") && css.includes("min-height: 720px"), "Choice D5 expanded stage styling is missing");
assert(css.includes('body[data-font-size="2"] .art-stage.has-four-choice { min-height: 980px; }') && css.includes('body[data-font-size="3"] .art-stage.has-four-choice { min-height: 1180px; }'), "Choice D5 mobile stage does not grow with the large text settings");
assert(css.includes('.art-stage[data-mechanic="choice"] { touch-action: pan-y; }'), "Choice stage does not allow vertical touch scrolling");
assert(/\.mechanic-layer\[data-mechanic="choice"\][^}]*overflow-y: auto[^}]*touch-action: pan-y/.test(css), "Choice mechanic layer is not an independent vertical scroll area");
assert(game.includes('class="test-scroll-hint"') && css.includes(".test-scroll-hint"), "Choice mobile scroll guidance is missing");
assert(html.includes('class="sticky-navigation"'), "Top bar and main menu are not grouped into one sticky navigation region");
assert(css.includes(".sticky-navigation { position: sticky") && css.includes("z-index: 60"), "Sticky main navigation styling is missing");

assert(/function sequenceDifficultyParameters\([\s\S]*?scenarioCount: level === 5 \? 4 : 3/.test(game), "Sequence D5 must add a fourth scenario");
assert(/plausibleWrongCount: level <= 2 \? 0 : level === 3 \? 1 : 2/.test(game), "Sequence plausible-wrong ratio is not difficulty-scaled");
assert(game.includes("prepareProcedureScenarios(scenarios, difficulty)"), "Sequence scenarios are not filtered by difficulty");
assert(game.includes("같은 작품의 두 작은 시험구 중 한 곳은 안정하고 다른 곳은 미세한 변화"), "Sequence D5 conservation scenario is missing");

assert(game.includes('2: { hueOffsets: [-38, 34, -22, 28]'), "Tone D2 baseline color spacing changed or is missing");
assert(game.includes('5: { hueOffsets: [-7, 6, -5, 8]'), "Tone D5 close color spacing is missing");
assert((game.match(/fineComparison: true/g) || []).length >= 2, "Tone D4-D5 fine shape/texture comparison is missing");
assert(css.includes(".tone-swatch.has-fine-texture") && css.includes(".tone-swatch.tone-variant-3"), "Tone non-color fine clues are incomplete");

for (const config of [
  "2: { level, rotationStep: 5, tolerance: 2.5, nearThreshold: 15, pieceCount: 3, initialAngles: [55, -70, 85] }",
  "3: { level, rotationStep: 3, tolerance: 2, nearThreshold: 9, pieceCount: 3, initialAngles: [42, -51, 60] }",
  "4: { level, rotationStep: 2, tolerance: 1.25, nearThreshold: 6, pieceCount: 3, initialAngles: [30, -38, 46] }",
  "5: { level, rotationStep: 1, tolerance: .75, nearThreshold: 4, pieceCount: 4, initialAngles: [16, -21, 27, -19] }"
]) {
  assert(game.includes(config), `Align difficulty mapping is missing: ${config}`);
}
assert(game.includes('data-align-delta="${alignParameters.rotationStep}"'), "Align controls do not expose the difficulty rotation step");
assert(game.includes("session.hitTargets >= parameters.pieceCount"), "Align completion does not use the dynamic piece count");
assert(game.includes("const initialAngles = alignParameters.initialAngles.map"), "Align does not use the level-specific reachable starting angles");
assert(css.includes(".align-board.piece-count-4") && css.includes(".align-panel.difficulty-5 .align-seam-half"), "Align D5 layout or low-contrast pattern is missing");

for (const registration of [
  'if (currentMechanic === "uv") startUvMechanic()',
  'data-uv-target',
  'data-uv-original',
  'function hitUvTest(event)',
  'uvHistoryConfirmed: false',
  'id: "uv", artId: "sunset-painting"'
]) {
  assert(game.includes(registration), `Missing UV integration: ${registration}`);
}
assert(/magnifier: \["spot", "uv"\]/.test(game) && /uvLamp: \["uv"\]/.test(game), "UV tool mapping must overlap with spot without being identical");
assert(game.includes('if (art.id === "sunset-painting") return ["spot", "uv", "trace", "cleaning", "tone"]'), "One artwork must be able to receive both spot and UV");
assert(/function uvDifficultyParameters[\s\S]*?2: \{ level, originalCount: 2, revealScale: 1, targetContrast: 1, beamSize: 154 \}[\s\S]*?5: \{ level, originalCount: 5, revealScale: \.7, targetContrast: \.61, beamSize: 108 \}/.test(game), "UV D2-D5 distractor, contrast, or beam scaling is missing");
for (const materialCue of ["후대 덧칠·보수 니스 판독", "과거 접합부 판독", "후대 보수지·처리 흔적 판독", "과거 보강재 도포 흔적 판독", "후대 코팅 보수 판독"]) {
  assert(game.includes(materialCue), `Missing UV material presentation: ${materialCue}`);
}
assert(/\$\$\("\[data-uv-original\]"[\s\S]*?addMechanicMistake/.test(game), "Original UV fluorescence must be a mistake target");
assert(/function hitUvTest[\s\S]*?session\.uvHistoryConfirmed = true[\s\S]*?finishMechanicSoon/.test(game), "UV repair targets must record the finding through the common completion hook");
assert(/uvHistoryConfirmed: Boolean\(record\?\.uvHistoryConfirmed\)/.test(game), "UV record migration is missing");
assert(/uvHistoryConfirmed: Boolean\(record\.uvHistoryConfirmed\)/.test(game), "UV restored-state migration is missing");
assert(css.includes('.mechanic-layer[data-mechanic="uv"]') && css.includes(".uv-inspection-beam"), "UV darkroom or lamp visuals are missing");
assert(css.includes(".uv-retouch") && css.includes(".uv-adhesive") && css.includes(".uv-original-fluorescence"), "UV reaction visuals are incomplete");
assert(css.includes("border-style:dashed") && css.includes("border-style:double") && css.includes("repeating-radial-gradient"), "UV must retain non-color shape and texture cues");
assert(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.uv-finding/.test(css), "UV reduced-motion override is missing");
assert(/@media \(max-width: 680px\)[\s\S]*?\.uv-finding/.test(css), "UV mobile touch target sizing is missing");
assert(game.includes("PRACTICE_CHALLENGES.length") && game.includes("MECHANIC_IDS.length"), "Mechanic counts must be computed dynamically");

for (const registration of [
  'if (currentMechanic === "budget") startBudgetMechanic()',
  'data-budget-slider',
  'data-budget-confirm',
  'function budgetPresentation(art)',
  'function budgetDifficultyParameters(difficulty)',
  'function confirmBudgetAllocation()',
  'finishMechanicSoon(finishMessage, 2300)'
]) {
  assert(game.includes(registration), `Missing budget integration: ${registration}`);
}
for (const mapping of [
  'microPick: ["trace", "cleaning", "budget"]',
  'varnishGel: ["precision", "cleaning", "budget"]',
  'surfaceVacuum: ["trace", "cleaning", "budget"]',
  'sootSponge: ["precision", "cleaning", "budget"]'
]) assert(game.includes(mapping), `Missing budget tool mapping: ${mapping}`);
assert(/function updateBudgetAllocation[\s\S]*?100 - otherTotal/.test(game), "Budget sliders do not enforce the shared total of 100");
assert(/function confirmBudgetAllocation[\s\S]*?addMechanicMistake\(riskAdded/.test(game), "Budget structural shortage does not use the common mistake path");
assert(/function confirmBudgetAllocation[\s\S]*?appealPenalty/.test(game), "Budget visible-shortage result is missing");
assert(game.includes("appealPenalty: asNumber(record?.appealPenalty, 0, 0, 40)") && game.includes("appealPenalty: asNumber(record.appealPenalty, 0, 0, 40)"), "Budget appeal-penalty migration is missing");
assert(/state\.restored\[art\.id\]\?\.appealPenalty/.test(game), "Budget appeal penalty is not reflected in gallery appeal");
assert(css.includes(".budget-area input[type=\"range\"]") && css.includes(".budget-results article.is-deferred"), "Budget slider or result styling is missing");
assert(/@media \(max-width: 680px\)[\s\S]*?\.budget-area input\[type="range"\]/.test(css), "Budget mobile slider sizing is missing");
assert(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.budget-area/.test(css), "Budget reduced-motion handling is missing");

for (const registration of [
  'if (currentMechanic === "balance") startBalanceMechanic()',
  'data-balance-support',
  'data-balance-confirm',
  'function balancePresentation(art, toolId)',
  'function balanceDifficultyParameters(difficulty, seed = 0, shapeBias = 0)',
  'function balancePhysicsForPositions(positions, parameters)',
  'function confirmBalancePlacement()'
]) assert(game.includes(registration), `Missing balance integration: ${registration}`);
assert(/function pauseRestoration\(\)[\s\S]*?balanceState\.paused = true/.test(game), "Balance pause path is missing");
assert(/function resumeRestoration\(\)[\s\S]*?currentMechanic === "balance"[\s\S]*?updateBalancePhysicsTarget/.test(game), "Balance resume path is missing");
assert(/function clearMechanicTimers\(\)[\s\S]*?balanceState = null/.test(game), "Balance cleanup path is missing");
assert(/function confirmBalancePlacement[\s\S]*?addMechanicMistake\(riskAdded/.test(game), "Weak-point load must use the common mistake path");
assert(/@media \(max-width: 680px\)[\s\S]*?\.balance-support/.test(css), "Balance mobile support sizing is missing");
assert(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.balance-artwork-wrap/.test(css), "Balance reduced-motion handling is missing");

const normalizeStateBody = game.match(/function normalizeState\(candidate\) \{([\s\S]*?)\n  function /)?.[1] || "";
for (const transientField of ["choiceSampleCount", "choiceMistakeRisk", "alignParameters", "plausibleWrongCount", "practiceDifficulty", "dragPreviewState", "deadlineRemainingMs", "budgetState", "budgetAllocations", "balanceState", "balanceSupportPositions", "balanceRerolls"]) {
  assert(!normalizeStateBody.includes(transientField), `Difficulty-only field leaked into the save format: ${transientField}`);
}

console.log(`Feedback integration OK: ${mechanicList.join(", ")}`);
console.log("Common hooks, lifecycle preservation, pointer inputs, D5 cue gating, unchanged numeric judgments, cleaning, UV, budget, and balance registration/lifecycle, choice/sequence/tone/align difficulty parameters, save isolation, accessibility fallback, HUD, mobile layout, and reduced motion verified.");
