import assert from "node:assert/strict";
import fs from "node:fs";

const game = fs.readFileSync(new URL("../js/game.js", import.meta.url), "utf8");
const index = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const hangyeolImage = fs.readFileSync(new URL("../assets/assistant-hangyeol.png", import.meta.url));
const linkPreviewImage = fs.readFileSync(new URL("../assets/link-preview-hangyeol-v2.png", import.meta.url));
const storyAssetThresholds = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500];
const dailyTopicBlock = game.match(/const DAILY_ASSISTANT_TOPICS = Object\.freeze\(\[([\s\S]*?)\]\);/)?.[1] || "";
const dailyTopics = Array.from(dailyTopicBlock.matchAll(/assistantTopic\("([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\)/g), match => ({
  type: match[1], icon: match[2], label: match[3], message: match[4], reply: match[5]
}));

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
assert.match(game, /story-\$\{String\(fileThreshold\)\.padStart\(3, "0"\)\}\.webp\?v=20260806-story-scenes-v1/, "스토리 삽화는 배포 캐시를 피하는 버전 주소를 사용해야 합니다.");
assert.match(game, /el\.storyIllustration\.src = illustration\.src/);
assert.match(game, /anchor\.download = `\$\{localSaveTimestamp\(exportedAt\)\}_\$\{directorName\}_\$\{museumName\}\.json`/);
assert.equal(dailyTopics.length, 70, "하루 이야기는 정확히 70종이어야 합니다.");
assert.equal(new Set(dailyTopics.map(topic => topic.message)).size, 70, "70종의 하루 이야기는 서로 달라야 합니다.");
assert.equal(new Set(dailyTopics.map(topic => topic.reply)).size, 70, "관장의 대답도 70종의 이야기와 각각 짝을 이뤄야 합니다.");
assert.deepEqual(new Set(dailyTopics.map(topic => topic.type)), new Set(["greeting", "game", "care", "story"]), "인사·게임 팁·작품 돌봄·미술 이야기가 모두 포함되어야 합니다.");
assert.match(game, /DAILY_ASSISTANT_TOPICS\[\(normalizedDay - 1\) % DAILY_ASSISTANT_TOPICS\.length\]/, "게임 날짜에 따라 70종을 순환해야 합니다.");
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
assert.doesNotMatch(index, /class="story-assistant-badge"/, "스토리 삽화 위에 비서 배지를 겹치면 안 됩니다.");
assert.doesNotMatch(index, /id="storyIcon"/, "스토리 삽화 위에 편지 아이콘을 겹치면 안 됩니다.");
assert.match(index, /id="directorTutorialStartButton"[\s\S]*?네, 처음부터 알려 주세요/);
assert.match(index, /id="directorTutorialSkipButton"[\s\S]*?아니요, 바로 시작할게요/);
assert.match(index, /id="assistantButton"[\s\S]*?aria-controls="assistantPanel"/);
assert.match(index, /id="assistantGreetingBackdrop"[\s\S]*?class="assistant-daily-greeting"[\s\S]*?id="assistantDailyMessage"[\s\S]*?id="assistantDailyReplyButton"/);
assert.match(index, /id="assistantPanel"[\s\S]*?id="assistantPortraitButton"[\s\S]*?data-assistant-image/);
assert.doesNotMatch(index, /assistantGreetingSettingsButton|비서실 설정 열기/);
assert.match(index, /styles\.css\?v=20260808-mobile-hold-guard-v1/);
assert.match(index, /js\/game\.js\?v=20260808-mobile-hold-guard-v1/);
assert.match(game, /el\.directorModal\.setAttribute\("aria-labelledby", "directorTutorialTitle"\)/);
assert.match(game, /el\.assistantButton\.addEventListener\("click", toggleAssistantPanel\)/);
assert.match(game, /el\.assistantPortraitButton\.addEventListener\("click", openAssistantGreetingFromPanel\)/);
assert.match(game, /function openAssistantGreeting\(\)/);
assert.match(game, /function closeAssistantGreeting\(shouldResume = true\)[\s\S]*?el\.assistantPortraitButton\.focus\(\)/);
assert.doesNotMatch(game, /openAssistantPanelFromGreeting|assistantGreetingSettingsButton/);
assert.match(styles, /\.assistant-choice\[aria-pressed="true"\]/);
assert.match(styles, /@media \(max-width: 480px\)[\s\S]*?\.assistant-choice-list/);
assert.doesNotMatch(styles, /\.story-assistant-badge/, "스토리 비서 배지 스타일이 남아 있으면 안 됩니다.");
assert.doesNotMatch(styles, /\.story-visual > span/, "스토리 아이콘 스타일이 남아 있으면 안 됩니다.");
assert.match(styles, /\.director-tutorial-greeting \{/);
assert.match(styles, /\.assistant-daily-greeting \{/);
assert.match(styles, /\.assistant-greeting-backdrop \{/);
assert.match(styles, /\.assistant-greeting-modal \{/);
assert.match(styles, /\.assistant-panel \{[^}]*max-height: calc\(100dvh - 112px\)[^}]*overflow-y: auto/, "비서실은 모바일 브라우저의 실제 높이 안에서 스크롤되어야 합니다.");
assert.match(styles, /@media \(max-width: 680px\)[\s\S]*?\.assistant-panel \{[\s\S]*?env\(safe-area-inset-top\)[\s\S]*?max-height: none/, "좁은 모바일 비서실은 네 방향 안전 영역 안에 들어와야 합니다.");
assert.match(styles, /\.assistant-panel-head \{[^}]*position: sticky/, "비서실을 스크롤해도 닫기 버튼이 있는 머리글이 보여야 합니다.");

for (const threshold of storyAssetThresholds) {
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

console.log(`Assistant choice OK: 윤슬/한결 selectors, 70 mixed daily topics and paired director replies, settings-to-greeting return flow, tutorial choice, 16 clean story illustrations, timestamped save name, responsive cards, and ${width}x${height} Hangyeol portrait verified.`);
