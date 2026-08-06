# 무료 온라인 랭킹 도입 검토

## 결론

- 지인 대상 시험판은 **Google Apps Script + Google Sheets**가 가장 빠르다. 별도 서버를 구입하지 않고 `doGet`/`doPost` 웹 앱으로 점수를 받고 시트에서 상위 기록을 읽을 수 있다.
- 불특정 다수가 참여하는 공개판은 **Cloudflare Worker + D1 무료 구간**을 권장한다. 서버 측 입력 검증, 속도 제한, 중복 기록 정리, SQL 순위 계산을 Apps Script보다 명확하게 구성할 수 있다.
- Supabase Free도 좋은 대안이지만 무료 프로젝트의 비활성 일시중지 정책을 운영 전에 확인해야 한다.
- 현재 빌드는 엔드포인트와 운영 계정이 없으므로 온라인 전송을 임의로 넣지 않았다. 로컬 기록과 JSON 저장 파일은 그대로 동작한다.

## 관장님이 먼저 해 줄 일

공개 랭킹을 오래 운영하려면 **Cloudflare Worker + D1**을 권장한다. 사용자가 준비할 것은 아래 네 가지뿐이고, 비밀번호나 API 토큰을 게임 코드나 채팅에 적을 필요는 없다.

1. [Cloudflare](https://dash.cloudflare.com/) 무료 계정을 만든다.
2. 랭킹에 공개할 항목을 정한다. 기본 권장값은 `관장 이름`, `미술관 이름`, `작품명`, `기술 점수`, `정확도`, `완료 시간`이며 이메일·IP·실명은 수집하지 않는다.
3. 게임을 올릴 최종 웹 주소를 정한다. 아직 없다면 임시 주소로 개발한 뒤 배포 주소가 생겼을 때 CORS 허용 주소만 바꿀 수 있다.
4. 내가 만들어 줄 Worker를 본인 Cloudflare 계정에서 배포한 뒤 표시되는 `https://...workers.dev` 주소만 알려 준다. 이 주소를 게임의 랭킹 설정에 연결하면 된다.

그 다음 개발 작업은 이 저장소에서 처리할 수 있다: D1 테이블, 점수 검증 API, 작품별/종합 랭킹 화면, 제출 실패 시 로컬 재시도, 이름 필터, 요청 속도 제한을 구현한다. 계정 로그인과 최초 배포 승인만 계정 소유자가 직접 해야 한다.

지인 몇 명에게 빠르게 시험하는 목적이면 Google Sheets에서 `확장 프로그램 → Apps Script`를 열어 웹 앱을 배포하고, 배포된 `/exec` URL만 알려 주는 방법도 있다. 이때 시트 편집 권한이나 Google 비밀번호는 공유하지 않는다. Apps Script는 계정별 할당량을 넘으면 실행이 중단될 수 있으므로 공개판의 장기 운영보다는 시험판에 알맞다.

## 랭킹 점수

현재 Google Apps Script 랭킹은 복원 성과와 운영 성과를 함께 계산한다.

```text
작품 점수 = 정확도 × 100 + 시간 가산점 - 위험도 × 10 + 250
시간 가산점 = 금 300 / 은 200 / 동 100 / 없음 0
관장 점수 = 작품 점수 합계 + 누적 개관 수입 보너스 + 누적 관람객 보너스 + 전체 이야기 완주 속도 보너스
```

정확도 80% 미만은 시간 가산점을 받지 못한다. 빠르게 작품을 손상시키는 플레이가 유리해지지 않도록 정확도, 위험도, 완료 시간을 함께 저장한다. 수입과 관람객 보너스는 각각 최대 5,000점이며, 매력도 2,500의 후일담 5편까지 연 날짜에 따라 이야기 보너스 1,500~5,000점을 준다.

전체 랭킹은 다음 두 가지를 분리하는 편이 공정하다.

1. `작품별 최고 기록`: 같은 작품끼리 기술 점수를 비교하고 동점이면 정확도, 짧은 시간, 낮은 위험도 순으로 정렬한다.
2. `관장 종합 기록`: 서로 다른 작품의 최고 기술 점수 합계, 복원 작품 수, S등급 수를 함께 표시한다.

## 권장 API 모양

### 기록 제출

`POST /scores`

```json
{
  "installId": "임의 생성 익명 ID",
  "directorName": "윤서",
  "museumName": "온별 미술관",
  "artId": "moon-jar",
  "accuracy": 96,
  "risk": 4,
  "durationSeconds": 173,
  "skillScore": 9800,
  "clientVersion": "prototype-2026-08"
}
```

서버는 문자열 길이와 금지어, 작품 ID, 점수 범위, 요청 빈도를 검사하고 `skillScore`를 다시 계산해야 한다. 같은 `installId + artId`는 최고 기록만 남긴다.

### 랭킹 조회

`GET /leaderboard?artId=moon-jar&limit=50`

응답에는 순위, 표시 이름, 미술관 이름, 정확도, 시간, 기술 점수만 포함한다. 익명 ID, IP, 원본 저장 데이터는 공개하지 않는다.

## Google Apps Script로 시작할 때

1. 비공개 Google Sheet에 `createdAt`, `installIdHash`, `directorName`, `museumName`, `artId`, `accuracy`, `risk`, `durationSeconds`, `skillScore`, `version` 열을 만든다.
2. Apps Script 웹 앱의 `doPost`에서 JSON을 파싱하고 허용 목록·길이·금지어·빈도 검사를 한 뒤 LockService로 동시 쓰기를 보호한다.
3. `doGet`은 상위 50개만 JSON으로 돌려준다. Content Service 응답은 일회성 `script.googleusercontent.com` 주소로 리디렉션되므로 현재 정적 사이트에서 실제 `fetch` 호환성을 배포 환경별로 먼저 시험한다.
4. JSONP는 공식 문서에 있지만 읽기 전용 공개 데이터에만 사용한다. 기록 제출이나 개인 데이터에는 사용하지 않는다.
5. Apps Script 할당량은 사용자별이며 바뀔 수 있으므로, 제출 제한과 장애 시 로컬 기록 유지가 필요하다.

이 방식은 관리가 간단하지만 시트가 커질수록 정렬·중복 제거·동시 요청 처리가 불리하다. 소규모 베타에 적합하다.

## Cloudflare Worker + D1로 시작할 때

1. Worker에 `POST /scores`, `GET /leaderboard` 두 경로를 만든다.
2. D1의 `scores` 테이블에 익명 설치 ID의 해시와 최고 기록만 저장한다.
3. Worker에서 CORS 허용 도메인을 게임 배포 주소로 제한하고 요청 본문 크기, 속도, 이름 금지어, 점수 범위를 검증한다.
4. IP 원문을 저장하지 않고 짧은 시간의 속도 제한에만 사용한다. 관리자용 삭제·차단 목록을 별도 테이블로 둔다.
5. 무료 한도를 넘으면 제출을 잠시 끄고 로컬 기록만 유지하도록 게임이 실패를 조용히 처리한다.

D1은 Workers Free에서 일일 읽기 500만 행, 쓰기 10만 행, 총 5GB 저장 공간을 명시하고 있어 작은 게임 랭킹에는 충분한 출발점이다. 실제 정책과 가격은 배포 직전에 다시 확인해야 한다.

## 부정 기록과 개인정보

- 정적 HTML 게임의 값은 개발자 도구로 바꿀 수 있으므로 **완전한 치트 방지는 불가능**하다.
- 서버 재계산, 제출 빈도 제한, 비현실적 시간 거부, 버전 허용 목록, 작품별 최고 1건 저장으로 가벼운 조작을 줄일 수 있다.
- 상금이나 중요한 경쟁이라면 서버가 발급한 시작 토큰과 단계별 입력 요약을 검증하거나 계정 인증이 필요하다.
- 표시 이름은 로컬 검사만 믿지 말고 서버에서 다시 검사한다. 신고·숨김·관리자 삭제 경로가 필요하다.
- 이메일, 전화번호, 위치, 생년월일은 받지 않는다. 익명 설치 ID는 해시해 저장하고 개인정보 안내문에 보존 기간을 쓴다.

## 공식 참고 자료

- Google Apps Script 웹 앱: https://developers.google.com/apps-script/guides/web
- Google Apps Script Content Service: https://developers.google.com/apps-script/guides/content
- Google Apps Script 할당량: https://developers.google.com/apps-script/guides/services/quotas
- Cloudflare D1 개요: https://developers.cloudflare.com/d1/
- Cloudflare D1 가격·무료 한도: https://developers.cloudflare.com/d1/platform/pricing/
- Cloudflare Workers 가격: https://developers.cloudflare.com/workers/platform/pricing/
- Supabase 가격: https://supabase.com/pricing
