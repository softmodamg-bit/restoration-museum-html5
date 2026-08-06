import assert from "node:assert/strict";
import fs from "node:fs";

const game = fs.readFileSync(new URL("../js/game.js", import.meta.url), "utf8");
const index = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const hangyeolImage = fs.readFileSync(new URL("../assets/assistant-hangyeol.png", import.meta.url));
const linkPreviewImage = fs.readFileSync(new URL("../assets/link-preview-hangyeol-v2.png", import.meta.url));

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

assert.equal((index.match(/data-assistant-choice="yoonseul"/g) || []).length, 2, "윤슬은 취임식과 비서실에 한 번씩 있어야 합니다.");
assert.equal((index.match(/data-assistant-choice="hangyeol"/g) || []).length, 2, "한결은 취임식과 비서실에 한 번씩 있어야 합니다.");
assert.match(index, /property="og:url" content="https:\/\/softmodamg-bit\.github\.io\/restoration-museum-html5\/\?share=hangyeol-v2"/, "공유 캐시를 갱신할 한결 전용 URL이 필요합니다.");
assert.match(index, /property="og:image" content="https:\/\/softmodamg-bit\.github\.io\/restoration-museum-html5\/assets\/link-preview-hangyeol-v2\.png"/, "링크 미리보기는 새 한결 전용 초상화를 사용해야 합니다.");
assert.match(index, /property="og:image:secure_url" content="https:\/\/softmodamg-bit\.github\.io\/restoration-museum-html5\/assets\/link-preview-hangyeol-v2\.png"/, "보안 연결용 미리보기 이미지도 한결이어야 합니다.");
assert.match(index, /name="twitter:image" content="https:\/\/softmodamg-bit\.github\.io\/restoration-museum-html5\/assets\/link-preview-hangyeol-v2\.png"/, "소셜 미리보기에도 새 한결 전용 초상화를 사용해야 합니다.");
assert.match(index, /<body>\s*<img class="link-preview-fallback" src="assets\/link-preview-hangyeol-v2\.png"/, "Open Graph를 무시하는 서비스도 본문의 첫 이미지에서 한결을 찾아야 합니다.");
assert.ok((index.match(/data-assistant-image/g) || []).length >= 7, "모든 주요 비서 초상화가 선택값을 따라야 합니다.");
assert.match(index, /비서는 안내 말투와 이야기 속 인물이 달라지며, 게임 보상은 같습니다/);
assert.match(styles, /\.assistant-choice\[aria-pressed="true"\]/);
assert.match(styles, /@media \(max-width: 480px\)[\s\S]*?\.assistant-choice-list/);

assert.equal(hangyeolImage.toString("ascii", 1, 4), "PNG");
const width = hangyeolImage.readUInt32BE(16);
const height = hangyeolImage.readUInt32BE(20);
assert.equal(width, height, "한결 초상화는 UI 크롭을 위한 정사각형이어야 합니다.");
assert.ok(width >= 1024, "한결 초상화 해상도는 1024px 이상이어야 합니다.");
assert.deepEqual(linkPreviewImage, hangyeolImage, "한결 전용 링크 미리보기 파일은 검증된 한결 초상화와 같아야 합니다.");

console.log(`Assistant choice OK: 윤슬/한결 selectors, optional-save migration, dynamic story copy, responsive cards, and ${width}x${height} Hangyeol portrait verified.`);
