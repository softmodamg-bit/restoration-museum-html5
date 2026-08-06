import assert from "node:assert/strict";
import fs from "node:fs";

const game = fs.readFileSync(new URL("../js/game.js", import.meta.url), "utf8");
const index = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const hangyeolImage = fs.readFileSync(new URL("../assets/assistant-hangyeol.png", import.meta.url));
const linkPreviewImage = fs.readFileSync(new URL("../assets/link-preview-hangyeol-v2.png", import.meta.url));
const storyThresholds = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500];
const dailyGreetingBlock = game.match(/const DAILY_ASSISTANT_GREETINGS = Object\.freeze\(\[([\s\S]*?)\]\);/)?.[1] || "";
const dailyGreetings = Array.from(dailyGreetingBlock.matchAll(/^\s+"((?:[^"\\]|\\.)*)"[,]?$/gm), match => match[1]);

assert.match(game, /const DEFAULT_ASSISTANT_ID = "yoonseul"/);
assert.match(game, /yoonseul: Object\.freeze\(\{[\s\S]*?name: "윤슬"/);
assert.match(game, /hangyeol: Object\.freeze\(\{[\s\S]*?name: "한결"/);
assert.match(game, /assistantId: DEFAULT_ASSISTANT_ID/);
assert.match(game, /assistantId: Object\.hasOwn\(ASSISTANTS, candidate\.assistantId\) \? candidate\.assistantId : fallback\.assistantId/);
assert.match(game, /function assistantCopy\(value\)/);
assert.match(game, /replaceAll\("윤슬", selectedAssistant\(\)\.name\)/);
assert.match(game, /easyCopy\(assistantCopy\(paragraph\)\)/);
assert.match(game, /easyCopy\(assistantCopy\(entry\.summary\)\)/);
assert.match(game, /chooseAssistant\(button\.dataset\.assistantChoice, state\.onboardingComplete\)/);
assert.match(game, /function completeDirectorOnboarding\(withTutorial\)/);
assert.match(game, /state\.tutorialComplete = !withTutorial/);
assert.match(game, /state\.tutorialStep = withTutorial \? "story" : "complete"/);
assert.match(game, /function storyIllustrationFor\(threshold\)/);
assert.match(game, /el\.storyIllustration\.src = illustration\.src/);
assert.match(game, /anchor\.download = `\$\{localSaveTimestamp\(exportedAt\)\}_\$\{directorName\}_\$\{museumName\}\.json`/);
assert.equal(dailyGreetings.length, 45, "하루 인사는 정확히 45종이어야 합니다.");
assert.equal(new Set(dailyGreetings).size, 45, "45종의 하루 인사는 서로 달라야 합니다.");
assert.match(game, /DAILY_ASSISTANT_GREETINGS\[\(normalizedDay - 1\) % DAILY_ASSISTANT_GREETINGS\.length\]/, "게임 날짜에 따라 45종을 순환해야 합니다.");
assert.match(game, /function updateAssistantDailyGreeting\(\)/);

assert.equal((index.match(/data-assistant-choice="yoonseul"/g) || []).length, 2, "윤슬은 취임식과 비서실에 한 번씩 있어야 합니다.");
assert.equal((index.match(/data-assistant-choice="hangyeol"/g) || []).length, 2, "한결은 취임식과 비서실에 한 번씩 있어야 합니다.");
assert.match(index, /property="og:url" content="https:\/\/softmodamg-bit\.github\.io\/restoration-museum-html5\/\?share=hangyeol-v2"/, "공유 캐시를 갱신할 한결 전용 URL이 필요합니다.");
assert.match(index, /property="og:image" content="https:\/\/softmodamg-bit\.github\.io\/restoration-museum-html5\/assets\/link-preview-hangyeol-v2\.png"/, "링크 미리보기는 새 한결 전용 초상화를 사용해야 합니다.");
assert.match(index, /property="og:image:secure_url" content="https:\/\/softmodamg-bit\.github\.io\/restoration-museum-html5\/assets\/link-preview-hangyeol-v2\.png"/, "보안 연결용 미리보기 이미지도 한결이어야 합니다.");
assert.match(index, /name="twitter:image" content="https:\/\/softmodamg-bit\.github\.io\/restoration-museum-html5\/assets\/link-preview-hangyeol-v2\.png"/, "소셜 미리보기에도 새 한결 전용 초상화를 사용해야 합니다.");
assert.match(index, /<body>\s*<img class="link-preview-fallback" src="assets\/link-preview-hangyeol-v2\.png"/, "Open Graph를 무시하는 서비스도 본문의 첫 이미지에서 한결을 찾아야 합니다.");
assert.ok((index.match(/data-assistant-image/g) || []).length >= 7, "모든 주요 비서 초상화가 선택값을 따라야 합니다.");
assert.match(index, /비서는 안내 말투와 이야기 속 인물이 달라지며, 게임 보상은 같습니다/);
assert.match(index, /id="storyIllustration" class="story-illustration"/);
assert.match(index, /class="story-assistant-badge"[\s\S]*?data-assistant-image/);
assert.match(index, /id="directorTutorialStartButton"[\s\S]*?네, 처음부터 알려 주세요/);
assert.match(index, /id="directorTutorialSkipButton"[\s\S]*?아니요, 바로 시작할게요/);
assert.match(index, /class="assistant-daily-greeting"[\s\S]*?id="assistantDailyMessage"/);
assert.match(game, /el\.directorModal\.setAttribute\("aria-labelledby", "directorTutorialTitle"\)/);
assert.match(styles, /\.assistant-choice\[aria-pressed="true"\]/);
assert.match(styles, /@media \(max-width: 480px\)[\s\S]*?\.assistant-choice-list/);
assert.match(styles, /\.story-visual > span \{[^}]*top: 18px;[^}]*right: 18px;[^}]*left: auto;[^}]*translate: none;/, "스토리 아이콘은 비서 얼굴 중앙이 아니라 사진 오른쪽 위에 있어야 합니다.");
assert.match(styles, /@media \(max-width: 680px\)[\s\S]*?\.story-visual > span \{ top: 12px; right: 12px; width: 48px; height: 48px;/, "모바일에서도 스토리 아이콘이 얼굴을 피해 작은 배지로 표시되어야 합니다.");
assert.match(styles, /\.story-assistant-badge \{/);
assert.match(styles, /\.director-tutorial-greeting \{/);
assert.match(styles, /\.assistant-daily-greeting \{/);

for (const threshold of storyThresholds) {
  const fileName = `story-${String(threshold).padStart(3, "0")}.webp`;
  const image = fs.readFileSync(new URL(`../assets/story/${fileName}`, import.meta.url));
  assert.equal(image.toString("ascii", 0, 4), "RIFF", `${fileName}은 WebP 파일이어야 합니다.`);
  assert.equal(image.toString("ascii", 8, 12), "WEBP", `${fileName}은 WebP 파일이어야 합니다.`);
  assert.ok(image.length < 300 * 1024, `${fileName}은 모바일용으로 300KB 미만이어야 합니다.`);
}

assert.equal(hangyeolImage.toString("ascii", 1, 4), "PNG");
const width = hangyeolImage.readUInt32BE(16);
const height = hangyeolImage.readUInt32BE(20);
assert.equal(width, height, "한결 초상화는 UI 크롭을 위한 정사각형이어야 합니다.");
assert.ok(width >= 1024, "한결 초상화 해상도는 1024px 이상이어야 합니다.");
assert.deepEqual(linkPreviewImage, hangyeolImage, "한결 전용 링크 미리보기 파일은 검증된 한결 초상화와 같아야 합니다.");

console.log(`Assistant choice OK: 윤슬/한결 selectors, 45 unique daily greetings, tutorial choice, 16 story illustrations with assistant badge, timestamped save name, responsive cards, and ${width}x${height} Hangyeol portrait verified.`);
