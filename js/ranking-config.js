/*
 * Google Apps Script를 웹 앱으로 배포한 뒤 endpoint에 /exec 주소를 넣으세요.
 * 주소가 비어 있으면 실제 개인정보를 전송하지 않는 공모전 심사 데모로 동작합니다.
 */
window.RESTORATION_RANKING_CONFIG = Object.freeze({
  endpoint: "https://script.google.com/macros/s/AKfycbzfYtHzUa5xrrZjkr4FZLxoB3q6iMxEbhXShIu4Z692ZjmOP3RhKFbvg97lUw0AxOkf/exec",
  season: "공모전 시즌 1",
  gameVersion: "prototype-2026-08",
  rulesVersion: "director-score-v3"
});
