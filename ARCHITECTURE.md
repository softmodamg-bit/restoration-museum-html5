# 반짝! 복원 미술관 아키텍처

## 작업 전 필수 규약

이 저장소에서 코드를 수정하는 사람과 에이전트는 **코드를 열어 고치기 전에 이 문서를 처음부터 끝까지 먼저 읽어야 한다.** 그다음 `AGENTS.md`를 읽고, 두 문서의 규약을 함께 따른다.

- 이 문서에 적힌 구조와 실제 코드가 다르면 추측으로 작업하지 말고 실제 호출 경로를 다시 확인한다.
- 미니게임, 저장 데이터, 작품 데이터, 결과 반영 경로를 변경했다면 같은 작업 안에서 이 문서도 갱신한다.
- 정적 HTML5 배포, 마우스·터치 지원, 기존 `localStorage` 세이브 호환성을 유지한다.
- 저장 형식이 달라지면 반드시 마이그레이션을 추가한다.
- 실제 보존 윤리를 지키되 위험한 화학 배합·농도·처리법은 게임에 노출하지 않는다.
- 새 미니게임은 작품 재질과 복원 단계에 맞아야 하며, 모든 작품에 동일한 상호작용을 반복 배정하지 않는다.
- 현재 구조에는 독립된 미니게임 클래스나 플러그인 인터페이스가 없다. 새 게임을 추가할 때 아래의 렌더링, 입력 연결, 실행, 정리, 결과 반영 경로를 모두 확인한다.

## 저장소 주요 파일

| 경로 | 역할 |
| --- | --- |
| `index.html` | 앱의 고정 화면 구조, 메뉴, HUD, 모달 및 스크립트 로드 순서 |
| `styles.css` | 전체 화면 디자인, 반응형 규칙, 미니게임별 시각 상태와 애니메이션 |
| `js/artworks-data.js` | 생성 작품 496점의 재질 프로필, 복원 단계·도구·설명 데이터 |
| `js/game.js` | 핵심 작품 4점, 전역 상태, 14종 미니게임, 복원 진행, 전시·관람객·수익·저장·랭킹 연계 |
| `assets/assistant-yoonseul.png`, `assets/assistant-hangyeol.png` | 선택 가능한 비서 윤슬·한결의 정사각형 초상화 |
| `assets/story/story-000.webp` ~ `story-1500.webp` | 프롤로그와 매력도 100~1,500 이야기 16장의 상황별 삽화 |
| `assets/link-preview-hangyeol-v2.png` | 외부 링크 공유 캐시와 본문 첫 이미지 추출에 사용하는 한결 전용 홍보 초상화 |
| `ranking-apps-script.gs` | Google Apps Script 랭킹 제출·조회 백엔드와 랭킹 페이지 |
| `scripts/` | 데이터, 시각 다양성, 랭킹 백엔드 등 보조 검증 스크립트 |
| `docs/` | 게임 기획, 구현 브리프, QA 기록 |

`index.html`의 `.sticky-navigation`은 상단 상태 바(`.topbar`), 좁은 모바일용 메뉴 버튼(`.mobile-menu-toggle`), 메인 메뉴(`.main-tabs`)를 한 묶음으로 고정한다. 스크롤 중에도 같은 묶음이 유지되어야 하므로 이 요소들을 다시 개별 `sticky`로 분리하지 않는다. 820px 이하에서는 현재 공간만 표시하는 버튼으로 메뉴를 접고, 버튼을 누르면 기존 3×2 메뉴가 열린다. 비서 안내와 모달은 이 영역보다 높은 레이어를 사용한다.

수장고의 `renderStorage()`는 검색어·재료·복원 상태 필터를 먼저 적용한 뒤 `sortStorageArtworksByPriority()`로 `복원 가능 → 잠김 → 복원 완료` 순서로 안정 정렬하고 마지막에 24개씩 나누어 표시한다. 같은 그룹 안에서는 기존 카탈로그 순서를 유지한다. 따라서 모든 상태 보기에서는 지금 바로 복원할 수 있는 작품이 먼저 보이고, `복원 완료` 필터를 고르면 완료 작품만 기존 카탈로그 순서로 확인할 수 있다. 이 정렬은 화면 표시만 바꾸며 작품 데이터와 세이브 순서는 수정하지 않는다.

첫 운영 안내는 데스크톱과 넓은 화면에서 기존 안내 카드로 표시한다. 820px 이하에서는 `#tutorialMobileToggle`의 원형 선택 비서 프로필로 접고, 사용자가 누를 때만 `#tutorialGuideCard`를 펼친다. 접힌 동안에는 강조 테두리와 어두운 배경도 숨기며, `강조 위치 보기`를 직접 누른 뒤에만 잠시 목표를 강조한다.

전시관은 조작 UI와 장면의 반응형 전략을 분리한다. `#galleryDioramaViewport` 안의 `#galleryDiorama`만 680px 이하에서 760×670 기준 장면 전체를 폭에 맞춰 축소한다. 따라서 작품 수를 줄이거나 페이지 가로 스크롤을 만들지 않는다. 편의동(`.gallery-annex`)과 운영 패널은 축소하지 않고 정상 글자·터치 크기로 배치한다. 같은 680px 이하에서 `.management-panel`을 `display: contents`로 풀어 `.upgrade-panel-card`를 장면보다 먼저 배치하고, `#mobileUpgradeToggle`로 시설 목록을 접고 편다. 펼친 목록은 제한된 높이 안에서 독립적으로 스크롤하며, 화면을 벗어나거나 넓은 화면으로 전환하면 `setMobileUpgradeOpen()`이 접힌 상태로 정리한다. 장면 배율은 `updateGalleryDioramaScale()`이 `ResizeObserver`와 화면 전환 뒤에 다시 계산한다.

복원실은 900px 이하에서 `.tool-panel`을 `display: contents`로 풀고 `#toolSelectionCard`만 작업 화면보다 먼저 배치한다. 빠른 도구함의 `.mobile-tool-brief`에는 현재 단계명과 행동 지시를 함께 보여 주되 정답 도구명은 노출하지 않아, 아래 설명까지 스크롤하지 않고도 도구를 판단할 수 있게 한다. 820px 이하에서는 작업 영역 전체도 플레이 우선 순서로 바꿔 빠른 도구함 → 실제 미니게임 → 작품 안내·상태 기록·작업 방법 → 작품 제목·전체 작업 순서가 되도록 한다. 새 단계에서는 `revealMobileToolSelection()`이 도구함을 고정 메뉴 아래에 맞추고, 올바른 도구를 고르면 `revealMobileMechanicStage()`가 실제 게임 카드로 자동 이동한다. 680px 이하의 단계 상태창은 단계·시간과 스트릭·위험도를 두 줄에 배치하며, 공간이 많이 필요한 게임은 기존 높이를 유지하고 조사·조절형 게임만 화면 높이에 맞춰 줄인다. 데스크톱 2열 구조와 실제 도구 선택·판정 경로는 바꾸지 않는다.

## 선택 가능한 비서

`js/game.js`의 `ASSISTANTS`는 여자 비서 `yoonseul`과 남자 비서 `hangyeol`의 이름·초상화·첫 인사를 정의한다. `state.assistantId`는 선택적 세이브 필드이며 기본값은 `yoonseul`이다. `normalizeState()`는 이 필드가 없는 구형 세이브와 알 수 없는 값을 모두 윤슬로 보완한다.

- 첫 관장 취임 화면과 비서실의 `[data-assistant-choice]` 버튼이 같은 선택값을 사용한다. 첫 취임 중에는 미리보기만 바꾸고, 취임을 끝낸 뒤 비서실에서 바꾸면 즉시 저장한다.
- 새 게임의 첫 취임은 `#directorSetupStep`에서 비서·관장명·미술관명을 정한 뒤 `#directorTutorialStep`으로 넘어간다. 선택한 비서가 첫 인사를 하고 운영 안내 여부를 묻는다. 안내를 선택하면 기존 첫 로테이션 튜토리얼을 `story` 단계부터 시작하고, 건너뛰면 `tutorialComplete=true`, `tutorialStep="complete"`로 저장한 뒤 같은 프롤로그를 연다. 별도의 새 세이브 필드는 만들지 않는다.
- `updateAssistantIdentity()`가 `[data-assistant-image]`, `[data-assistant-template]`, 선택 버튼의 `aria-pressed`를 한 번에 갱신한다. 새 비서 노출 지점을 만들 때 이미지나 이름을 직접 고정하지 말고 이 속성을 사용한다.
- 스토리 원고는 기존 윤슬 기준 원문을 유지한다. 화면에 표시할 때만 `assistantCopy()`가 현재 비서 이름으로 바꾸므로 저장된 이야기 진행과 원고 데이터는 달라지지 않는다.
- 비서 선택은 안내 인물·초상화·첫 인사만 바꾸며 보상, 난이도, 작품 배정과 랭킹 점수에는 영향을 주지 않는다.
- 외부 메신저와 SNS의 링크 미리보기는 저장 선택과 무관한 고정 홍보 이미지다. `index.html`의 Open Graph·Twitter·`image_src` 메타 태그가 캐시 버전이 붙은 한결 전용 절대 Pages URL을 가리킨다. Open Graph를 무시하고 본문의 첫 `<img>`를 고르는 서비스에 대비해 화면 밖의 `.link-preview-fallback`도 같은 한결 이미지를 먼저 제공한다.
- 스토리 모달의 `#storyIllustration`은 `storyIllustrationFor(threshold)`가 장마다 다른 WebP 삽화와 대체 문구로 바꾼다. 삽화는 비서 성별과 무관한 사건·장소 중심이며, `.story-assistant-badge` 안의 `[data-assistant-image]`가 현재 비서 얼굴을 모든 장에서 함께 보여 준다.
- `scripts/test-assistant-choice.mjs`가 두 선택 UI, 첫 튜토리얼 선택, 구형 세이브 기본값, 동적 스토리 치환, 16장 삽화의 WebP 형식·모바일 용량, 반응형 비서 배지, 한결 초상화 규격과 공유 메타·본문 대체 이미지의 일치를 검사한다.

## 시설 업그레이드 1·2단계

`js/game.js`의 `UPGRADES`에는 기본 시설 12개와 후기 2단계 개선 12개가 함께 들어 있다. 기본 시설은 `tier`가 없고, 2단계 개선은 `tier: 2`, `unlockDay: 15`, `requires: <기본 시설 ID>`를 가진다.

- `BASE_UPGRADES`와 `ADVANCED_UPGRADES`가 화면 렌더링용 목록을 나눈다.
- 15일차 전에는 `renderUpgrades()`가 2단계 예고 카드만 보여 주며, 15일차부터 구매 목록 12개를 연다.
- `buyUpgrade()`는 날짜와 선행 기본 시설을 UI와 별개로 다시 검사한다. 잠긴 버튼을 우회해도 구매할 수 없어야 한다.
- 2단계 시설은 기존 `state.upgrades` 불리언 맵에 새 ID로 저장된다. 저장 구조 자체는 바뀌지 않으며 구형 세이브는 새 ID가 없는 상태로 그대로 호환된다.
- 전시관은 `gallery-scene-card.has-<2단계 ID>` CSS로 조명·해설·환경 설비·기록실·복원실·외관을 강화한다. 편의동은 `advancedUpgradeForBase()`와 `.annex-room.is-advanced`가 상점·쉼터·정원·카페·큰 전시실의 장면을 바꾼다.
- 2단계 개선은 전시 슬롯을 더 늘리지 않는다. 전시 슬롯 상한은 기존 6칸을 유지하고, 후기 투자는 매력·관람객·수입·평판·복원 지원 효과를 강화한다.
- `scripts/test-upgrade-progression.mjs`가 기본/2단계 각 12개, 15일차 개방, 선행 시설, 42,200코인 규모, 구매 방어 로직과 시각 클래스 존재 여부를 검사한다.

## 미니게임 14종의 정의 위치

기존 10종과 `cleaning`, `uv`, `budget`, `balance`를 합친 14종 모두 별도 파일이 아니라 `js/game.js` 안에 정의되어 있다.

| ID | 화면 이름 | 주요 렌더링·처리 위치 |
| --- | --- | --- |
| `spot` | 사광 손상 조사 | `renderMechanicMarkup`, `startInspectionChallenge`, `moveInspectionLight`, `hitTest` |
| `choice` | 시험구 안전 판정 | `renderMechanicMarkup`, `startTestChoiceChallenge`, `handleTestChoice` |
| `trace` | 결 따라 표면 정리 | `renderMechanicMarkup`, `startCleaningChallenge`, 포인터 드로잉 처리 |
| `drag` | 파편 가접합 | `dragPresentationForTool`, `renderMechanicMarkup`, `startDragPreview`, 드래그·드롭 처리 |
| `stability` | 환경 안정화 조절 | `stabilityPresentationForTool`, `startStabilityChallenge`, `updateStabilityChallenge` |
| `precision` | 정밀 처리량 조절 | `precisionPresentationForTool`, `startPrecisionChallenge`, `judgePrecisionDose` |
| `sequence` | 처리 절차 판단 | `procedureScenariosFor`, `startProcedureChallenge`, `handleProcedureChoice` |
| `rhythm` | 접착제 점적 타이밍 | `rhythmPresentationForTool`, `startAdhesiveChallenge`, `judgeAdhesiveTiming` |
| `tone` | 식별 가능한 보색 | `renderMechanicMarkup`, `handleToneChoice` |
| `align` | 접합면 방향 정렬 | `renderMechanicMarkup`, `handleAlignPiece` |
| `cleaning` | 세척 강도 판단 | `cleaningPresentation`, `renderMechanicMarkup`, `startLayerCleaningMechanic`, `stopLayerCleaning` |
| `uv` | 자외선 형광 조사 | `uvPresentation`, `renderMechanicMarkup`, `startUvMechanic`, `moveInspectionLight`, `hitUvTest` |
| `budget` | 처리량 나누기 | `budgetPresentation`, `budgetDifficultyParameters`, `renderMechanicMarkup`, `startBudgetMechanic`, `confirmBudgetAllocation` |
| `balance` | 받침 무게 잡기 | `balancePresentation`, `balanceDifficultyParameters`, `balancePhysicsForPositions`, `startBalanceMechanic`, `confirmBalancePlacement` |

공용 메타데이터는 `js/game.js`의 다음 상수에 모여 있다.

- `MECHANIC_IDS`: 사용 가능한 미니게임 ID 목록
- `MECHANIC_NAMES`: ID와 화면 표시 이름의 대응
- `MECHANIC_GUIDES`: 정식 용어, 쉬운 설명, 작품에 미치는 영향
- `TOOL_MECHANIC_GUIDES`: 도구별 권장 게임과 설명
- `MATERIAL_GUIDES`: 재질별 안내 문구
- `PRACTICE_CHALLENGES`: 기록실의 보존 연습 목록

## 쉬운말 표시 계층

초등학생 이상 플레이어가 정식 보존 용어를 배우면서도 바로 조작할 수 있도록 `js/game.js`는 문구를 두 층으로 나눈다.

- `MECHANIC_NAMES`: 기록과 `배우는 복원 용어`에 남기는 정식 명칭
- `MECHANIC_EASY_NAMES`: 연습 카드·연습 화면·비서 안내에서 먼저 보여 주는 행동 중심 제목
- `easyCopy()`: 작품 상태, 단계 안내, 미니게임 내부 문구, 결과와 기록을 화면에 표시할 때 어려운 낱말만 쉬운 표현으로 바꾸는 공용 함수. 치환된 표현 바로 뒤의 `을/를`, `이/가`, `은/는`, `과/와`, `으로/로`는 새 표현의 마지막 한글 음절 받침에 맞춰 고치며, `ㄹ` 받침 뒤의 `로` 예외도 지킨다. 같은 치환 표현이나 같은 어절이 연속되면 하나로 합친다.
- `docs/EASY_LANGUAGE_GUIDE.md`: 버튼, 실패 문구, 작품 설명을 새로 쓸 때 따르는 문장 기준과 용어표
- `scripts/export-review-text.mjs`: 현재 고정 UI, 동적 피드백, 미니게임·도구·시설·스토리와 작품 500점의 화면 표시용 문구를 `TEXT_REVIEW_EXPORT.md` 및 `docs/text-review/` 분할본으로 다시 생성하는 검수 도구

`easyCopy()`는 원본 작품 데이터와 저장 기록을 수정하지 않는다. 조사 교정도 문장 전체를 다시 분석하지 않고 `replaceEasyCopyTerm()`이 실제로 바꾼 표현 바로 뒤에서만 수행하므로, 치환과 무관한 원문의 조사는 건드리지 않는다. `mechanicDifficulty()`가 손상 문구에서 신호를 읽는 경로와 `localStorage` 세이브 호환성을 유지하기 위해 반드시 렌더링 시점에만 적용한다. 정식 용어는 삭제하지 말고 쉬운 제목 아래 학습 정보로 남긴다. 문구를 추가하거나 바꾼 뒤에는 `scripts/test-easy-language.mjs`를 실행한다. `scripts/export-review-text.mjs`의 쉬운말 변환도 같은 조사·중복 규칙을 사용해야 화면과 검수본이 달라지지 않는다.

전체 문구를 외부에서 다시 검수할 때는 `node scripts/export-review-text.mjs`를 실행한다. 루트의 전체본은 보관·검색용이고, `docs/text-review/README.md`가 안내하는 7개 분할본은 긴 문맥을 나누어 AI나 사람에게 순서대로 검수받을 때 사용한다. 욕설 차단용 내부 목록과 코드 식별자는 검수본에서 제외한다.

## 공통 인터페이스와 실행 수명주기

현재 미니게임은 클래스나 모듈 등록 객체를 반환하지 않는다. `js/game.js`의 전역 복원 세션을 여러 함수가 함께 변경하는 **암묵적 인터페이스**다.

### 입력 데이터

작품의 각 복원 단계는 대체로 다음 형태다.

```js
{
  name,
  instruction,
  tool,
  diagnosis,
  targets
}
```

공용 복원 세션은 `createRestorationSession()`에서 만들며 핵심 필드는 다음과 같다.

```js
{
  artId,
  stepIndex,
  risk,
  mistakes,
  hitTargets,
  targetIds,
  streak,
  maxStreak,
  streakStepIndex,
  streakRecordedStepIndex,
  stepHadMistake,
  practiceDifficulty,
  uvHistoryConfirmed,
  uvFindingLabel,
  budgetResults,
  balanceRerolls,
  balanceSupportPositions,
  timed,
  activeElapsedMs,
  timerRunningSince
}
```

`streak`과 `maxStreak`은 현재 복원 세션에만 존재하며 `localStorage`에 저장하지 않는다. `uvHistoryConfirmed`와 `uvFindingLabel`은 한 복원 세션 안에서 UV 조사 결과를 완료 단계까지 전달한다. `budgetResults`는 부위별 배분 자체가 아니라 해당 단계에서 계산된 위험도와 전시 매력 감점을 완료 단계까지 전달한다. `balanceRerolls`와 `balanceSupportPositions`는 받침 배치와 다시하기용 세션 값이며 저장하지 않는다. 완료 기록에 저장되는 값은 선택적 불리언 `uvHistoryConfirmed`와 정수 `appealPenalty`다. 일반 단계 전환에서는 `stepHadMistake`만 새 단계용으로 초기화하고 스트릭은 이어 간다. 사용자가 `다시하기`를 선택하면 위험도와 실수는 유지하되 `streak`, `maxStreak`, 스트릭 단계 인덱스와 현재 단계의 임시 `cleaning`/`uv`/`budget`/`balance` 결과를 초기화한다. `streakRecordedStepIndex`는 중복 완료 호출로 같은 단계가 두 번 집계되는 것을 막는다. 보존 연습은 `createRestorationSession(art.id, false)`로 별도 세션을 만들고, 종료할 때 기존 캠페인 세션을 복원한다.

미니게임별 진행값도 이 세션에 추가된다. 따라서 새 필드를 추가할 때는 단계 전환, 다시하기, 연습 모드, 화면 이탈, 일시정지에서 초기화되는지 확인해야 한다.

### 공용 함수 계약

| 함수 | 역할 |
| --- | --- |
| `renderMechanicMarkup(art, current, targets)` | 현재 미니게임의 HTML 문자열 생성 |
| `bindMechanicControls()` | 렌더링된 DOM에 포인터·클릭 입력 연결 |
| `selectTool(toolId, correctToolId, button)` | 도구 선택 판정과 올바른 게임 활성화 |
| `activateCurrentMechanic()` | 배정된 미니게임의 시작 함수 호출 |
| `addMechanicMistake(riskAmount, message, numericFeedback = null)` | 실수·위험도 누적, 스트릭 초기화, 선택적 수치 비교 피드백 표시 |
| `finishMechanicSoon(message, delay)` | 성공 단계를 한 번만 스트릭에 기록한 뒤 현재 단계를 완료하도록 예약 |
| `completeStep()` | 단계 이동 또는 전체 복원 완료로 연결 |
| `completeRestoration()` | 정확도·시간·보상·기록·전시 가능 상태 반영 |

### 시작부터 종료까지

1. `renderCurrentStep()`이 작품, 단계, 배정된 미니게임과 난이도를 읽는다.
2. `renderMechanicMarkup()`이 해당 ID의 미니게임 UI를 만든다.
3. `bindMechanicControls()`가 입력 이벤트를 연결한다.
4. 플레이어가 도구를 선택하면 `selectTool()`이 정답 도구인지 판정한다.
5. 올바른 도구일 때 `activateCurrentMechanic()`이 개별 시작 함수를 호출한다.
6. 실패는 `addMechanicMistake()`로 위험도와 실수를 누적하고 현재 스트릭을 0으로 만든다.
7. 성공은 `finishMechanicSoon()`에서 실수 없는 단계의 스트릭을 올린 뒤 `completeStep()`으로 이동한다.
8. 마지막 단계가 끝나면 `completeRestoration()`이 최종 결과를 저장한다.

미니게임별 결과 객체는 따로 반환되지 않는다. 결과는 공용 세션의 `risk`, `mistakes`, 시간 필드 등을 변경하는 방식으로 전달된다.

### 공통 스트릭과 근접 실패 피드백

- `updateStreakHud()`가 현재 `streak`과 `maxStreak`을 HUD에 표시한다. `prefers-reduced-motion: reduce`에서는 강조 애니메이션을 실행하지 않는다.
- `registerStepSuccess()`는 `finishMechanicSoon()`에서만 호출한다. 한 단계 안에서 `addMechanicMistake()`가 한 번이라도 호출되면 그 단계 성공으로 스트릭이 오르지 않는다.
- `streakRewardFor(maxStreak)`는 3/4/5단계 연속 성공에 각각 기본 작품 보상의 10%/15%/20% 코인 보너스를 연결한다. 최대치는 기존 황금 시간 보너스 30%보다 작다.
- `addMechanicMistake()`의 세 번째 인자는 선택적이다. 기존 2인자 호출은 그대로 동작한다.
- 수치 비교 객체는 `actual`, `targetStart`, `targetEnd`와 선택적 `scaleMin`, `scaleMax`, `label`, `unit`을 받는다. `normalizeNumericFailure()`가 목표 구간까지의 거리를 공통 0~1 근접도로 바꾼다.
- 현재 수치 비교를 전달하는 게임은 `stability`, `precision`, `rhythm`뿐이다. 90% 이상이면 “아깝습니다” 연출과 목표 구간·실제 값 겹침 표시가 나온다.
- `pauseRestoration()`과 `resumeRestoration()`은 스트릭 값을 바꾸지 않는다. 일시정지 시 진행 중 애니메이션과 근접 실패 표시만 정리하고, 복귀 시 현재 미니게임 루프를 이어 간다.
- `restartCurrentStep()`은 다시하기를 새 연속 도전으로 취급해 `streak`과 `maxStreak`을 0으로 되돌린다. 이미 누적된 위험도와 실수는 되돌리지 않는다.

## 재질별 변주 경로

재질별 분기는 두 층으로 나뉜다.

1. `js/artworks-data.js`의 작품 프로필이 도자, 금속, 책, 벽화 등 재질에 맞는 복원 단계와 도구를 정한다.
2. `js/game.js`의 `mechanicCandidatesForTool()`이 단계의 도구를 가능한 미니게임 ID로 변환한다.

`dragPresentationForTool`, `stabilityPresentationForTool`, `precisionPresentationForTool`, `rhythmPresentationForTool`, `cleaningPresentation`, `uvPresentation`, `budgetPresentation`, `balancePresentation` 같은 함수는 같은 게임 로직을 단계·도구에 맞는 문구와 모양으로 변주한다. `cleaningPresentation`은 회화·도자·책/종이·벽화·금속의 층 색상, 임계점 평균, 안내와 결과 문구를 선택한다. `uvPresentation`은 같은 다섯 재질에서 원본 형광, 후대 보수, 접착·보강 흔적의 이름과 질감 단서, 기록 문구를 선택한다. `budgetPresentation`은 회화·도자·책/종이·벽화·금속의 실제 손상 부위 이름, 안전 중요도, 눈에 띄는 정도를 선택한다. `balancePresentation`은 도자·유리·책·사진/종이·조각/석재의 작품 형태, 받침 이름, 약한 부위 표현과 무게중심 보정을 선택한다. `MATERIAL_GUIDES`는 설명용이며 게임 배정 자체를 결정하지 않는다.

재질별 차이를 추가할 때는 다음 우선순위를 따른다.

1. 작품 데이터의 실제 복원 단계와 도구를 올바르게 구성한다.
2. 도구와 미니게임 후보의 의미가 일치하는지 확인한다.
3. 같은 로직을 재사용할 수 있으면 presentation 함수에서 외형·목표·설명을 변주한다.
4. 상호작용 자체가 달라야 할 때만 새 미니게임 ID를 추가한다.

## 난이도 2~5단계

난이도는 `js/game.js`의 `mechanicDifficulty()`에서 2~5로 계산한다.

- 기본값은 작품의 복원 단계 수와 손상 신호 수를 바탕으로 계산한다.
- 복원 작품 수가 일정 기준을 넘으면 캠페인 진행 보정이 붙는다.
- 카탈로그 후반 작품에는 추가 보정이 붙는다.
- 최종 값은 2~5 범위로 제한한다.

현재 난이도가 실제 파라미터에 반영되는 주요 항목은 다음과 같다.

- `spot`: 방해 표식 수
- `trace`: 허용 거리와 판정 오차
- `drag`: 조각 맞춤 허용 반경과 완성 배치 기억 노출 시간
- `stability`: 안전 구간 폭과 유지 시간
- `precision`: 목표 구간 폭과 이동 속도
- `rhythm`: 원의 수축 속도와 판정 허용치, 난이도 5의 방울 사이 연결 제한시간
- `choice`: 시험구 수, 기준선과 오답 수치의 거리, 처리 중단 출현 빈도, 오답 위험도
- `sequence`: 상황 수와 절차상 그럴듯한 오답의 비율
- `tone`: 정답·오답의 색상·명도·채도 차이, 결손 윤곽과 세필 줄무늬 간격
- `align`: 회전 단위, 허용 오차, 근접 안내 범위, 정렬 조각 수, 무늬 대비
- `cleaning`: 한 번에 제거되는 양, 적정 판정 폭, 붓 반경, 층 변화의 시각 강도
- `uv`: 원본 형광 방해 영역 수, 보수 흔적 대비, 조사 범위
- `budget`: 손상 부위 수, 부위별 충분한 작업량의 합, 필요량 공개 여부
- `balance`: 받침 수, 무게중심 치우침, 약한 부위 수, 허용 기울기와 받침 간격

`choiceDifficultyParameters()`, `sequenceDifficultyParameters()`, `toneDifficultyParameters()`, `alignDifficultyParameters()`가 네 판단형 게임의 2~5단계 파라미터를 한곳에서 계산한다. UI 구조와 기본 조작은 같고 다음 값만 달라진다.

- `choice`: 난이도 2~4는 시험구 3개, 난이도 5는 4개다. 위험한 수치는 17%처럼 명확한 값에서 5% 기준을 1%만 벗어난 값으로 좁혀진다. 난이도 5의 전부 위험 판정은 결정적 해시의 1/2, 나머지는 1/4 빈도이며 오답 위험도는 8/9/10/12다.
- `sequence`: 난이도 2는 기존의 명백한 오답으로 된 3상황을 유지한다. 난이도 3은 상황마다 오답 1개, 난이도 4~5는 2개를 절차상 그럴듯하지만 이른 행동으로 바꾼다. 난이도 5는 작품 내부 시험 결과가 서로 다를 때 일반화하지 않고 기록·재평가하는 네 번째 상황을 추가한다.
- `tone`: 난이도가 오를수록 오답의 HSL 차이를 줄인다. 난이도 4~5는 모든 시편에 세필 질감을 표시하고, 정답과 오답의 줄무늬 간격 및 윤곽 비율을 미세하게 다르게 한다. 색 외 단서는 모든 난이도에 남는다.
- `align`: 회전 단위는 5/3/2/1도, 허용 오차는 2.5/2/1.25/0.75도다. 난이도 2의 기존 시작 각도는 유지하고, 높은 난이도에서는 미세 조정의 반복이 과도해지지 않도록 시작 오차를 줄인다. 모든 시작 각도는 해당 회전 단위의 배수라 정확히 0도에 도달할 수 있다. 난이도 5는 조각이 4개이며 무늬 대비를 낮춘다.

위 파라미터는 현재 복원 화면에서 매번 계산하는 세션 한정 값이다. `state`, `state.restored`, `normalizeState()`에는 추가하지 않으므로 세이브 형식은 변하지 않는다.

`PRACTICE_CHALLENGES`의 `difficulty` 문자열은 연습 목록의 조작 분류 표시이며, 위의 2~5 계산과는 별개다. 각 연습 카드에서 난이도 2(입문)·3(보통)·4(어려움)·5(숙련)를 선택할 수 있으며 `startPracticeChallenge()`가 선택값을 새 연습 세션의 `practiceDifficulty`에 넣는다. `mechanicDifficulty()`는 연습 중에만 이 값을 우선 사용하므로 같은 미니게임의 실제 파라미터 차이를 단계별로 확인할 수 있다. 이 값은 세션 한정이며 `localStorage`, 캠페인 난이도, 실제 작품 기록에는 저장되지 않는다. 선택적 `difficultyLevel`은 카드가 처음 렌더링될 때의 기본값으로만 사용한다.

난이도 5 `choice`는 시험구가 네 개로 늘어나므로 `renderCurrentStep()`이 `artStage`에 `has-four-choice`를 붙여 작업 영역을 확장한다. 모바일에서는 글씨 크기 2·3 설정까지 반영해 작업 영역 높이를 단계적으로 더 확보한다. 680px 이하에서는 전체 미니게임 중 화면 전체를 직접 비추는 `spot`·`uv`만 기존 고정 작업층을 유지하고, 나머지 `.mechanic-layer`는 내용이 작업 영역보다 길어질 때 독립된 세로 스크롤 영역이 된다. 파편·붓·세척 Canvas·받침처럼 직접 끌거나 그리는 조작면은 자체 `touch-action: none`을 유지하므로 작업 입력과 세로 스크롤이 섞이지 않는다. 선택지, 절차 카드, 색 보기 카드, 접합 카드, 세척·처리량 결과와 하단 확정 버튼은 모두 작업층 안에서 끝까지 접근할 수 있어야 한다.

### `drag` 기억 미리보기와 `rhythm` 연결시간

`drag`와 `rhythm`은 기존 ID와 기존 성공 판정을 유지한 채 인지 요소만 덧붙인다.

- `dragPreviewDurationMs()`는 난이도 2에서 3초, 3~4에서 2.5초, 5에서 1.5초를 반환한다. `state.extendedPuzzlePreview`가 참이면 난이도와 관계없이 5초다.
- 도구 선택 전에는 `.drag-workbench.is-awaiting-tool`이 완성 배치를 가린다. 올바른 도구를 고르면 `startDragPreview()`가 완성 배치와 남은 시간을 보여 주며, 이때 실제 조각은 `tabindex=-1`, `aria-disabled=true`이고 포인터·키보드 배치 함수도 `dragPreviewState.complete`를 확인한다.
- 노출 종료 후 `completeDragPreview()`가 미리보기를 가리고 기존에 생성한 무작위 조각 순서·기울기를 공개한다. 조각 맞춤 허용 반경과 성공 조건은 바꾸지 않는다.
- `rhythm`은 `difficulty === 5`일 때만 `deadlineEnabled`가 참이다. 첫 방울 전에는 제한시간이 없고, 첫 성공 뒤 다음 방울부터 별도 4.2초 게이지를 사용한다. 이 게이지는 난이도 5에서 숨긴 목표 원과 별개이므로 재료 상태 판정 원칙을 깨지 않는다.
- 연결시간이 끝나면 `handleAdhesiveDeadlineExpired()`가 `addMechanicMistake()`를 호출하고 해당 방울을 `×`로 기록한 뒤 다음 방울로 이동한다. 마지막 방울이 시간 초과여도 `finishMechanicSoon()`으로 단계를 끝낸다. 기존 목표 반지름, 수축 속도, 허용 오차와 근접 실패 피드백은 그대로다.
- `dragPreviewState`와 `rhythmState`의 제한시간 필드는 복원 세션의 임시 상태로만 존재하며 세이브에 넣지 않는다. 저장되는 새 값은 접근성 설정 `extendedPuzzlePreview` 하나뿐이고 `normalizeState()`에서 누락 값을 `false`로 보완한다.

### `cleaning` 임계점과 다시하기

`cleaning`은 `hashText()`에 작품 ID, 단계 인덱스, `cleaning` ID와 세션의 다시하기 횟수를 넣어 임계점을 결정한다. 평균 임계점에서 ±15% 범위로만 변하며, 같은 작품·같은 단계에 재진입하면 같은 값을 유지한다. 현재 `cleaning` 단계에서 다시하기를 눌렀을 때만 `session.cleaningRerolls[stepIndex]`를 올려 새 임계점을 고른다. 이때 현재 단계의 제거량·Canvas와 이미 기록된 임시 세척 결과를 함께 지운다. 이 값들은 복원 세션 한정이며 세이브에는 저장하지 않는다.

플레이 중에는 Canvas의 오염층을 `destination-out`으로 지워 원본층을 드러낸다. 임계점 이후 계속 세척하면 원본층도 같은 합성 방식으로 지워져 손상층이 보인다. 판정은 다음 세 결과로 나뉘며 모두 `finishMechanicSoon()`으로 단계를 완료한다.

- 부족: 안전하지만 표면층이 남는다. 실수는 추가하지 않고 정확도에 소폭 감점한다.
- 적정: 임계점 주변에서 멈춘 최선의 결과다.
- 과세척: `addMechanicMistake()`를 호출해 위험도를 누적하고 원본층 손상 결과를 남긴다.

### `uv` 조사와 `spot` 공유 경로

`uv`는 `spot`의 포인터 좌표, 조사등 이동, 조사 범위 안의 표식 공개 수명주기를 재사용한다. 두 게임의 판정 의미와 표식 DOM은 분리되어 있다.

- `spot`: `.damage-target`인 실제 손상을 찾고 `.damage-decoy`인 제작 흔적을 누르면 실수다.
- `uv`: `.uv-finding`인 후대 덧칠·접착·보강 흔적을 찾고 `.uv-original-fluorescence`인 원본 재료 반응을 누르면 실수다.
- `uvDifficultyParameters()`는 난이도 2~5의 원본 방해 영역을 2/3/4/5개로 늘리고, 형광 대비와 조사 범위를 줄인다. 타깃은 난이도 5에서도 세 곳이며 모두 클리어 가능하다.
- 색 외 단서는 불규칙 점선 경계와 방사형 질감(덧칠), 각진 이중선과 빗금 질감(접착 보수), 둥근 실선과 잔점 질감(원본 반응)으로 구분한다.
- `prefers-reduced-motion`에서는 형광 깜빡임을 없애고 부드러운 공개 전환만 유지한다. 일시정지 중에는 형광 애니메이션도 정지한다.
- 조사 성공 시 세션의 `uvHistoryConfirmed`가 참이 되고 `finishMechanicSoon()`으로 끝난다. 원본 반응을 눌러도 `addMechanicMistake()`만 호출하며 나머지 보수 흔적을 계속 찾을 수 있다.
- 현재 UV 단계에서 다시하기를 누르면 찾은 표식 수와 `uvHistoryConfirmed`·`uvFindingLabel`을 함께 지워 이전 시도의 조사 결과가 새 시도에 섞이지 않게 한다.

### `budget` 처리량 배분과 두 결과 경로

`budget`은 `varnishGel`, `sootSponge`, `microPick`, `surfaceVacuum` 단계에만 배정된다. `budgetPresentation()`이 회화·도자·책/종이·금속·벽화에 맞는 손상 부위 네 곳과 안전 중요도·눈에 띄는 정도를 정하고, `budgetDifficultyParameters()`가 난이도별 부위 수와 충분한 작업량을 정한다.

- 난이도 2는 부위 세 곳의 충분한 양 합계가 100보다 작고 각 필요량을 공개한다. 난이도 3~4는 네 곳의 안전과 겉모습 단서가 어긋나며, 난이도 5는 충분한 양의 합이 134라 모두 채울 수 없고 플레이 중 필요량을 숨긴다.
- 네 슬라이더는 각자 0~100이지만 `updateBudgetAllocation()`이 다른 슬라이더 합계를 먼저 빼서 전체가 100을 넘지 못하게 한다. 기본 `<input type="range">`를 사용해 마우스·키보드·터치의 공통 `input`/`change` 경로를 쓴다.
- `confirmBudgetAllocation()`은 안전 중요도가 큰 곳을 많이 미뤘을 때만 `addMechanicMistake()`로 위험도를 올린다. 눈에 잘 띄는 곳을 미룬 결과는 위험도를 올리지 않고 `appealPenalty`로 따로 합산한다.
- 어느 배분이든 부위별 `충분히 돌봄`·`일부만 돌봄`·`이번에는 미룸`과 충분한 양을 결과 화면에서 공개한 뒤 `finishMechanicSoon()`으로 끝난다.
- 부위별 배분은 `session.budgetResults`에만 있고 저장하지 않는다. 완료 시 합산한 `appealPenalty`만 `state.restored`와 `records`의 선택 필드로 남긴다. `normalizeState()`는 구형 세이브에서 이 값을 0으로 보완한다.

### `balance` 받침 배치와 감쇠 물리

`balance`는 `supportMount`, `glassSupport`, `bindingCradle`, `photoSleeve` 단계에만 후보로 배정된다. `balancePresentation()`이 작품의 재질과 도구에 따라 항아리·유리병·펼친 책·평면 종이·치우친 조각 형태와 받침 이름, 약한 부위 문구를 고른다.

- `balanceDifficultyParameters()`는 작품 ID·단계·다시하기 횟수의 결정적 해시로 받침 수, 무게중심, 약한 부위 위치와 허용 기울기를 정한다. 난이도 2는 받침 3개와 약한 곳 1개, 난이도 3~4는 받침 4개와 약한 곳 2개, 난이도 5는 받침 4개와 약한 곳 3개를 쓴다.
- `balancePhysicsForPositions()`는 각 받침과 무게중심의 거리에 따라 하중을 나누고, 하중을 반영한 받침 중심과 작품 무게중심의 차이를 토크로 바꿔 목표 기울기를 구한다. 정렬된 받침 사이의 최대 간격과 전체 폭으로 가운데 처짐도 따로 계산한다.
- 기울기와 간격이 모두 허용 범위에 들어와야 `이대로 고정` 버튼이 켜진다. 안정된 배치라도 하중이 큰 받침이 약한 곳 바로 아래에 있으면 고정 시 `addMechanicMistake()`가 위험도를 올린 뒤 단계를 끝낸다. 약한 곳을 피한 안정 배치는 `finishMechanicSoon()`으로 끝난다.
- 포인터 드래그와 키보드 좌우 화살표가 같은 `balanceState.positions`를 변경한다. 모바일 받침은 최소 58×94px 영역을 사용하고, 보드는 `touch-action: none`으로 브라우저 스크롤과 드래그 입력이 섞이지 않게 한다.
- 기울기 표현은 목표 각도에 바로 순간 이동하지 않고 스프링과 감쇠를 적용한 RAF로 수렴한다. 목표에 충분히 가까워지면 RAF를 예약하지 않아 정지 화면에서 프레임 루프가 남지 않는다. `prefers-reduced-motion`에서는 감쇠 애니메이션 없이 즉시 목표 각도를 표시한다.
- 배치와 다시하기 횟수는 세션 한정이다. 별도의 완료 필드를 저장하지 않으며, 위험 결과는 기존 `risk`·`mistakes` 경로만 사용하므로 세이브 형식은 변하지 않는다.

## 공용 수명주기 정리 규칙

- 미니게임의 모든 `requestAnimationFrame`은 `mechanicAnimationFrame`, 지연 작업은 `scheduleMechanicTimeout()`의 `mechanicTimers` 집합으로만 관리한다. 단계 전환·다시하기·화면 이탈·탭 비활성화에서 `cancelMechanicSchedules()`가 둘을 모두 비운다.
- `spot`과 `uv`의 표식 제거 및 공용 스파크 제거도 공용 타이머에 등록한다. 일시정지로 제거 예약이 취소될 때는 이미 맞힌 표식과 스파크 DOM을 즉시 정리한다.
- 미니게임별 버튼 리스너는 `artStage.innerHTML`로 교체되는 현재 단계 DOM에만 붙는다. 전역 포인터 리스너는 `bindEvents()`에서 `artStage`에 한 번만 붙이며 단계마다 추가하지 않는다.
- `choice`가 시험구 반응 대기 중 멈췄다면 복귀 시 해당 반응을 한 번만 완료한다. `sequence`가 다음 상황 전환 대기 중 멈췄다면 현재 `scenarioIndex`를 기준으로 화면을 다시 렌더링한다.
- `stability`는 복귀 시 과습 경고 잠금을 정상 상태로 되돌리고 RAF를 하나만 다시 시작한다. `precision`과 `rhythm`도 기존 상태 객체를 확인한 뒤 필요한 현재 라운드만 다시 시작한다.
- `drag` 미리보기는 `remainingMs`를 유지하고 RAF만 멈춘다. 복귀하면 `lastTime`을 현재 시각으로 다시 잡아 숨겨진 동안의 시간을 차감하지 않는다. 미리보기 종료 뒤의 퍼즐 배치는 타이머가 없다.
- `rhythm`의 난이도 5 연결시간도 `deadlineRemainingMs`를 유지한 채 공용 RAF를 멈추고, 복귀할 때 현재 라운드만 이어 간다. 단계 전환·다시하기에서는 `clearMechanicTimers()`가 `dragPreviewState`와 `rhythmState`를 모두 지운다.
- `cleaning`은 일시정지 때 포인터 캡처와 드래그만 해제하고 제거량·Canvas는 유지한다. `uv`는 JS 루프가 없으며, `.mechanic-layer.is-paused`가 CSS 형광 애니메이션을 멈춘다. `budget`은 타이머가 없고 일시정지 중 `budgetState.paused`로 입력만 막았다가 같은 배분값으로 재개한다. `balance`는 일시정지 때 포인터 캡처와 드래그를 해제하고 RAF를 취소하며, 복귀하면 같은 받침 위치에서 감쇠 계산을 한 번만 다시 시작한다. 단계 전환·다시하기에서는 `clearMechanicTimers()`가 `budgetState`와 `balanceState`를 모두 지운다.

## 작품에 미니게임 4~5개를 배정하는 로직

작품의 미니게임 수는 별도의 무작위 추첨으로 4개 또는 5개를 정하는 방식이 아니다. 작품 데이터에 정의된 복원 단계 수가 곧 미니게임 수가 된다.

- `js/artworks-data.js`: 재질 프로필별 4~5개 복원 단계 정의
- `prepareArtworkForRestoration()`: 단계 목록을 최대 5개로 정리
- `mechanicPlanForArtwork()`: 작품 전체의 미니게임 계획 생성
- `preferredMechanicForStep()`: 각 단계의 도구와 작품 해시를 이용해 후보 중 하나 선택
- `mechanicCandidatesForTool()`: 도구별로 허용되는 미니게임 후보 제공

배정은 작품과 단계에 기반한 결정적 해시를 사용하므로 다시 열어도 같은 작품에는 같은 계획이 유지된다. 핵심 작품 일부는 별도의 고정 계획을 가진다.

확대경은 `spot`과 `uv` 후보가 겹치고 전용 `uvLamp`는 `uv`만 배정된다. `preferredMechanicForStep()`은 확대경 단계 중 결정적 해시의 일부만 `uv`로 골라 두 게임의 분포가 완전히 같아지지 않게 한다. 핵심 작품 `sunset-painting`은 고정 계획에 `spot`과 `uv`를 모두 포함해 한 작품에서도 손상 조사와 과거 보수 이력 조사가 서로 다른 목적으로 이어질 수 있다.

현재 총 500점 중 383점은 4단계, 117점은 5단계다. 새 작품 프로필을 만들 때 4~5단계를 명시하고, 모든 도구가 올바른 미니게임 후보에 연결되는지 점검한다.

통합 전수 검사 기준으로 500점의 2,117개 단계가 모두 유효한 도구 후보를 가지며, `cleaning`은 79점, `uv`는 125점, `budget`은 71점, `balance`는 76점의 계획에 포함된다. 이 수치는 신규 게임이 전혀 나오지 않거나 전체 작품에 과도하게 반복되는 상태를 막는 회귀 기준으로 사용한다.

## 결과가 작품 상태와 관람객 평가에 반영되는 경로

### 복원 결과

```text
미니게임 실수
→ addMechanicMistake()
→ session.mistakes / session.risk
→ restorationAccuracy()
→ completeRestoration()
→ 코인·평판·정확도·시간·maxStreak 보너스
→ state.restored 및 복원 기록
→ 전시 가능 작품 목록
```

`state.restored`에는 작품별 복원일, 정확도, 최종 위험도, 실수 수, 작업 시간, 기술 점수 등이 저장된다. `cleaning`을 거친 작품은 선택적 필드 `overcleaned`와 `cleaningOutcomes`도 저장한다. `uv`를 완료한 작품은 선택적 필드 `uvHistoryConfirmed`가 참이 되어 완료 요약과 기록실에 과거 보수 이력 한 줄이 붙는다. `budget`을 거친 작품은 선택적 정수 `appealPenalty`에 이번 배분에서 미룬 겉모습 손질을 남긴다. `balance`는 별도 완료 필드를 만들지 않고 약한 곳을 누른 배치만 기존 위험도·실수에 반영한다. `normalizeState()`는 선택적 완료 필드가 없는 구형 `restored` 및 `records` 항목을 `false`, 빈 배열 또는 0으로 보완하므로 기존 세이브를 그대로 불러올 수 있다. `maxStreak` 자체는 세이브나 복원 기록에 남기지 않고 완료 시 코인 보너스 계산에만 사용한다. 완성 작품의 SVG는 정확도별로 다른 결과 그림을 만들지 않으며, 완료 상태가 되면 손상 표현을 숨긴다.

### 전시와 관람객

```text
복원 완료 작품
→ 전시 대기열/전시 슬롯
→ 전시 매력도 합산
→ 일일 관람객·수입 계산
→ 관람객 배치와 작품별 코멘트
```

전시 매력도는 작품의 고정 `appeal`에서 복원 기록의 선택적 `appealPenalty`를 뺀 뒤 시설 배수를 적용한다. `budget`에서 겉모습 손질을 미룬 작품은 관람객·수입 계산에 소폭 직접 반영된다. 복원 정확도와 위험도는 평판과 보상, 랭킹에는 직접 반영되며, 정확도가 높아 평판이 오르면 관람객 계산에도 간접적으로 영향을 준다.

## 스토리 완주와 랭킹 v2

`STORY_CHAPTERS`는 매력도 100~1,000의 본편 10장과 1,100~1,500의 고정 후일담 5편으로 끝난다. `FINAL_STORY_THRESHOLD`는 배열 마지막 항목에서 계산하며, 이후 진행을 무한 생성하지 않는다.

```text
전시 매력도 변화
→ checkStoryProgress(): 100 단위, 최대 FINAL_STORY_THRESHOLD로 제한
→ storyForThreshold(): STORY_CHAPTERS의 고정 원고 반환
→ openStoryEvent(): storyMilestone 갱신
→ 1,500 후일담을 처음 열 때 storyCompletionDay = state.day
→ normalizeState(): 구형 세이브 보완
```

- `storyCompletionDay`는 선택적 세이브 필드다. 구형 세이브가 이미 매력도 1,500 이야기를 연 상태라면 불러온 현재 `day`를 최초 완주일로 보완하고, 미완주 세이브는 `0`을 유지한다.
- `storyMilestone`은 불러올 때 100 단위와 1,500 상한으로 정리한다. 기존 `endingSeen`은 본편 엔딩인 1,000 기준을 그대로 유지한다.
- 기록실의 랭킹 제출은 전체 세이브 대신 복원 기록과 `museumIncomeEarned`, `totalVisitors`, `storyMilestone`, `storyCompletionDay`만 추린다.
- 클라이언트 미리보기와 `ranking-apps-script.gs`는 `director-score-v2`를 사용한다. 서버는 제출된 `clientSummary`를 믿지 않고 작품 점수와 운영 보너스를 다시 계산한다.
- 수입 보너스는 누적 개관 수입 25코인당 1점, 관람객 보너스는 5명당 1점이며 각각 최대 5,000점이다. 이야기 보너스는 후일담 5편 완주일에 따라 20일 이내 5,000점, 25일 이내 4,500점, 35일 이내 3,500점, 50일 이내 2,500점, 이후 1,500점이고 미완주는 0점이다.
- Google Sheet의 기존 19개 열 뒤에 운영 성과와 보너스 6개 열을 추가한다. v1 행은 삭제하지 않지만 v2 최고 기록 비교와 공개 목록에서 제외한다.
- `전체 랭킹 확인`은 모바일 팝업 차단을 피하기 위해 `window.open()`을 쓰지 않는다. `renderRankingPanel()`이 Apps Script 조회 주소를 `#viewRankingButton`의 실제 `href`에 넣고, 사용자의 일반 링크 클릭으로 새 탭을 연다. 랭킹 주소가 비어 있을 때만 클릭 기본 동작을 막고 기존 미리보기 모달을 연다.
- `exportSaveFile()`은 세이브를 만든 로컬 시각과 현재 관장명·미술관명을 `YYMMDD_HHMMSS_관장이름_미술관이름.json` 형식의 다운로드 파일명으로 쓴다. `saveFileNameSegment()`가 운영체제에서 금지된 문자를 제거하지만 JSON 내용과 불러오기 형식은 바꾸지 않는다.
- `scripts/test-story-ranking.mjs`가 고정 원고 15편, 1,500 상한, 완주일 마이그레이션과 클라이언트·서버 v2 필드를 검사한다. `scripts/test-ranking-backend.mjs`가 서버 점수, 보너스 상한, 미완주 0점과 결과 페이지 표시를 검사한다.

## 난이도 5의 수치형 재료 상태 신호

`stability`, `precision`, `rhythm`은 `mechanicDifficulty()`가 5이고 `state.alwaysShowSafeZones`가 꺼져 있을 때만 `session.expertCueMode`를 사용한다. 이 모드는 판정값을 바꾸지 않고 플레이 중 초록 안전 범위 DOM을 생략한다.

```text
renderCurrentStep()
→ usesExpertMaterialCues()
→ session.expertCueMode
→ renderMechanicMarkup(): 안전 범위 생략 + 재료 표면 렌더링
→ 기존 update 함수: 같은 targetStart/targetEnd 판정값으로 low/safe/high 표현만 갱신
→ 실패 시 addMechanicMistake(): 기존 목표/실제 근접 피드백 그대로 표시
```

- 재질 표현 선택: `stabilityPresentationForTool()`, `precisionPresentationForTool()`, `rhythmPresentationForTool()`의 `cueTheme`, `cueLow`, `cueSafe`, `cueHigh`, `expertDescription`
- 공통 상태 반영: `updateExpertMaterialState()`
- 시각 규칙: `styles.css`의 `.material-state-surface`, `.expert-material-state`, `.cue-*`
- 색 외 단서: 낮음은 점선·거친 선형 질감, 적정은 실선·광택 띠, 초과는 이중선·반점 질감을 사용한다.
- 접근성 복귀: `state.alwaysShowSafeZones`가 참이면 난이도 5도 난이도 2~4와 같은 초록 안전 범위를 렌더링한다.
- 1회 안내: `state.difficultyFiveCueSeen`은 선택적 세이브 필드이며 `normalizeState()`가 누락 값을 `false`로 마이그레이션한다.

`difficultyFiveCueSeen`, `alwaysShowSafeZones`, `extendedPuzzlePreview`는 선택적 설정 필드로 세이브에 남는다. 현재 재료 상태, `expertCueMode`, `dragPreviewState`, 방울 연결 제한시간은 세션/화면 한정이며 저장하지 않는다. 판정 난이도를 수정할 때는 시각 상태 경계가 아니라 기존 각 미니게임의 `safeStart`, `safeEnd`, `tolerance`를 단일 기준으로 유지해야 한다.

## 새 미니게임 추가 시 수정할 파일

### 반드시 수정

- `js/game.js`
  - `MECHANIC_IDS`, `MECHANIC_NAMES`, `MECHANIC_GUIDES`
  - `PRACTICE_CHALLENGES`
  - `mechanicCandidatesForTool()` 또는 작품 계획 로직
  - `renderMechanicMarkup()`의 UI 분기
  - `bindMechanicControls()`의 입력 연결
  - `activateCurrentMechanic()`의 시작 분기
  - 개별 상태 초기화, 성공·실패 판정, 다시하기
  - 화면 이탈·탭 비활성화 때의 일시정지와 재개
  - 단계 종료 때 애니메이션 프레임·타이머·이벤트 정리
- `styles.css`
  - 새 게임 UI, 성공·실패·비활성 상태
  - 모바일 크기와 터치 영역
  - `prefers-reduced-motion` 대응

### 상황에 따라 수정

- `js/artworks-data.js`: 새 도구, 새 복원 단계, 새 재질별 작업을 추가할 때
- `index.html`: 게임 밖에 고정 HUD, 새 패널, 접근성 설명이 필요할 때만
- `scripts/`: 등록 누락, 도구 매핑, 난이도, 수명주기를 자동 검증할 때
- `scripts/test-minigame-feedback.mjs`: 공통 성공·실패 후킹, 세션 수명주기, 기존 10종 보존과 `cleaning`·`uv`·`budget`·`balance` 등록, 세 수치형 피드백, `drag` 기억 미리보기, 난이도 5 `rhythm` 연결시간, 세척·UV·배분·받침 판정과 마이그레이션, `choice`·`sequence`·`tone`·`align` 난이도 파라미터와 세이브 격리, 포인터 입력, HUD 반응형 규칙 검증
- `scripts/test-minigame-integration.mjs`: 핵심 4점과 생성 496점의 4~5단계 계획·도구 후보를 전수 계산하고, 14종 커버리지와 `cleaning`·`uv`·`budget`·`balance` 분포, 오도구 차단, 공용 RAF/타이머 정리, 다시하기 격리, 선택 필드 마이그레이션과 런타임 10종 하드코딩 잔존을 검증
- `scripts/test-budget-mechanic.mjs`: 난이도 2·5의 부위 수·필요량 공개·총량 부족, 단계별 서로 다른 세 배분 결과, 다섯 재질 문구, 총합 100 제한, 연습 등록, `appealPenalty` 구형 세이브 보완과 390px 슬라이더 크기를 검증
- `scripts/test-balance-mechanic.mjs`: 난이도 2·5의 안전 배치와 약한 곳 하중 배치가 모두 가능한지, 다섯 재질 외형, 30초 감쇠 안정성, 연습·도구 매핑·일시정지·정리, 390px 받침 크기와 reduced-motion 규칙을 검증
- 이 `ARCHITECTURE.md`: ID, 인터페이스, 데이터나 결과 경로가 달라질 때

연습 목록과 등록 검사에 표시되는 미니게임 수는 `MECHANIC_IDS.length`와 `PRACTICE_CHALLENGES.length`로 동적 계산한다. 새 ID를 추가할 때 숫자를 다시 하드코딩하지 않는다.

## 예시: `rhythm` 등록부터 결과 반영까지

1. 작품 단계가 `js/artworks-data.js`에서 접착제 점적과 어울리는 도구를 지정한다.
2. `mechanicCandidatesForTool()`이 그 도구의 후보에 `rhythm`을 포함한다.
3. `preferredMechanicForStep()`과 `mechanicPlanForArtwork()`이 작품의 결정적 계획에 `rhythm`을 배정한다.
4. `renderCurrentStep()`이 현재 ID와 `mechanicDifficulty()`의 2~5 값을 계산한다.
5. `renderMechanicMarkup()`이 수축하는 원과 점적 입력 버튼을 렌더링한다.
6. `selectTool()`이 올바른 도구 선택을 확인한 뒤 `activateCurrentMechanic()`을 호출한다.
7. `startAdhesiveChallenge()`가 `rhythmPresentationForTool()`과 난이도로 목표 크기, 속도, 허용 오차를 구성하고 애니메이션을 시작한다. 난이도 5면 첫 성공 뒤 다음 방울의 연결 제한시간도 켠다.
8. 플레이어 입력은 `handleAdhesiveDrop()`에서 `judgeAdhesiveTiming()`으로 전달된다.
9. 빗나가면 `addMechanicMistake()`가 위험도·실수를 누적하고 목표 반지름과 실제 반지름을 비교하며, 성공하면 다음 점적으로 진행한다.
10. 필요한 판정을 모두 통과하면 `finishMechanicSoon()`이 스트릭을 기록하고 `completeStep()`으로 연결한다.
11. 마지막 단계라면 `completeRestoration()`이 정확도, 위험도, 작업 시간, 보너스, 평판, 복원 기록을 저장한다.
12. 복원 작품은 전시 대상이 되고, 이후 전시 매력도와 평판을 통해 관람객 및 수익 계산에 참여한다.

## 변경 전·후 확인 목록

### 변경 전

1. 이 문서를 끝까지 읽는다.
2. `AGENTS.md`를 끝까지 읽는다.
3. 수정하려는 단계의 `tool`과 실제 미니게임 계획을 확인한다.
4. 캠페인과 보존 연습 양쪽 진입 경로를 확인한다.
5. 현재 세이브 형식에 영향이 있는지 확인한다.

### 변경 후

1. 잘못된 도구로 게임이 시작되지 않는지 확인한다.
2. 각 재질에서 설명, 도구, 상호작용이 서로 맞는지 확인한다.
3. 다시하기와 단계 전환 시 이전 상태가 남지 않는지 확인한다.
4. 메뉴 이동, 탭 비활성화, 화면 숨김 상태에서 타이머와 음악이 올바르게 멈추는지 확인한다.
5. 마우스와 터치로 모두 플레이한다.
6. 데스크톱과 모바일 폭에서 UI가 작품·위험도·튜토리얼을 가리지 않는지 확인한다.
7. `node --check js/game.js`와 관련 `scripts/` 검증을 실행한다.
8. 로컬 서버에서 실제 브라우저 검증을 수행한다.
9. 구조가 달라졌다면 이 문서를 최신 상태로 갱신한다.
