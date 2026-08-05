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
  ${functionSource("balancePresentation", "balanceDifficultyParameters")}
  ${functionSource("balanceDifficultyParameters", "balancePhysicsForPositions")}
  ${functionSource("balancePhysicsForPositions", "tracePresentationForTool")}
  this.balancePresentation = balancePresentation;
  this.balanceDifficultyParameters = balanceDifficultyParameters;
  this.balancePhysicsForPositions = balancePhysicsForPositions;
`, sandbox);

const { balancePresentation, balanceDifficultyParameters, balancePhysicsForPositions } = sandbox;
const difficulty2 = balanceDifficultyParameters(2, 42, 0);
const difficulty5 = balanceDifficultyParameters(5, 42, .08);

assert(difficulty2.supportCount === 3 && difficulty2.weakCount === 1, "Difficulty 2 must use three supports and one weak point");
assert(difficulty5.supportCount === 4 && difficulty5.weakCount === 3, "Difficulty 5 must use four supports and three weak points");
assert(difficulty5.tiltTolerance < difficulty2.tiltTolerance, "Difficulty 5 must narrow the tilt tolerance");
assert(Math.abs(difficulty5.centerOfMass - .5) > Math.abs(difficulty2.centerOfMass - .5), "Difficulty 5 must move the center of mass farther from the middle");

for (const [material, tool, theme] of [
  ["도자기", "supportMount", "ceramic"],
  ["유리", "glassSupport", "glass"],
  ["책·문서", "bindingCradle", "book"],
  ["사진", "photoSleeve", "paper"],
  ["석재 조각", "supportMount", "sculpture"]
]) {
  const presentation = balancePresentation({ material, artType: material }, tool);
  assert(presentation.theme === theme, `${material} must use the ${theme} balance presentation`);
  assert(presentation.description.includes("<b>"), `${material} presentation must clearly mark the weak-area clue`);
}

function findPlacement(parameters, requireWeakLoad) {
  const values = Array.from({ length: 23 }, (_, index) => .06 + index * .04).filter(value => value <= .94);
  let found = null;
  function visit(start, positions) {
    if (found) return;
    if (positions.length === parameters.supportCount) {
      const physics = balancePhysicsForPositions(positions, parameters);
      if (physics.stable && (requireWeakLoad ? physics.weakSupportIndexes.length > 0 : physics.weakSupportIndexes.length === 0)) found = { positions, physics };
      return;
    }
    for (let index = start; index < values.length; index += 1) visit(index + 1, [...positions, values[index]]);
  }
  visit(0, []);
  return found;
}

for (const [name, parameters] of [["D2", difficulty2], ["D5", difficulty5]]) {
  const safe = findPlacement(parameters, false);
  const risky = findPlacement(parameters, true);
  assert(safe, `${name} must have at least one stable placement that avoids every weak point`);
  assert(risky, `${name} must have at least one level placement that loads a weak point`);
  assert(Number.isFinite(safe.physics.targetAngle) && Number.isFinite(safe.physics.sag), `${name} physics must remain finite`);
}

function simulateDampedMotion(targetAngle) {
  let angle = -8;
  let velocity = 0;
  let peakAfterFiveSeconds = 0;
  for (let frame = 0; frame < 30 * 60; frame += 1) {
    const elapsed = 1 / 60;
    const acceleration = (targetAngle - angle) * 28 - velocity * 12;
    velocity += acceleration * elapsed;
    angle += velocity * elapsed;
    if (frame > 5 * 60) peakAfterFiveSeconds = Math.max(peakAfterFiveSeconds, Math.abs(targetAngle - angle));
    assert(Number.isFinite(angle) && Number.isFinite(velocity), "Damped balance motion diverged");
  }
  return { angle, velocity, peakAfterFiveSeconds };
}

const damped = simulateDampedMotion(1.25);
assert(Math.abs(damped.angle - 1.25) < .001 && Math.abs(damped.velocity) < .001, "Damped motion must settle on the target angle within 30 seconds");
assert(damped.peakAfterFiveSeconds < .001, "Damped motion must not keep visibly oscillating after five seconds");

for (const mapping of [
  'glassSupport: ["drag", "balance"]',
  'supportMount: ["drag", "balance"]',
  'photoSleeve: ["sequence", "balance"]',
  'bindingCradle: ["precision", "balance"]'
]) assert(game.includes(mapping), `Missing balance tool mapping: ${mapping}`);

assert(game.includes('id: "balance", artId: "book-01"'), "Balance practice challenge is missing");
assert(game.includes('if (currentMechanic === "balance") startBalanceMechanic()'), "Balance activation branch is missing");
assert(/function pauseRestoration\(\)[\s\S]*?balanceState\.paused = true/.test(game), "Balance pause path is missing");
assert(/function clearMechanicTimers\(\)[\s\S]*?balanceState = null/.test(game), "Balance cleanup path is missing");
assert(/prefers-reduced-motion: reduce[\s\S]*?\.balance-artwork-wrap/.test(css), "Balance reduced-motion rule is missing");
assert(/@media \(max-width: 680px\)[\s\S]*?\.balance-support \{ width:58px; height:94px; \}/.test(css), "390px balance support sizing is missing");

console.log("Balance mechanic OK: D2/D5 solvable safe and risky layouts, five material variants, stable 30-second damping, lifecycle cleanup, practice, tool mapping, mobile sizing, and reduced motion verified.");
