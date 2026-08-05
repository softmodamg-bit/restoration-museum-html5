import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gameSource = fs.readFileSync(path.join(rootDir, "js", "game.js"), "utf8");
const cssSource = fs.readFileSync(path.join(rootDir, "styles.css"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function extractArrayConstant(source, name) {
  const marker = new RegExp(`\\bconst\\s+${name}\\s*=`).exec(source);
  assert(marker, `${name} 상수를 찾지 못했습니다.`);
  const start = source.indexOf("[", marker.index + marker[0].length);
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }
    if (character === "[") depth += 1;
    if (character === "]") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`${name} 배열 끝을 찾지 못했습니다.`);
}

const upgrades = vm.runInNewContext(`(${extractArrayConstant(gameSource, "UPGRADES")})`, {}, { timeout: 3000 });
const baseUpgrades = upgrades.filter(upgrade => upgrade.tier !== 2);
const advancedUpgrades = upgrades.filter(upgrade => upgrade.tier === 2);
const ids = new Set(upgrades.map(upgrade => upgrade.id));

assert(upgrades.length === ids.size, "시설 ID가 중복되었습니다.");
assert(baseUpgrades.length === 12, `기본 시설은 12개여야 합니다: ${baseUpgrades.length}`);
assert(advancedUpgrades.length === 12, `2단계 시설은 12개여야 합니다: ${advancedUpgrades.length}`);
assert(advancedUpgrades.every(upgrade => upgrade.unlockDay === 15), "모든 2단계 시설은 15일차에 열려야 합니다.");
assert(advancedUpgrades.every(upgrade => ids.has(upgrade.requires)), "2단계 시설의 선행 기본 시설이 누락되었습니다.");
assert(new Set(advancedUpgrades.map(upgrade => upgrade.requires)).size === baseUpgrades.length, "각 기본 시설에 정확히 한 개의 2단계 개선이 있어야 합니다.");
assert(advancedUpgrades.every(upgrade => upgrade.cost >= 1800), "후기 시설 비용이 지나치게 낮습니다.");
assert(advancedUpgrades.reduce((sum, upgrade) => sum + upgrade.cost, 0) >= 40000, "15일차 이후 코인 소비 규모가 충분하지 않습니다.");
assert(gameSource.includes("state.day >= ADVANCED_UPGRADE_UNLOCK_DAY"), "15일차 시설 목록 개방 조건이 없습니다.");
assert(gameSource.includes("state.day < (Number(upgrade.unlockDay) || 1)"), "구매 함수의 날짜 검증이 없습니다.");
assert(gameSource.includes("requiredUpgrade && !state.upgrades[requiredUpgrade.id]"), "구매 함수의 선행 시설 검증이 없습니다.");
assert(gameSource.includes("upgrade.requires || upgrade.id"), "2단계 완료 연출이 기본 시설을 가리키지 않습니다.");
assert(gameSource.includes("const upgrades = asMap(candidate.upgrades)"), "기존 upgrades 세이브 호환 경로가 바뀌었습니다.");
assert(cssSource.includes(".upgrade-card.is-tier-two") && cssSource.includes(".annex-room.is-advanced"), "2단계 시설 UI 또는 편의동 시각 변화가 없습니다.");
assert(cssSource.includes(".gallery-scene-card.has-lightingStudio") && cssSource.includes(".gallery-scene-card.has-landmarkFacade"), "전시관 2단계 시각 변화가 누락되었습니다.");

console.log(`Upgrade progression passed: ${baseUpgrades.length} base + ${advancedUpgrades.length} advanced, advanced cost ${advancedUpgrades.reduce((sum, upgrade) => sum + upgrade.cost, 0).toLocaleString()} coins.`);
