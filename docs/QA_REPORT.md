# QA Report

## 2026-08-04 전시 상호작용·단일 시설 결제·순환 전시·후반 난이도

### 구현 확인

- `입장·굿즈 수입`을 `오늘 예상 수입`으로 바꾸고, 개관 때 더해지는 값에만 `+`와 코인 아이콘을 붙였다.
- 시설 예산을 두 번 차감하던 규칙을 폐기했다. 첫 개관 수입이 시설 투자를 해금하며, 이후 모든 시설은 상단의 보유 코인 하나만 사용한다. 기존 저장의 시설 예산은 누적 개관 수입으로 안전하게 이관한다.
- 해설 키오스크 설치 시 각 작품의 명패보다 위에 `작품 해설` 버튼이 나타나고, 시대·작가·가치·이야기 대화창을 연다. 관람객은 클릭 가능한 버튼으로 바뀌어 작품별 반응 말풍선을 다시 말한다.
- 기본 4개 전시대가 찼을 때는 가장 먼저 배치한 슬롯부터 새 작품으로 교체한다. 기록실의 `이 작품 전시하기`로 수장 작품을 다시 배치할 수 있으며 같은 순환 순서를 사용한다.
- 복원 누적 6개/18개와 카탈로그 후반부에서 미니게임 난이도가 단계적으로 올라간다. 결 따라 그리기는 44 좌표 허용폭을 난이도별 30~24로 줄였다.
- 파편 가접합의 시작 파편 순서와 기울기를 매번 섞고, 후반 난이도일수록 드롭 판정 반경을 줄였다.
- 도구는 정답 선택 직후 정확히 하나만 선택 상태로 잠기며, 오선택 뒤에는 선택 표시가 남지 않는다.
- 실내 조각 정원은 벽 전체의 녹색 채광, 바닥 정원 띠, 대형 식재·조각과 잎 움직임이 함께 적용된다.

### 자동·브라우저 확인

- `node --check js/game.js`: 통과
- 6개 복원 작품과 4개 전시 슬롯 저장으로 작품 해설 버튼 4개, 실제 전시 작품 앞 관람객 버튼 8개, `+1,003🪙` 예상 수입 표시 확인
- 작품 해설 버튼이 관람객 클릭층에 가로막히는 회귀를 발견해 명패/해설만 최상단 클릭층으로 분리한 뒤, `색동 달항아리` 설명 대화창의 시대·작가·가치·이야기까지 확인
- 2,000코인·누적 개관 수입 1,200 상태에서 360코인 아트숍 구매 후 보유 코인이 1,640으로만 감소하고 시설 장면이 설치되는 것을 확인
- 기록실에서 `paper-01`, `ceramic-01`을 차례로 재전시해 슬롯이 `[paper-01, spring-scroll, sunset-painting, bronze-mirror]`, 이어 `[paper-01, ceramic-01, sunset-painting, bronze-mirror]`로 순환하는 것을 확인
- 파편 연습을 두 번 시작해 배열 `[3,0,2,1]`과 `[2,1,3,0]` 및 서로 다른 시작 기울기 확인
- 오도구 선택 뒤 선택 0개, 정답 접착제 선택 뒤 선택 1개·도구 4개 잠금 확인
- 390×844에서 페이지 너비 375px, 3열 메뉴 계산값 유지, 데스크톱·모바일 브라우저 콘솔 오류·경고 0
- Python이 설치되어 있지 않아 `python -m http.server 8080`은 실행 불가. 이미 실행 중인 의존성 없는 Node 정적 서버로 로컬 HTTP 검증

## 2026-08-04 관람객 배치·시설 예산·공간 연출·종이 정렬

### 구현 확인

- 관람객 위치를 `복원 작품 수`가 아니라 실제 갤러리 슬롯 인덱스로 계산해, 빈 전시대 앞에는 관람객과 말풍선이 생성되지 않는다.
- 시설 구매에는 총 코인과 별도로 `시설 예산`이 필요하며, 이 예산은 실제 개관 수입으로만 충전된다. 시작 지원금·복원 보상·수입 0인 개관으로는 시설을 살 수 없다.
- 12종 시설은 아이콘 상자가 아니라 조명 트랙과 광선, 해설 키오스크, 아트숍, 환경 관제판, 환기구, 소파, 기록 서가, 식재와 조각, 카페, 복원 스튜디오, 파사드, 기둥과 샹들리에로 전시장에 직접 나타난다.
- 보존용 종이의 정렬 게임은 도자기용 금·균열 대신 찢김선과 가는 섬유 결을 같은 배경 좌표에서 좌우로 나눠 그린다. 0° 판정에서 두 절반의 무늬가 실제로 이어진다.
- 종이 도구에서는 정식 작업명, 조작 안내, 완료 문장, 쉬운 설명, 작품 영향이 모두 `찢김 섬유 방향 정렬` 문맥으로 바뀐다.
- 온라인 랭킹 문서에 사용자가 준비할 Cloudflare 계정, 공개 항목, 게임 주소, Worker URL의 네 단계와 Apps Script 시험판 대안을 추가했다.

### 자동·브라우저 확인

- `node --check js/game.js`: 통과
- `node --check js/artworks-data.js`: 통과
- 데스크톱에서 복원 작품 1개·빈 슬롯 3개 상태를 만들고 관람객 2명이 모두 실제 슬롯 0 앞에 배치되는 것을 좌표와 화면으로 확인
- 코인 10,000·시설 예산 0 상태에서 집중 조명 구매가 거부되고 코인·설치 상태가 유지되며 부족 예산 안내가 표시되는 것을 확인
- 12종 전체 설치 저장으로 12개 장면 구조물과 `has-*` 공간 상태가 모두 렌더링되는 것을 확인
- `봄빛 화조도 족자`를 조사 → 시험 → 안정화 → 보존용 종이 단계까지 실제 진행하고, 세 찢김을 55°/70°/85°에서 각각 0°로 맞춰 3/3 완료 확인
- 390×844에서 주요 메뉴 6개가 3+3으로 배치되고 전시관·12개 구조물·슬롯 0 관람객 배치가 유지되는 것을 확인
- 데스크톱·모바일 브라우저 콘솔 오류·경고: 0
- Python이 설치되어 있지 않아 `python -m http.server 8080`은 실행 불가. 의존성 없는 Node 정적 서버로 로컬 HTTP 검증

### 남은 수동 확인

- 실제 iOS Safari와 Android Chrome에서 조명·환기 애니메이션의 성능과 가로 스크롤 감각을 확인할 필요가 있다.

## 2026-08-03 복원 시간·명패·접합면 정렬·제작 표기

### 구현 확인

- 복원 시작부터 완료까지 0.1초 단위 타이머를 표시하고 완료 기록에 초 단위 시간을 남긴다.
- 수장고·기록실 등 다른 메뉴, 윤슬 창, 작품 설명, 브라우저 비활성화에서는 복원 시간과 진행 애니메이션을 멈춘다.
- 중단된 복원 시간은 localStorage에 누적해 새로고침 후에도 0초로 초기화되지 않는다.
- 정확도 80% 이상에서 5단계 기준 165초 이내 금 300점, 240초 이내 은 200점, 300초 이내 동 100점과 코인 보너스를 지급한다.
- 관장 이름·미술관 이름을 윤슬 창에서 수정할 수 있고, 입력 길이·문자·반복·욕설·혐오·범죄 조장 표현·연락처를 검사한다.
- 접합면 정렬을 고정 조각과 회전 조각의 금빛 무늬·어두운 균열을 비교하며 ±5°씩 맞추는 시각 퍼즐로 변경했다.
- 첫 화면 하단에 `HTML5 · CSS · JavaScript · Codex 5.6 Sol로 제작`을 작은 글씨로 표시했다.
- 무료 온라인 랭킹 도입안은 `ONLINE_RANKING.md`에 Apps Script 시험안과 Cloudflare Worker+D1 공개안으로 정리했다.

### 자동·브라우저 확인

- `node --check js/game.js`: 통과
- `node --check js/artworks-data.js`: 통과
- 실제 브라우저에서 금·은·동·안전 미달·시간 초과 가산점 경계값 계산 확인
- 타이머 `00:00.9 → 00:01.8` 증가, 기록실 이동 뒤 `00:14.9`로 정지, 복원실 복귀 뒤 `00:15.1 → 00:16.2` 재개 확인
- `00:21.8`에서 저장·새로고침 후 `00:22.0`으로 이어져 시간 누적 저장 확인
- 취임식에서 `테러` 차단, `윤서 / 온별 복원관` 허용 확인
- 윤슬 명패 수정에서 `도박 미술관` 차단, `별빛 보존관` 저장과 상단 명칭 갱신 확인
- 접합면 정렬에서 `55° → 10°`일 때 `거의 이어졌어요`, `0°`에서 `금과 무늬 연결 완료`가 표시되며 3조각 완주 확인
- 390×844 모바일 첫 화면에서 제작 표기 10px 표시, 문서 가로 넘침 없음
- 브라우저 콘솔 오류·경고: 0
- Python이 설치되어 있지 않아 `python -m http.server 8080`은 실행 불가. 의존성 없는 Node 정적 서버로 로컬 HTTP 검증

### 발견 후 수정한 회귀

- 한글 자음 축약 금지어를 NFKC 정규화하면 자모가 필터에서 사라져 모든 이름이 금지되는 문제를 실제 입력 시험에서 발견했다. Unicode 문자·숫자를 보존하도록 정규화 규칙을 수정하고 금지/허용 입력을 다시 통과시켰다.

## 2026-08-03 복원 조작 7종 재설계

### 구현 확인

- `사광 손상 조사`: 조명 전환 버튼을 없애고 마우스·터치로 움직이는 원형 사광 안에서만 손상과 제작 흔적이 보이도록 변경했다.
- `시험구 안전 판정`: 정답이 즉시 보이지 않으며 세 시험구 반응을 각각 연 뒤 색 변화·안료 이동·광택 기준으로 선택하게 했다.
- `결 따라 표면 정리`: 방향 버튼을 없애고 붓 포인터로 세 개의 곡선 결을 직접 따라 그리도록 변경했다.
- `파편 가접합`: 4개 파편의 굴곡과 이어지는 무늬를 보는 직소퍼즐로 확장했다.
- `처리 절차 판단`: 숫자 순서를 없애고 이염·들뜸·광택 변화의 세 돌발 상황에서 안전 행동을 고르게 했다.
- `접착제 점적 타이밍`: 큰 원이 가운데 접합점 원과 겹치는 순간 탭하는 3회 판정으로 변경하고 PERFECT/GOOD/EARLY/LATE 피드백을 넣었다.
- `식별 가능한 보색`: 근소한 색 차이만 묻지 않고 결손 실루엣, 색, 가까이서 보이는 세필 무늬를 함께 비교하게 했다.
- `미세량 홀드 조절`: 점적 게임과 겹치지 않게, 누르는 시간만큼 처리량이 올라가고 초록 구간에서 놓는 기존 고유 입력을 유지했다.

### 자동·브라우저 확인

- `node --check js/game.js`: 통과
- `node --check js/artworks-data.js`: 통과
- 새 게임 진입, 500개 카탈로그, 보존 연습 10종과 각 쉬운 설명 표시 확인
- 연습 메뉴에서 `미세량 홀드 조절`과 `접착제 점적 타이밍`이 서로 다른 설명·도구·입력으로 표시되는 것을 확인
- 초기 브라우저 콘솔 오류·경고: 0
- Python은 설치되어 있지 않아 `python -m http.server 8080` 실행 불가. 의존성 없는 Node 정적 서버로 로컬 HTTP 확인
- 현재 자동 브라우저 세션에서 튜토리얼 건너뛰기용 네이티브 확인창 제어가 멈춰 새 7종의 완주 자동화는 정적 흐름·구문 검사와 초기 화면 확인으로 보완함

## 2026-08-02 미니게임 재구축

- 10종 미니게임을 복원 단계 중심의 탭·홀드·놓기 조작으로 교체했다.
- 첫 작품 배정을 `사광 손상 조사 → 시험구 안전 판정 → 접착제 점적 → 미세량 홀드 → 식별 가능한 보색`으로 고정했다.
- 브라우저에서 첫 작품의 조사·시험구·점적 단계를 실제 완료했고, 홀드 단계의 모바일/데스크톱 화면과 잘못 놓았을 때의 위험도 피드백을 확인했다.
- 1280px에서 주요 메뉴 5개 한 줄, 390px에서 3+2 배치와 미니게임 가로 넘침 없음 (`scrollWidth <= viewport`)을 확인했다.
- 개발자 콘솔 오류·경고 없음, 카탈로그 500개 표시, 500개 작품의 4~5단계 도구 맞춤 배정/10종 전체 커버리지 경고 없음.

Test date: 2026-07-27

## Environment used

- Chromium headless
- Desktop viewport: 1440 × 1000
- Mobile viewport: 390 × 844
- Static HTML/CSS/JavaScript with no external dependencies

## Automated smoke flow completed

1. Loaded the title screen.
2. Started a new museum.
3. Confirmed four artwork cards rendered.
4. Selected the moon jar and entered the restoration room.
5. Completed all five restoration steps with the correct tools.
6. Confirmed the result modal displayed 100% accuracy and rewards.
7. Placed the artwork in the gallery.
8. Confirmed one artwork rendered in a gallery slot.
9. Opened the museum for the next day.
10. Confirmed visitor, income, and reputation results appeared.

## Results

- JavaScript syntax check: passed (`node --check js/game.js`)
- Runtime console errors during tested flow: 0
- Page errors during tested flow: 0
- Desktop artwork cards rendered: 4
- Mobile document width: 390px at a 390px viewport; no unintended page-wide horizontal overflow
- Core flow completion: passed
- Touch-target implementation: Pointer Events used throughout restoration stage
- Save mechanism: localStorage implemented; state writes occur after economy, upgrade, restoration, and day changes

## Visual checks

- Title screen is balanced at desktop and mobile widths.
- Storage cards collapse to one column on mobile.
- Navigation and resource bar remain visible and readable at 390px.
- Result modal fits within the viewport and scrolls when necessary.

## 2026-07-27 collection, save, and music expansion

### Automated checks

- `node --check js/artworks-data.js`: passed
- `node --check js/game.js`: passed
- Catalog integrity: 196 additional entries, 196 unique IDs, 196 unique titles, 14 material groups
- Total catalog size with the original four: 200

### Browser checks

- New game opened with `0/200` collection progress
- Initial collection renders 24 cards and **작품 더 보기** increases it to 48
- Search for `사진` returned 14 matching works
- Material filter `직물·자수` returned 14 works
- Records screen exposes save export, save import, and reset controls
- Save export handler completed without console errors
- Music toggle changed both icon and accessible label and could be turned back on
- Mobile viewport check at 390 × 844: one-column artwork grid, one-column filter bar, no horizontal overflow
- Browser console warnings/errors: none

## 2026-08-05 one-click Google Apps Script ranking submission

### Automated checks

- Deployed Google Apps Script `/exec` endpoint returned HTTP 200 and the `공모전 시즌 1` leaderboard page; the empty-state table rendered without a setup error
- `js/ranking-config.js` now points to the verified deployment, so the records screen switches from contest demo mode to the connected public leaderboard state
- `node --check js/game.js`: passed
- `node --check js/ranking-config.js`: passed
- `ranking-apps-script.gs` copied to a temporary `.js` path for a V8 syntax check: passed
- `node scripts/test-ranking-backend.mjs`: passed with a 19,360-point recomputation plus duplicate artwork and prohibited-name rejection
- HTML duplicate ID check: 0 duplicates across 176 IDs
- Existing saves without `rankingPlayerId` receive a new anonymous ID; save export/import preserves it afterward
- Ranking submissions contain only identity labels, progress summary, and compact restoration records; the full save and settings are excluded
- Client and Apps Script now use the same versioned score formula; the current rule is `director-score-v2`
- Apps Script revalidates names and record ranges, hashes the player ID, protects writes with `LockService`, and upserts one best score per player and season

### Browser checks

- Records actions rendered as two equal-width ranking buttons on the first row and three equal-width save buttons on the second row
- The privacy note rendered as two explicit lines, and the connected-card duplicate sentence was visually hidden while retaining an empty live-status region
- Existing six-artwork save opened without reset and rendered the records screen
- Records screen displayed restore count, average accuracy, average risk, predicted director score, and the `심사용 데모 모드` badge
- One click on `현재 기록 제출` generated the in-memory submission and opened the contest demo receipt with matching values: 6 artworks, 93% accuracy, 7% risk, 56,660 points
- Closing the receipt restored the records screen and browser console warnings/errors remained empty
- At 390 × 844, the receipt used a two-column score grid, the ranking card used a 58 px icon plus content column, and body scroll width stayed within the viewport

### Environment note

Python is not installed in this environment, so the required `python -m http.server 8080` command could not start. Browser verification used a dependency-free Node static server instead. A real shared ranking still requires the owner to deploy `ranking-apps-script.gs` and paste the resulting `/exec` URL into `js/ranking-config.js`.

## 2026-08-05 background BGM pause

### Automated checks

- `node --check js/game.js`: passed
- Window `blur` now pauses restoration and stops both file and synthesized music
- Window `focus` resumes restoration and restarts music only when sound is enabled and the game screen is open
- `startMusic` refuses to start while the document does not have focus, preventing delayed callbacks from restarting BGM in the background

### Browser checks

- Existing save entered the game and synthesized BGM reported the playing state after a user gesture
- Browser console warnings/errors: none
- The in-app test browser creates background tabs without moving operating-system focus, so a physical Alt+Tab transition still needs one final manual check

### Environment note

The required Python command could not be run because Python is not installed in this environment. A dependency-free Node static server was used for the same local HTTP browser test.
- SVG art is original prototype art created in code, not final production illustration.
- Audio is synthesized with Web Audio and is intentionally minimal.
- No cloud save, account system, analytics, localization, or backend.
- Browser matrix testing for iOS Safari and Android Chrome has not yet been performed on physical devices.
- No formal Lighthouse report is included yet.

## 2026-07-27 director, story, and restoration interaction expansion

### Automated checks

- `node --check js/game.js`: passed
- `node --check js/artworks-data.js`: passed
- Extended catalog lore completeness: 196/196 entries include era, artist, type, origin, cultural value, and story
- Extended catalog visual seeds: 196 unique seeds across 196 entries
- All six restoration mechanics are represented in the extended catalog:
  - spot observation: 196 artworks
  - safety comparison: 70 artworks
  - trace cleaning: 126 artworks
  - drag placement: 126 artworks
  - hold stabilization: 112 artworks
  - precision balance: 98 artworks

### Browser checks

- Director onboarding accepted a director name and museum name and retained them after reload
- Assistant panel displayed personalized, view-specific guidance and current museum statistics
- Artwork story modal displayed era, artist, type, origin, cultural value, story, and fictional-content notice
- Completed `봄빛 화조도 족자` with spot, comparison, keyboard hold, and keyboard drag mechanics at 100% accuracy
- Verified trace-path and precision-slider mechanics on `노을 정원의 산책`
- Desktop restoration completion modal rendered without clipping
- Mobile viewport at 390 × 844 showed a one-column catalog, compact top navigation, and no visible page-wide horizontal overflow
- Browser console warnings/errors: none

### Current limitations

- Extended artwork biographies are fictional game content, not scholarly records for real-world artworks.
- Expanded catalog artwork graphics are procedurally varied SVG compositions rather than individually illustrated production assets.
- Physical-device testing on iOS Safari and Android Chrome remains outstanding.

## 2026-07-27 story, BGM, visitor, and 500-artwork expansion

### Automated checks

- `node --check js/game.js`: passed
- `node --check js/artworks-data.js`: passed
- Final catalog: 500 entries total, 500 unique IDs, 500 unique titles
- Extended artwork lore completeness: 496/496
- Attached candidate handling: 198 transformed game entries
- High-risk source candidates: 27 entries visible but locked for rights review
- Additional original archive entries: 102
- Story state migration fields preserved for older local saves

### Browser checks

- Existing save loaded without reset and displayed the new prologue once
- BGM control changed to `현재 재생 중`; Web Audio context resumed from the continue-button user gesture
- Music note gain was raised from the previous barely audible level
- Restored `노을 정원의 산책` through spot, comparison, trace, and two precision stages at 100% accuracy
- Closing the restoration result at appeal 128 opened the appeal-100 chapter
- Story progress panel advanced to 128/200 after chapter 1
- Gallery displayed artwork-aware visitor speech bubbles
- Catalog summary displayed 500 entries and `우유빛 오후의 부엌` search returned one transformed candidate
- Source candidate #58 search returned one `권리 검토 중` locked card
- Mobile viewport 390 × 844: compact BGM status, 3/500 progress, filters, and artwork card rendered without visible page-wide overflow
- Browser console warnings/errors: none

### Environment note

The required Python static-server command could not be run because Python is not installed. The dependency-free Node static server was used for the local HTTP browser test.

## 2026-07-27 audible WAV BGM and story archive

### Automated checks

- `node --check js/game.js`: passed
- `node --check js/artworks-data.js`: passed
- `node --check scripts/generate-bgm.mjs`: passed
- `assets/museum-bgm.wav`: valid RIFF/WAVE header, 1,411,244 bytes
- Existing saves migrate to the new `musicVolume` field with a safe 70% default

### Browser checks

- Continue-button input started the actual `assets/museum-bgm.wav` element
- Audio reached `readyState 4`, remained unpaused, and advanced past 20 seconds
- Story-menu volume changed to 75% and the BGM test button restarted playback
- BGM status displayed `실제 음원 재생 중 · 75%`
- Story tab showed appeal 128, chapter 1/10, the next 200-appeal objective, unlocked chapters, and locked chapters
- Prologue replay opened the complete `봉인된 관장실의 편지` dialog
- Desktop and 390 × 844 mobile layouts displayed the story archive without visible horizontal overflow
- All five mobile navigation items remained visible
- Browser console warnings/errors: none

### Environment note

The required Python static-server command could not be run because Python is not installed. The dependency-free Node static server was used for the local HTTP browser test. Physical-device speaker output still requires a final subjective listening pass.

## 2026-07-27 ten-challenge difficulty and BGM reliability update

### Automated checks

- `node --check js/game.js`: passed
- `node --check js/artworks-data.js`: passed
- Catalog remained at 500 artworks
- All artworks are normalized to exactly five restoration steps
- Every artwork receives five unique mechanics
- Aggregate mechanic coverage is 10/10 with no integrity warning
- WAV signal analysis: 32 seconds, peak 0.82, RMS -13.87 dBFS, 95.8% active samples

### Browser checks

- Desktop navigation: five 224px columns on one row
- Mobile navigation: three columns with 3+2 row distribution and no horizontal overflow
- Played spot search with decoy marks, pressure rhythm, memory sequence, stability timing, angle alignment, safety comparison, precision timing, and tone matching
- Stability timing needle moved across a 21% target zone and required three successful stops
- Precision timing needle moved faster across a 12% target zone and required three successful stops
- Safety comparison exposed explicit thresholds for color change, pigment transfer, and gloss change
- Existing save loaded and completed a five-step restoration
- BGM started through decoded Web Audio buffer mode, force-restart retained playback, and no fallback warning occurred
- Browser console warnings/errors: none

### BGM diagnosis

The WAV itself is not silent, but the later WAV-decoding route did not restore audible output for the user. The current build therefore restores the original real-time synthesized Web Audio score as the primary route. The WAV remains only as a fallback.

## 2026-07-27 occupied-display visitors, income popups, and audio restoration

### Automated checks

- `node --check js/game.js`: passed
- `node --check scripts/generate-sfx.mjs`: passed
- Seven generated SFX files have valid RIFF/WAVE headers: click, hit, wrong, success, open, complete, and coin
- The music primary route is the original real-time Web Audio synthesizer; `assets/museum-bgm.wav` remains the fallback

### Browser checks

- Restored one artwork through all five steps at 100% accuracy and placed it in the gallery
- One occupied display produced exactly two visitors, both tagged for slot 0
- Three empty displays produced no visitors and no speech bubbles
- Opening the museum showed two visitor-head income popups, `띠링 +🪙43` each, exactly totaling the 86-coin day income
- The sound control recorded the `coin` effect during the popup sequence
- Four occupied displays produced two visitors per occupied slot and no off-slot visitors
- Button input recorded the `click` effect, restoration completion recorded the `success` effect, and BGM status reported the original synthesized score as playing
- Browser console warnings/errors: none

## 2026-08-02 first-rotation tutorial

### Automated checks

- `node --check js/game.js`: passed
- `node --check js/artworks-data.js`: passed
- HTML duplicate ID check: 0 duplicates across 123 IDs
- Older saves without tutorial fields migrate with the tutorial already completed; newly created museums start with the tutorial enabled

### Browser checks

- Completed a fresh director onboarding and prologue, then verified the guide automatically highlighted the first artwork story
- Verified automatic transitions for artwork explanation, restoration start, all five restoration steps, result placement, gallery opening, day report, and tutorial completion
- Completed memory sequence, safety comparison, structure-piece placement, tone selection, and three-hit precision timing at 100% accuracy
- Reloading during the post-restoration tutorial recovered to the gallery step without losing the restored artwork
- Finishing the tutorial hid the guide and it remained hidden after reload
- 390 × 844 viewport: tutorial card remained within the viewport, target button stayed visible, navigation kept the 3+2 layout, and no horizontal page overflow appeared
- Tutorial skip control ended the guide without changing the current game state
- Browser console warnings/errors: none

## 2026-08-03 accuracy rewards, facility expansion, and conservation practice

### Automated checks

- `node --check js/game.js`: passed
- Existing boolean upgrade saves remain compatible; new `practiceBest`, accuracy grade, and bonus fields receive safe defaults
- Facility catalog expanded from 4 to 12 investments across four categories
- Conservation practice catalog exposes all 10 mechanics with matching tools and artwork contexts

### Browser checks

- Desktop navigation displayed all six menus on one row
- Mobile viewport 390 × 844 displayed the six menus as 3+3 and the practice cards in one column
- Conservation practice displayed 10 selectable cards and launched `사광 손상 조사` with the correct tool and active controls
- Practice mode showed `보상 없음`, moved the shared restoration workspace into the practice view, and returned it to the real lab without changing 210 coins or 0 reputation
- Facility panel displayed 12 investments and four category headers
- Buying the 180-coin focus lighting reduced the test balance from 250 to 70, changed the gallery to `has-lighting`, widened the light beam to 190px, and installed the visible `작품 조명` object
- Original synthesized BGM reported `현재 재생 중`
- Browser console warnings/errors: none

### Remaining manual check

- Physical-device touch and speaker output should still be checked on iOS Safari and Android Chrome.

## 2026-08-03 plain-language conservation guidance

### Automated checks

- `node --check js/game.js`: passed
- All 10 mechanics include both a plain-language explanation and an artwork-impact explanation
- HTML duplicate ID check: 0 duplicates across 141 IDs

### Browser checks

- All 10 conservation practice cards displayed `게임 방법`, `쉽게 말하면`, and `작품 변화`
- The live minigame displayed the formal task name above the plain-language and artwork-impact rows
- Desktop and 390 × 844 mobile layouts had no page-wide horizontal overflow
- Mobile explanation rows stacked into a readable single column
- Browser console warnings/errors: none

### Environment note

Python is not installed in this environment, so the browser check used the dependency-free Node static server.

## 2026-08-04 accessibility, restoration matching, themed BGM, and gallery layout

### Automated checks

- `node --check js/game.js`: passed
- `node --check js/artworks-data.js`: passed
- Existing saves without `fontSize` or `totalVisitors` migrate to safe defaults
- Synthetic repeated `최종 상태 검수` padding was removed; authored artwork plans now keep their actual 4–5 steps
- Tool candidate pools no longer fall back to unrelated mechanics

### Browser checks

- New director onboarding prefilled `서리`
- Topbar showed cumulative visitors and preserved the four-chip mobile row at 390 px
- Font controls persisted levels 1–3; level 3 raised the smallest guided copy to 14 px
- Storage, lab, gallery, story, records, and practice use separate live-generated music themes; lab and gallery reported their theme names while playing
- Safety comparison displayed explicit `0~5% 기준 이내`, `5% 초과`, pigment pass/risk labels
- Selecting the test swab activated the test mechanic, applied a 5 px backdrop blur, and the step restart button reset the current mechanic
- Fragment practice generated different piece order and tilt values after restart
- All 12 fixtures rendered together without gallery-card stretching; garden, guide, lounge, shop, cafe, and grand-hall treatment used the 150 px lower floor
- The facade stayed above the lighting rail and did not cover artwork
- Clicking the guide kiosk produced a speech bubble for a random displayed artwork with era, artist, story, and visitor etiquette
- Browser console warnings/errors: none

### Environment note

Python is not installed in this environment, so the browser check used the dependency-free Node static server. Physical-device audio and touch should still receive a final subjective pass.

## 2026-08-03 material-specific conservation guidance

### Automated checks

- `node --check js/game.js`: passed
- All 14 artwork material groups have a dedicated observation point and treatment-effect explanation
- Runtime validation warns when catalog materials do not have a matching guide
- HTML duplicate ID check: 0 duplicates across 142 IDs

### Browser checks

- Conservation practice cards changed their plain-language and impact copy for ceramic, oil-painting, paper-and-color, and metal examples
- The live ceramic practice displayed `도자기 맞춤 안내`; switching to paper changed it to `종이·채색 맞춤 안내`
- Desktop and 390 x 844 mobile layouts had no page-wide horizontal overflow
- The mobile material badge and both explanation rows remained visible and readable in a single-column layout
- Browser console warnings/errors: none
## 2026-08-05 15일차 시설 2단계 개선

- 기본 시설 12개를 모두 설치한 뒤에도 코인을 쓸 수 있도록, 15일차에 열리는 2단계 개선 12개를 추가했다.
- 각 개선은 대응하는 기본 시설을 먼저 설치해야 하며, 구매 함수가 15일차 조건과 선행 시설 조건을 다시 확인한다.
- 후기 시설의 총비용은 42,200코인이다. 추가 효과는 전시 매력, 관람객, 수입, 평판, 복원 지원금에 나누어 배치하고 전시 슬롯 상한 6칸과 반복 전시 관심도 규칙은 유지했다.
- 전시관의 조명·해설·상태 감지·온도와 습도·기록실·복원 센터·외관, 편의동의 상점·쉼터·정원·카페·특별 전시실에 2단계 전용 색·조명·표지판·소품 연출을 추가했다.
- 구형 세이브와 같은 `state.upgrades` 불리언 맵에 새 ID만 선택적으로 저장하므로 별도 저장 마이그레이션은 필요하지 않다.
- `node --check js/game.js`, 전체 `scripts/test-*.mjs`, 텍스트 검수본 재생성을 통과했다.
- `scripts/test-upgrade-progression.mjs`에서 기본/2단계 각 12개, 15일차 개방, 일대일 선행 시설, 42,200코인 비용, 구매 방어 로직, 시각 클래스 존재를 확인했다.
- 로컬 서버에서 1440×1000과 390×844로 앱을 다시 열어 콘솔 오류가 없음을 확인했다.

## 2026-08-05 후일담 5편과 관장 랭킹 v2

- 매력도 1,000 엔딩 뒤에 1,100~1,500 구간의 고정 후일담 5편을 추가하고, 무한 자동 생성 에필로그를 종료했다.
- 마지막 후일담을 연 게임 날짜를 선택적 `storyCompletionDay`로 저장한다. 구형 세이브가 이미 1,500 이상 진행됐다면 현재 저장 날짜를 안전한 완주일로 보완한다.
- 랭킹은 기존 복원 점수에 누적 개관 수입, 누적 관람객, 후일담 5편 완주 속도 보너스를 더한다. 수입·관람객은 각각 최대 5,000점이며, 25일 완주는 4,500점이다.
- 클라이언트와 Apps Script를 `director-score-v2`로 맞췄다. 서버가 운영 수치를 다시 제한·계산하며, v1 행은 삭제하지 않고 v2 공개 목록과 최고 기록 비교에서 제외한다.
- `node --check js/game.js`와 전체 `scripts/test-*.mjs`를 통과했다. 서버 예제 기록은 복원 19,360점 + 수입 1,000점 + 관람객 240점 + 25일 완주 4,500점 = 25,100점으로 재계산됐다.
- 실제 브라우저에서 스토리 0/15, 후일담 5편 제목, 기록실의 누적 수입·관람객·이야기 진행·예상 점수를 확인했다.
- 390×844에서 페이지 전체 가로 넘침이 없었고, 브라우저 콘솔 경고·오류도 없었다.

## 2026-08-06 선택 가능한 비서 윤슬·한결

- 새 게임의 관장 취임 화면과 비서실에 윤슬·한결 선택 카드를 추가했다. 선택은 안내 캐릭터만 바꾸며 게임 보상과 난이도는 같다.
- 한결은 특정 실존 인물의 얼굴을 복제하지 않은 독자적인 남자 비서 캐릭터로 제작했다.
- 선택한 비서의 이름과 초상화가 타이틀, 상단 버튼, 첫 운영 안내, 비서실, 이야기 창에 함께 반영되는지 확인했다.
- 구형 저장에는 `assistantId`가 없으므로 윤슬을 기본값으로 읽고, 새 선택값은 기존 저장 구조에 선택 필드로만 추가한다.
- 데스크톱에서 윤슬↔한결 즉시 전환과 새로고침 뒤 선택 유지를 확인했다.
- 390×844에서 취임 화면과 비서실의 두 선택 카드가 모두 보이고, 페이지 전체 가로 넘침이 없음을 확인했다.
- `node --check js/game.js`, 전체 `scripts/test-*.mjs`, 한결 초상화 PNG 검사와 비서 선택 전용 정적 검사를 통과했다.
- 외부 링크 미리보기용 Open Graph·Twitter 이미지를 한결 초상화의 절대 GitHub Pages 주소로 고정하고, 전용 정적 검사에 두 메타 태그 검증을 추가했다.

## 2026-08-06 모바일 복원실 빠른 도구함

- 900px 이하의 한 열 복원실에서 도구 선택 카드를 작품 작업 화면보다 먼저 배치했다. 작품 안내·상태 기록·작업 방법은 작업 화면 뒤에 유지했다.
- 네 도구를 한 줄에 표시하고 680px 이하에서 버튼 높이 72px, 아이콘 24px의 터치용 간격을 적용했다.
- 새 복원 단계와 다시하기에서는 빠른 도구함을 화면 가운데로 가져오며, 동작 줄이기 설정에서는 부드러운 스크롤을 사용하지 않는다.
- 390×844에서 도구 네 개의 노출, 선택 후 미니게임 잠금 해제, 페이지 가로 넘침 없음과 작업 화면보다 앞선 배치를 확인했다.
- 750×832에서도 네 버튼이 각각 146px 폭으로 한 줄 배치됐고, 1280×900에서는 기존 2열 배치와 오른쪽 도구 패널이 유지됐다.
- `node --check js/game.js`, `scripts/test-mobile-tool-tray.mjs`, 미니게임 공통·쉬운말 검증을 통과했다.

## 2026-08-06 한결 링크 미리보기 캐시 보강

- 기존 공개 Pages의 `og:image`와 실제 이미지가 이미 한결임을 확인했다. 외부 앱이 이전 링크 카드를 캐시하거나 Open Graph 대신 본문의 첫 윤슬 이미지를 고를 가능성을 확인했다.
- 한결 전용 새 파일명과 버전이 붙은 공유 URL을 사용하고, `og:image:secure_url`, Twitter 대체 설명, `itemprop=image`, `image_src`를 함께 제공했다.
- Open Graph를 무시하는 서비스용으로 본문의 첫 이미지도 화면 밖 한결 대체 이미지로 고정했다. 이 이미지는 접근성 트리와 게임 화면에는 노출되지 않는다.
- `node --check js/game.js`와 전체 `scripts/test-*.mjs`를 통과했다. 로컬 브라우저의 1280×900·390×844에서 첫 이미지가 한결이면서 화면에는 보이지 않고, 가로 넘침도 없음을 확인했다.

## 2026-08-06 모바일 복원실 플레이 우선 배치

- 접은 폴드뿐 아니라 펼친 모바일 화면에서도 주요 메뉴와 튜토리얼을 접을 수 있도록 모바일 기준을 820px로 넓혔다.
- 820px 이하 복원실은 빠른 도구함과 실제 미니게임을 먼저 보여 주고, 작품 안내·상태 기록·작업 방법·작품 제목·전체 복원 순서를 모두 그 아래로 배치했다.
- 올바른 도구를 고르면 실제 미니게임 카드가 고정 메뉴 바로 아래로 자동 이동한다. 680px 이하에서는 단계·시간과 스트릭·위험도를 두 줄로 줄였고, 조사·조절형 게임의 불필요한 세로 여백도 화면 높이에 맞췄다.
- 390×844에서 도구 선택 전 빠른 도구함과 게임 시작 부분이 함께 보였고, 선택 후에는 상태 HUD와 사광 조사 게임 전체가 한 화면에 들어왔다. 750×832에서는 접힌 메뉴와 플레이 우선 순서를, 1280×900에서는 기존 메뉴·2열 복원실을 확인했다.
- `node --check js/game.js`와 전체 `scripts/test-*.mjs`를 통과했으며 세 화면 모두 가로 넘침과 브라우저 콘솔 오류가 없었다.

## 2026-08-06 모바일 도구 선택 단서

- 모바일 빠른 도구함에 현재 단계명과 해야 할 일을 짧게 함께 표시한다. 정답 도구명은 알려 주지 않아 도구를 고르는 판단은 유지한다.
- 작품 안내와 상태 기록을 게임 아래에 둔 플레이 우선 배치는 유지하면서, 도구 선택에 꼭 필요한 단서는 스크롤 없이 확인할 수 있게 했다.
- 글씨 크기 2·3 설정에서도 단서 문구가 함께 확대되도록 접근성 글자 크기 계층에 포함했다.
- 390×844에서 `손상 조사 · 금과 빈 곳 위치를 확대 관찰하세요.`가 네 도구 바로 위에 보였고, 도구 버튼은 각각 75px 폭을 유지했다. 750×832에서는 각각 153px 폭으로 표시됐다.
- 두 모바일 폭 모두 페이지 가로 넘침이 없었다. 1280×900에서는 단서가 숨겨지고 기존 2열 복원실이 유지됐으며 브라우저 경고·오류가 없었다.
- `node --check js/game.js`와 전체 `scripts/test-*.mjs`를 통과했다.

## 2026-08-06 모바일 시험구 목록 스크롤

- 시험구 안전 판정에서 선택지가 작업 영역 높이를 넘을 때 잘리던 문제를 수정했다.
- `choice` 미니게임에만 세로 터치 스크롤을 허용하고, 다른 미니게임의 드래그·터치 판정은 유지했다.
- 모바일 화면에 `위아래로 밀어 모든 시험구를 확인하세요` 안내를 표시해 아래 시험구와 처리 중단 버튼이 있다는 것을 알 수 있게 했다.
- 390×844 브라우저 크기에서 작업 영역 790px, 내용 1065px인 상태로 끝까지 실제 스크롤했다. 시험구 A~D를 모두 관찰한 뒤 처리 중단 버튼이 활성화·노출되고, 안전한 시험구 C를 선택해 연습 완료 화면까지 진입했다.
- 1280×900에서는 시험구 3개가 기존 2열 배치로 한 화면에 들어오고, 모바일 스크롤 안내가 숨겨지며 불필요한 내부 스크롤이 생기지 않는 것을 확인했다.

## 2026-08-06 모바일 미니게임 공통 세로 접근

- 시험구만 고쳤던 예외 규칙을 제거하고, 680px 이하의 `spot`·`uv`를 제외한 모든 미니게임 작업층에 내용이 넘칠 때만 작동하는 공통 세로 스크롤을 적용했다.
- 수정 전 390×844·난이도 5 전수 측정에서 `drag`, `sequence`, `rhythm`, `tone`, `align`, `cleaning`, `budget`의 하단 조작부가 작업 영역 밖으로 잘리는 것을 확인했다. `choice`도 기존 개별 스크롤이 없으면 같은 문제였다.
- 수정 후 시험구는 최대 281px, 처리 절차는 67px, 접합 정렬은 231px, 세척 강도는 105px, 처리량 나누기는 276px까지 실제 손가락 스크롤을 재현했고 각각 마지막 선택지·확정 버튼이 보였다.
- 글씨 크기 3의 색 비교는 434px, 파편 맞추기는 175px까지 실제 스크롤해 네 색 카드와 퍼즐 상태를 모두 확인했다.
- 파편 조각과 세척 Canvas는 `touch-action: none`, 바깥 작업층은 `pan-y`로 계산되는 것을 확인해 끌기·그리기 입력과 세로 스크롤을 분리했다. 1280×900에서는 공통 모바일 규칙이 꺼지고 기존 데스크톱 배치와 가로 폭이 유지됐다.

## 2026-08-06 복원 결과 전시 버튼 우선 배치

- 복원 결과 창 맨 아래에 있던 `전시관에 배치` 버튼을 작품명 바로 아래로 옮겨, 점수·보너스·보존 원칙 설명을 스크롤하지 않아도 바로 전시관으로 이동할 수 있게 했다.
- 결과 창을 다시 열 때 이전 스크롤 위치가 남지 않도록 항상 맨 위에서 시작하게 했다.
- 390×844에서 버튼 전체가 첫 화면 안에 들어왔고, 390×640에서도 DOM 첫 화면 순서에서 작품명 다음에 버튼이 노출되는 것을 확인했다.
- `node --check js/game.js`와 전체 `scripts/*.mjs` 검증을 통과했다.

## 2026-08-06 수장고 작품 우선순위 정렬

- 수장고에서 검색어·재료·복원 상태 필터를 적용한 뒤 `복원 가능 → 잠김 → 복원 완료` 순서로 안정 정렬한다.
- 작품 더 보기의 24개 단위 분할보다 먼저 정렬하므로, 모바일과 데스크톱 모두 첫 목록에서 지금 바로 복원할 수 있는 후보를 우선 확인할 수 있다.
- `복원 완료` 필터와 기록실의 작품 기록·재전시 기능은 그대로 유지하며 작품 데이터와 세이브 순서는 바꾸지 않는다.
- 전용 정렬 검사에서 원본 배열 불변, 세 그룹 내부 순서 유지, 평판 해금 반영, 권리 확인 작품의 잠김 유지, 필터 뒤 정렬을 확인했다.
- 복원 완료 작품 1점과 평판 10인 저장으로 390×844와 1280×900 수장고를 열어 `봄빛 화조도 족자`가 복원 가능 첫 카드로 나오고 잠긴 작품들이 그 뒤를 잇는 것을 확인했다. 첫 24개에는 완료 카드가 없고, `복원 완료` 필터에서는 `색동 달항아리`만 다시 나타났다.
- 모바일은 한 열, 데스크톱은 네 열을 유지했고 두 화면 모두 가로 넘침과 브라우저 경고·오류가 없었다.

## 2026-08-06 스토리 아이콘 얼굴 겹침 수정

- 스토리 사진 중앙에 놓여 비서의 얼굴을 가리던 장별 아이콘을 사진 오른쪽 위의 독립된 밝은 배지로 옮겼다.
- 모바일에서는 배지를 48px로 줄이고 모서리에서 12px 떨어뜨려 한결·윤슬의 얼굴과 겹치지 않게 했다.
- 장별 아이콘과 이야기 내용은 유지하며 스토리 진행 및 세이브 형식은 바꾸지 않았다.
- 1280×900에서는 64px 배지가 얼굴 중앙을 벗어났고, 390×844에서는 48px 배지와 비서 사진의 경계가 겹치지 않았다. 두 화면 모두 가로 넘침과 브라우저 경고·오류가 없었다.
