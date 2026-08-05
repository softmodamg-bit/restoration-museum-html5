(() => {
  "use strict";

  const rarities = ["새 발견", "지역의 보물", "기증 컬렉션", "특별 수장품", "희귀 기록"];
  const artistNames = ["김하진", "윤매화", "박도윤", "최해원", "정라온", "한여름", "서가람", "이새벽", "문다온", "강유리", "백소담", "오하늘", "신보라", "임윤호"];
  const motifs = ["별무리", "잔물결", "겹꽃잎", "바람선", "새의 궤적", "달무리", "격자 정원", "씨앗 점", "구름띠", "나선 리듬", "햇살 조각", "산 능선"];
  const finalConsonantDigits = new Set(["0", "1", "3", "6", "7", "8"]);

  function hasFinalConsonant(text) {
    const cleaned = String(text).trim().replace(/[\s.!?,:;~…'"”’）)\]}]+$/g, "");
    const lastCharacter = Array.from(cleaned).at(-1) || "";
    const code = lastCharacter.charCodeAt(0);

    if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
    if (/\d/.test(lastCharacter)) return finalConsonantDigits.has(lastCharacter);
    return false;
  }

  function withTopicParticle(text) {
    return `${text}${hasFinalConsonant(text) ? "은" : "는"}`;
  }

  const profileLore = {
    ceramic: {
      eras: ["18세기 후반풍", "19세기 중엽풍", "20세기 초 공방작", "1960년대 재해석", "동시대 창작"],
      artistRole: "도예가", artType: "유약 장식 도자기", origin: "해오름 도요 기증",
      value: "성형 흔적과 유약 흐름, 생활 도구가 예술품으로 변화한 과정을 함께 보여 줍니다.",
      story: "가마 문을 여는 날마다 색이 다르게 나타나 ‘한 번뿐인 빛’을 담은 그릇으로 불렸습니다."
    },
    paper: {
      eras: ["19세기 후반 민화풍", "대한제국기 채색화풍", "1920년대 화첩", "1970년대 전통회화", "동시대 수묵채색"],
      artistRole: "채색화가", artType: "종이 바탕 채색화", origin: "다정헌 문중 기탁",
      value: "계절의 상징과 생활 속 소망을 섬세한 선과 색으로 기록한 시각 자료입니다.",
      story: "집안의 중요한 날마다 펼쳐 두었던 그림으로, 접힌 자국마다 가족 행사의 기억이 남아 있습니다."
    },
    painting: {
      eras: ["1880년대풍", "1910년대 인상주의풍", "1930년대 도시회화", "1960년대 서정회화", "동시대 구상회화"],
      artistRole: "화가", artType: "캔버스 유채", origin: "은하 미술연구회 기증",
      value: "빛과 색을 다루는 시대별 화법과 도시 생활의 변화를 한 화면에서 읽을 수 있습니다.",
      story: "작가는 같은 장소를 여러 계절에 그렸고, 이 작품의 뒷면에는 다음 그림을 위한 작은 색 메모가 남아 있습니다."
    },
    metal: {
      eras: ["18세기 공예풍", "19세기 장식금속풍", "1910년대 공방작", "1950년대 생활공예", "동시대 금속공예"],
      artistRole: "금속공예가", artType: "주조·단조 금속공예", origin: "별고을 생활사관 이관",
      value: "주조와 두드림 자국, 합금 표면의 변화가 당시의 기술과 사용 방식을 전합니다.",
      story: "오랫동안 한 가족의 기념일에만 꺼내 쓰던 물건으로, 가장자리의 작은 닳음이 사용 순서를 알려 줍니다."
    },
    textile: {
      eras: ["19세기 후반 자수풍", "1900년대 혼례 직물", "1930년대 생활 자수", "1980년대 섬유예술", "동시대 직물작품"],
      artistRole: "자수장", artType: "직물·색실 자수", origin: "온새미 직물공방 기증",
      value: "염색과 바느질 기법뿐 아니라 색과 문양에 담긴 공동체의 소망을 보여 줍니다.",
      story: "여러 사람이 한 조각씩 수놓아 완성한 작품으로, 실의 굵기 차이가 참여자의 손길을 구분해 줍니다."
    },
    lacquer: {
      eras: ["18세기 나전칠기풍", "19세기 후반 칠공예", "1920년대 공방작", "1970년대 옻칠 재현", "동시대 칠예"],
      artistRole: "칠공예가", artType: "목제 옻칠·나전 공예", origin: "달맞이 공예관 기탁",
      value: "목재 구조, 옻칠 층, 자개 빛이 겹쳐 만들어지는 복합 공예의 정수를 보여 줍니다.",
      story: "밤하늘을 좋아한 제작자가 남은 자개 조각을 모아 별자리처럼 배치했다는 공방 기록이 전합니다."
    },
    stone: {
      eras: ["17세기 석조풍", "19세기 정원 조각", "1920년대 건축 장식", "1960년대 기념조각", "동시대 석조"],
      artistRole: "석조가", artType: "석재 조각·부조", origin: "느티정원 이전 소장",
      value: "도구 자국과 풍화면이 제작 기술, 원래 설치 장소, 야외 환경의 시간을 함께 품고 있습니다.",
      story: "철거된 오래된 정원의 한쪽을 지키던 조각으로, 사진 속 아이들이 매년 같은 자세로 옆에 서 있습니다."
    },
    glass: {
      eras: ["19세기 말 유리공예풍", "1920년대 장식유리", "1950년대 생활유리", "1990년대 스튜디오 글라스", "동시대 유리예술"],
      artistRole: "유리공예가", artType: "취입·성형 유리", origin: "푸른빛 유리공방 기증",
      value: "기포와 색 띠, 두께 변화가 손으로 불어 만든 순간의 움직임과 온도를 기록합니다.",
      story: "제작 중 우연히 생긴 작은 기포를 작가가 ‘숨 한 모금’이라 부르며 작품의 중심으로 남겼습니다."
    },
    photo: {
      eras: ["1890년대 사진관풍", "1910년대 은염사진", "1930년대 기록사진", "1960년대 생활사진", "1990년대 컬러사진"],
      artistRole: "사진가", artType: "인화지 사진", origin: "모퉁이 사진관 아카이브",
      value: "사라진 장소와 평범한 사람들의 표정, 당시 사진 기술과 생활 문화를 동시에 증언합니다.",
      story: "현상되지 않은 필름 봉투에서 뒤늦게 발견되어, 사진 속 장소를 시민들이 함께 찾아낸 작품입니다."
    },
    book: {
      eras: ["18세기 필사본풍", "19세기 장정본", "1910년대 개인 수첩", "1950년대 연구 노트", "1980년대 작가책"],
      artistRole: "기록자", artType: "제본 문서·필사본", origin: "새봄 기록문화재단 기탁",
      value: "글과 그림뿐 아니라 종이, 제본 순서, 고친 흔적이 지식이 만들어지는 과정을 보여 줍니다.",
      story: "여러 세대가 여백에 메모를 이어 적어 본문과 독자의 시간이 한 권 안에 겹쳐 있습니다."
    },
    mural: {
      eras: ["17세기 벽화풍", "19세기 건축벽화풍", "1920년대 공공벽화", "1970년대 마을벽화", "동시대 장소특정 벽화"],
      artistRole: "벽화가", artType: "회벽 바탕 채색", origin: "별마루 옛 극장 수습",
      value: "건축 공간과 함께 완성되었던 색채 계획, 공동체 의식, 당시의 안료 사용을 전합니다.",
      story: "건물이 사라지기 전 주민들이 기억을 모아 그림의 원래 위치와 등장인물의 이름을 되찾았습니다."
    },
    plaster: {
      eras: ["19세기 아카데미 조각풍", "1910년대 석고원형", "1940년대 장식조각", "1980년대 복합조각", "동시대 조형"],
      artistRole: "조각가", artType: "석고·복합재료 조각", origin: "한빛 조각학교 구장",
      value: "완성작으로 가는 제작 과정과 손으로 다듬은 흔적을 가까이에서 확인할 수 있습니다.",
      story: "완성 청동상이 사라진 뒤 남은 유일한 원형으로, 손바닥 자국과 치수 표기가 그대로 보존되어 있습니다."
    },
    contemporary: {
      eras: ["1960년대 실험미술풍", "1980년대 혼합매체", "2000년대 설치미술", "2010년대 아상블라주", "동시대 신작"],
      artistRole: "현대미술가", artType: "복합재료·설치", origin: "작가 스튜디오 장기대여",
      value: "일상 재료의 새로운 의미와 작가의 설치 의도, 시간에 따라 변하는 작품 개념을 생각하게 합니다.",
      story: "작가는 관람객이 남긴 짧은 메모를 작품의 다음 전시에 일부 반영해 매번 조금씩 다른 모습을 만들었습니다."
    },
    wood: {
      eras: ["18세기 목공예풍", "19세기 생활목기", "1920년대 목제완구", "1970년대 목조예술", "동시대 목조"],
      artistRole: "목공예가", artType: "조각·결구 목제 유물", origin: "솔바람 목공소 기증",
      value: "나뭇결과 결구, 칼자국을 통해 재료 선택과 손도구 기술, 생활 속 쓰임을 읽을 수 있습니다.",
      story: "한 그루에서 나온 나무로 여러 물건을 만든 공방의 마지막 작품으로, 바닥에 같은 나이테 표시가 남아 있습니다."
    }
  };

  const profiles = [
    {
      id: "ceramic",
      material: "도자기",
      visual: "vessel",
      damage: "미세 균열과 오래된 접합부, 작은 결손이 함께 보입니다.",
      summary: "표면과 구조를 조사한 뒤 이탈부를 안정화하고 결손 범위만 식별 가능하게 보완했습니다.",
      ethics: "도자기의 사용 흔적과 제작 흔적은 지우지 않고, 구조 안전에 필요한 범위만 개입합니다.",
      titles: ["새벽 구름 항아리", "매화 물결 주병", "청빛 연꽃 완", "복숭아꽃 편병", "햇살 분청 대접", "비취 학무늬 병", "가을 들국화 합", "은하수 백자 잔", "모란 정원 항아리", "솔바람 청자 주자", "노을빛 다완", "구름 토끼 향합", "별무리 상감 병", "눈꽃 백자 호"],
      steps: [
        ["균열 지도 작성", "빛을 비춰 균열과 과거 접합 흔적을 찾으세요.", "magnifier", "새 균열과 안정된 제작 흔적을 구분해 기록합니다."],
        ["표면 반응 시험", "장식이 안정적인 작은 지점을 확인하세요.", "testSwab", "유약과 안료가 처리에 반응하지 않는지 국부 시험합니다."],
        ["구조 안정화", "이탈한 경계를 최소한으로 접합하세요.", "reversibleAdhesive", "재처리 가능성을 고려해 구조에 필요한 접합만 시행합니다."],
        ["결손 보완", "빈 결손부 안에서만 형태를 연결하세요.", "fillSpatula", "원본 표면을 덮지 않고 작은 결손의 지지만 회복합니다."]
      ]
    },
    {
      id: "paper",
      material: "종이·채색",
      visual: "hanging",
      damage: "접힘과 가장자리 찢김, 채색층의 들뜸이 관찰됩니다.",
      summary: "매체의 민감도를 확인하고 간접 가습과 얇은 지지로 종이의 변형과 찢김을 안정화했습니다.",
      ethics: "종이와 안료마다 반응이 다르므로 전체 처리보다 색별 시험과 국부 안정화를 우선합니다.",
      titles: ["여름 연못 화조도", "달빛 대나무 그림", "산새와 동백 족자", "구름 아래 금강산", "책거리 작은 병풍", "연꽃과 물총새", "봄비 산수 두루마리", "매화 아래 고양이", "갈대밭 기러기", "모란과 나비 화첩", "소나무와 학 그림", "가을 국화 초충도", "새벽 강산 수묵화", "눈 내린 정원 화첩"],
      steps: [
        ["매체 조사", "번짐과 들뜸 가능성이 있는 부분을 찾으세요.", "magnifier", "종이 섬유, 채색, 과거 보수 흔적을 나누어 기록합니다."],
        ["이염 시험", "색마다 작은 시험 지점을 확인하세요.", "testSwab", "수분에 민감한 채색이 묻어나지 않는지 확인합니다."],
        ["휘어진 곳 펴기", "접힌 부분에 습도를 천천히 전달하세요.", "humidityPack", "직접 물을 대지 않고 휘어진 곳을 천천히 폅니다."],
        ["찢김 지지", "찢어진 가장자리를 뒤에서 받쳐 주세요.", "paperPatch", "얇은 보존용 지지로 당기는 힘을 여러 곳으로 나누고 원본을 가리지 않습니다."]
      ]
    },
    {
      id: "painting",
      material: "유화",
      visual: "framed",
      damage: "먼지층과 황변된 코팅, 작은 채색층 들뜸이 보입니다.",
      summary: "층위를 조사하고 안전한 시험구를 기준으로 먼지와 변색층을 국부적으로 줄였습니다.",
      ethics: "표면의 세월을 모두 제거하지 않고, 원래 채색층이 안전한 범위에서만 다시 알아보기 쉽게 합니다.",
      titles: ["창가의 오후", "푸른 정원의 산책", "비 오는 항구", "라일락이 있는 방", "해질녘 밀밭", "겨울 온실", "오렌지와 은주전자", "언덕 위 붉은 집", "바닷가의 편지", "작은 극장의 밤", "양귀비 들판", "정오의 카페", "유리창 너머 설경", "등불 켜진 골목"],
      steps: [
        ["층위 조사", "코팅과 채색층의 경계를 살펴보세요.", "magnifier", "광택, 균열, 과거 덧칠을 구분해 처리 범위를 정합니다."],
        ["세척 시험", "색 변화가 가장 적은 시험구를 찾으세요.", "testSwab", "작은 시험창에서 안료와 광택의 안정성을 비교합니다."],
        ["표면 먼지 제거", "들뜬 채색을 피해 먼지만 걷어내세요.", "softBrush", "불안정한 부분을 건드리지 않고 느슨한 오염만 제거합니다."],
        ["변색층 조정", "시험을 마친 범위만 천천히 처리하세요.", "varnishGel", "전체 제거가 아닌 국부 단위로 반응을 확인합니다."],
        ["결손 보색", "작은 결손 안에서만 색을 연결하세요.", "retouchBrush", "가까이에서는 복원한 곳을 구별할 수 있도록 필요한 부분만 색을 맞춥니다."]
      ]
    },
    {
      id: "metal",
      material: "금속",
      visual: "round",
      damage: "분말화된 부식물과 안정한 산화층이 함께 남아 있습니다.",
      summary: "활성 부식과 안정한 표면을 구분하고 진행성 손상만 늦춘 뒤 얇은 보호층을 적용했습니다.",
      ethics: "금속을 새것처럼 빛내기보다 안정된 표면과 역사적 흔적을 남기는 것이 우선입니다.",
      titles: ["연꽃무늬 은합", "별자리 청동반", "구름 용무늬 동경", "학무늬 놋쇠 향로", "물결무늬 철제 등잔", "포도문 은제 잔", "봉황 장식 동함", "해와 달 금동판", "거북무늬 청동종", "국화문 놋쇠 쟁반", "나비 장식 은비녀", "바람개비 철제 촛대", "연화문 금동함", "칠보 구름 노리개"],
      steps: [
        ["부식 조사", "가루화와 들뜸이 있는 지점을 찾으세요.", "magnifier", "안정한 녹과 진행 중인 부식을 형태와 상태로 구분합니다."],
        ["불안정층 제거", "가루화된 부식물만 조심스럽게 덜어내세요.", "microPick", "금속심과 안정한 표면을 건드리지 않도록 확대 관찰합니다."],
        ["손상 늦추기", "활성 부식 지점만 더 번지지 않게 처리하세요.", "stabilizer", "환경 위험과 남은 부식 상태를 살펴 손상이 더 번지지 않게 막습니다."],
        ["보호층 적용", "얇고 균일한 보호막을 만들어 주세요.", "protectiveWax", "광택을 과도하게 높이지 않는 최소 보호층을 적용합니다."]
      ]
    },
    {
      id: "textile",
      material: "직물·자수",
      visual: "textile",
      damage: "섬유 약화와 실 풀림, 표면 먼지가 함께 확인됩니다.",
      summary: "약해진 섬유를 확인하고 자극이 적은 표면 정리와 지지 바느질로 구조를 튼튼하게 잡았습니다.",
      ethics: "바랜 색을 새로 칠하지 않고 남아 있는 섬유와 염색 정보를 보존합니다.",
      titles: ["자수 봉황 흉배", "모란 넝쿨 보자기", "구름 학문 비단띠", "오방색 조각보", "연꽃무늬 탁의", "나비꽃 자수 주머니", "별빛 금사 직물", "산수문 비단 장막", "석류문 자수 패널", "청록 깃털 부채집", "국화문 혼례 보", "물결문 면직 깔개", "동백꽃 자수 수건", "달토끼 색실 보자기"],
      steps: [
        ["섬유 상태 조사", "약해진 실과 풀린 조직을 표시하세요.", "magnifier", "장식 실, 바탕 직물, 과거 수선을 나누어 기록합니다."],
        ["표면 먼지 정리", "약한 섬유를 피해 먼지를 낮은 자극으로 제거하세요.", "surfaceVacuum", "보호망을 사이에 두는 방식으로 느슨한 먼지만 정리합니다."],
        ["엉킨 섬유 정돈", "풀린 실을 원래 방향으로 정리하세요.", "fiberTweezers", "실을 당기지 않고 남아 있는 조직 방향에 맞춰 놓습니다."],
        ["지지 바느질", "약해진 부분을 받침 직물에 고정하세요.", "supportStitch", "눈에 띄지 않는 최소한의 지지점으로 무게를 여러 곳으로 나눕니다."]
      ]
    },
    {
      id: "lacquer",
      material: "목재·칠기",
      visual: "box",
      damage: "칠층 들뜸과 목재 이음부 벌어짐, 표면 먼지가 보입니다.",
      summary: "칠층의 들뜸을 먼저 안정화하고 구조에 무리를 주지 않는 범위에서 표면을 정리했습니다.",
      ethics: "칠기의 광택을 인위적으로 새로 만들지 않고 원래 층과 사용 흔적을 존중합니다.",
      titles: ["나전 별자리 함", "모란무늬 붉은 찬합", "구름학 흑칠 상자", "대나무문 서류함", "연꽃 자개 경대", "매화문 먹감나무 함", "파도무늬 필통", "봉황 나전 반짇고리", "소나무 금니 궤", "포도넝쿨 흑칠함", "국화 자개 쟁반", "달빛 옻칠 화장함", "거북문 목제 함", "새벽숲 나전 상자"],
      steps: [
        ["칠층 조사", "들뜬 칠과 목재 틈을 찾아 표시하세요.", "magnifier", "표면층과 바탕층의 분리 범위를 기록합니다."],
        ["반응 시험", "광택과 장식이 안정적인지 확인하세요.", "testSwab", "장식 재료별로 작은 시험을 거쳐 처리 가능 범위를 정합니다."],
        ["들뜸 고정", "움직이는 칠층만 바탕에 단단히 고정하세요.", "consolidant", "원래 위치를 넘지 않도록 꼭 필요한 만큼만 써서 들뜬 곳을 고정합니다."],
        ["표면 연결", "눈에 거슬리는 작은 결손 안에서만 색을 잇습니다.", "retouchBrush", "원본 칠층과 복원부가 가까이에서 구분되도록 처리합니다."]
      ]
    },
    {
      id: "stone",
      material: "석재",
      visual: "sculpture",
      damage: "표면의 느슨한 퇴적물과 미세 박리, 작은 결손이 있습니다.",
      summary: "석질과 표면 상태를 구분해 느슨한 오염을 제거하고 박리 부위를 안정화했습니다.",
      ethics: "오래된 색과 가공 흔적을 보존하며, 결손을 상상으로 완성하지 않습니다.",
      titles: ["미소 짓는 석조상", "연꽃 받침 석등", "구름무늬 석판", "새와 포도 부조", "두 손 모은 작은 상", "사자머리 장식돌", "달무늬 대리석 판", "춤추는 사람 부조", "물고기문 석함", "정원 난쟁이 석상", "해바라기 석고부조", "기하무늬 건축석", "산양 머리 조각", "별을 든 아이 상"],
      steps: [
        ["석질 조사", "갈라진 곳과 표면이 얇게 떨어진 곳을 구분하세요.", "magnifier", "원래 가공면, 쌓인 먼지와 이물질, 표면이 얇게 떨어진 범위를 나누어 기록합니다."],
        ["물 없이 먼지 정리", "느슨한 먼지만 부드럽게 제거하세요.", "softBrush", "남아 있는 안료와 약한 표면을 피합니다."],
        ["박리 안정화", "들뜨는 표면층만 제자리에 고정하세요.", "consolidant", "석재의 공극을 과도하게 막지 않는 범위에서 안정화합니다."],
        ["결손 지지", "구조에 필요한 작은 빈틈만 보완하세요.", "fillSpatula", "형태를 추정해 확장하지 않고 지지에 필요한 범위만 채웁니다."]
      ]
    },
    {
      id: "glass",
      material: "유리",
      visual: "glass",
      damage: "표면 풍화와 균열, 접합 이탈이 빛에 따라 드러납니다.",
      summary: "유리의 균열과 풍화층을 기록하고 조각의 무게를 받치는 나중에 떼어 낼 수 있는 받침을 마련했습니다.",
      ethics: "투명함을 되찾는 것보다 풍화층과 원래 조각의 안전한 지지가 먼저입니다.",
      titles: ["코발트 리본 유리병", "초록 물방울 잔", "호박빛 약병", "별무늬 스테인드 패널", "분홍 나선 유리합", "바다빛 손잡이 병", "포도송이 유리잔", "눈꽃 투명 접시", "무지개 모자이크 창", "푸른 새 유리상", "노을빛 향수병", "연꽃 유리 대접", "은빛 기포 화병", "달무리 유리등"],
      steps: [
        ["투과광 조사", "빛을 비춰 균열과 풍화층을 확인하세요.", "magnifier", "표면 스크래치와 구조 균열을 구분해 기록합니다."],
        ["물 없이 먼지 제거", "풍화층을 피해 느슨한 먼지만 걷어내세요.", "softBrush", "물에 민감할 수 있는 표면은 건드리지 않습니다."],
        ["조각 지지", "움직이는 조각이 무게를 받지 않도록 받쳐 주세요.", "glassSupport", "접합 전 형태와 무게를 여러 곳으로 나누는 지지를 먼저 만듭니다."],
        ["균열 연결", "필요한 접합선 안에서만 투명 지지층을 적용하세요.", "resinFill", "원본 유리 위로 넘치지 않게 최소 범위를 연결합니다."]
      ]
    },
    {
      id: "photo",
      material: "사진",
      visual: "photo",
      damage: "은빛 반사와 표면 들뜸, 가장자리 산성 변색이 보입니다.",
      summary: "사진층의 민감도를 확인하고 표면 접촉을 최소화한 채 안정적인 보관 지지에 옮겼습니다.",
      ethics: "사진 이미지는 매우 얇은 층에 있으므로 세척보다 취급과 보관 환경 개선을 우선합니다.",
      titles: ["비 오는 역의 사진", "강변 소풍 기념사진", "첫 전차가 온 날", "유리온실의 가족", "시장 골목 단체사진", "눈 내린 학교 운동장", "해변의 여름 엽서", "극장 앞 배우들", "공방의 하루", "산악열차 기념사진", "꽃집 주인의 초상", "야간 축제의 불빛", "작은 항구 파노라마", "옥상 정원의 오후"],
      steps: [
        ["사진층 조사", "들뜸과 은빛 반사가 있는 부분을 찾으세요.", "magnifier", "이미지층, 지지체, 표면 오염을 구분해 기록합니다."],
        ["느슨한 먼지 정리", "이미지층에 닿지 않게 가장자리부터 정리하세요.", "softBrush", "표면 마찰을 최소화하고 들뜬 부분을 피합니다."],
        ["평탄 지지", "휘어진 가장자리를 안전한 받침에 놓으세요.", "supportMount", "사진 크기에 맞는 중성 지지로 굽힘을 줄입니다."],
        ["보존 슬리브", "사진이 움직이지 않도록 보호 포장에 넣으세요.", "photoSleeve", "표면과 직접 마찰하지 않는 보존용 보호층을 마련합니다."]
      ]
    },
    {
      id: "book",
      material: "책·문서",
      visual: "book",
      damage: "책등 약화와 낱장 찢김, 가장자리 먼지가 확인됩니다.",
      summary: "책의 펼침 각도와 제본 상태를 먼저 안정화하고 낱장 손상을 얇게 지지했습니다.",
      ethics: "책은 낱장의 모음이 아니라 제본 구조 전체가 정보이므로 원래 순서와 움직임을 보존합니다.",
      titles: ["별자리 관측 수첩", "약초 그림 필사본", "여행자의 항구 일지", "고지도 작은 첩", "궁중 음식 기록", "새 관찰 그림책", "옛 노래 악보집", "정원 설계 노트", "천문 달력 필사본", "인형극 대본", "바다 생물 도감", "편지 모음 장정본", "목수의 도구 수첩", "겨울 시집 초고"],
      steps: [
        ["제본 조사", "책등과 낱장의 약한 부분을 확인하세요.", "magnifier", "원래 제본, 후대 수선, 낱장 손상을 구분합니다."],
        ["먼지 정리", "접힌 부분을 펼치지 말고 가장자리 먼지를 제거하세요.", "surfaceVacuum", "보호망을 사용해 느슨한 먼지만 낮은 자극으로 정리합니다."],
        ["낱장 지지", "찢어진 부분의 뒤를 얇게 받쳐 주세요.", "paperPatch", "글자와 그림을 가리지 않는 최소 폭으로 지지합니다."],
        ["책등 받침", "무리 없이 펼쳐지는 각도로 받침을 조절하세요.", "bindingCradle", "제본에 힘이 집중되지 않도록 양쪽 높이를 맞춥니다."]
      ]
    },
    {
      id: "mural",
      material: "벽화 조각",
      visual: "mural",
      damage: "안료층 분말화와 바탕층의 들뜸, 표면 그을음이 보입니다.",
      summary: "벽화층의 결합 상태를 조사하고 안료를 보호하면서 들뜬 바탕을 안정화했습니다.",
      ethics: "벽화는 건축과 환경의 일부였다는 맥락을 기록하고, 남은 조각을 임의로 재구성하지 않습니다.",
      titles: ["춤추는 사계 벽화", "푸른 사슴 벽화 조각", "연회도 벽면편", "별을 보는 사람들", "붉은 새와 나무", "배를 띄우는 마을", "정원의 악사들", "구름 위 행렬", "사냥 장면 벽화편", "아이들의 물놀이", "해와 달 천장화편", "포도 수확 벽화", "숲의 수호자 조각", "겨울 궁전 벽화편"],
      steps: [
        ["층간 조사", "안료층과 바탕층의 들뜸을 구분하세요.", "magnifier", "분말화, 균열, 지지체 분리를 층별로 기록합니다."],
        ["그을음 줄이기", "안료가 안정적인 곳의 느슨한 그을음만 정리하세요.", "sootSponge", "문지르지 않고 작은 면 단위로 반응을 살핍니다."],
        ["안료층 고정", "분말화된 안료가 더 떨어지지 않게 단단히 고정하세요.", "consolidant", "색을 진하게 만들지 않도록 꼭 필요한 만큼만 써서 결합을 돕습니다."],
        ["바탕층 지지", "벽화 뒤의 빈 공간에서 꼭 필요한 곳만 받쳐 주세요.", "groutTool", "표면을 밀어 올리지 않도록 필요한 틈만 채웁니다."]
      ]
    },
    {
      id: "plaster",
      material: "석고·복합 조각",
      visual: "bust",
      damage: "돌출부 결손과 표면 분말화, 오래된 덧칠이 관찰됩니다.",
      summary: "약한 표면을 먼저 고정하고 구조에 필요한 결손부만 중립적인 재료로 지지했습니다.",
      ethics: "조각의 결손을 상상으로 완성하지 않고 남은 형태가 안전하게 읽히도록 돕습니다.",
      titles: ["꽃바구니 든 소녀상", "잠든 사자 석고상", "바람의 얼굴 마스크", "작은 음악가 흉상", "정원 요정 조각", "책 읽는 아이 상", "두루미 장식 부조", "웃는 배우 가면", "달을 든 토끼상", "포도넝쿨 기둥 장식", "고양이와 실타래 상", "해바라기 벽면 부조", "날개 달린 말 조각", "겨울 숲의 여인상"],
      steps: [
        ["표면 조사", "분말화와 구조 균열을 나누어 표시하세요.", "magnifier", "재료층, 덧칠, 결손 범위를 구분해 기록합니다."],
        ["먼지 제거", "약한 돌출부를 피해 표면 먼지를 정리하세요.", "softBrush", "분말이 묻어나는 부분은 먼저 건드리지 않습니다."],
        ["표면 안정화", "가루화된 부분만 조심스럽게 고정하세요.", "consolidant", "표면 색과 광택을 바꾸지 않는 최소 범위를 선택합니다."],
        ["구조 보완", "하중을 받는 작은 결손만 받쳐 주세요.", "fillSpatula", "원래 윤곽을 추정해 넓히지 않고 구조적 지지만 회복합니다."]
      ]
    },
    {
      id: "contemporary",
      material: "현대 복합재료",
      visual: "abstract",
      damage: "서로 다른 재료의 접합 이탈과 표면 변화가 복합적으로 나타납니다.",
      summary: "작가의 의도와 재료별 위험을 기록하고 원래 조립 방식을 해치지 않는 나중에 떼어 낼 수 있는 받침을 적용했습니다.",
      ethics: "현대 작품은 작가의 의도와 교체 가능한 요소를 확인하는 기록이 처리만큼 중요합니다.",
      titles: ["바람의 층위", "분홍 소음의 정원", "접힌 시간 지도", "일곱 개의 파란 점", "빛을 담은 상자", "도시의 숨결 콜라주", "종이달의 궤도", "느린 파도 설치작품", "기억의 서랍", "초록 오후의 조각", "우산 아래의 음표", "무중력 꽃병", "여름 편지 아상블라주", "창문 너머의 색면"],
      steps: [
        ["재료 지도 작성", "서로 다른 재료와 접합 방식을 표시하세요.", "magnifier", "원래 조립, 노화, 의도된 변화 가능성을 나누어 기록합니다."],
        ["국부 반응 시험", "재료별로 안전한 접촉 범위를 확인하세요.", "testSwab", "플라스틱, 종이, 도료가 서로 다르게 반응하는지 비교합니다."],
        ["격리층 마련", "서로 영향을 주는 재료 사이를 분리하세요.", "isolationLayer", "원래 겉모양을 바꾸지 않는 나중에 걷어 낼 수 있는 얇은 보호층을 적용합니다."],
        ["전시 지지", "무게가 접합부에 몰리지 않도록 받쳐 주세요.", "supportMount", "작품의 설치 의도를 유지하며 무게를 여러 곳으로 나눕니다."]
      ]
    },
    {
      id: "wood",
      material: "목제 유물",
      visual: "wood",
      damage: "건조 변형과 표면 박락, 약한 이음부가 확인됩니다.",
      summary: "목재의 변형과 표면 흔적을 기록하고 환경 변화와 전시 무게를 줄이는 지지를 마련했습니다.",
      ethics: "목재의 갈라짐을 억지로 닫지 않고 현재 형태에 맞는 안정적인 환경과 지지를 우선합니다.",
      titles: ["물새무늬 목간", "작은 배 모형", "꽃잎 조각 목함", "여우 얼굴 탈", "구름무늬 목제 패널", "아이 손바닥 인형", "대나무 숲 경판", "별자리 목제 지도", "붉은 말 장난감", "연꽃받침 목조각", "물결문 빗", "새벽 종소리 목패", "도토리 모양 합", "겨울새 목각상"],
      steps: [
        ["목리 조사", "갈라짐과 벌레 먹은 흔적, 이음부를 살펴보세요.", "magnifier", "제작 흔적과 진행성 손상을 구분해 기록합니다."],
        ["표면 정리", "박락을 피해 느슨한 먼지만 제거하세요.", "softBrush", "도구 자국과 남은 채색을 보존합니다."],
        ["환경 적응", "변형된 목재에 습도 변화가 급하지 않게 조절하세요.", "humidityPack", "직접 수분을 가하지 않고 완만한 환경을 만듭니다."],
        ["형태 지지", "현재 형태에 맞춰 무게를 여러 곳으로 나누세요.", "supportMount", "갈라짐을 강제로 닫지 않는 맞춤 받침을 사용합니다."]
      ]
    }
  ];

  function makeTargets(seed, stepIndex) {
    const patterns = [
      [[31, 35], [58, 42], [47, 69]],
      [[38, 29], [66, 51], [35, 72]],
      [[27, 54], [53, 34], [69, 68]],
      [[42, 39], [61, 63], [34, 62]],
      [[32, 43], [56, 55], [48, 76]]
    ];
    const base = patterns[(seed + stepIndex) % patterns.length];
    const jitter = ((seed * 7 + stepIndex * 3) % 7) - 3;
    return base.map((point, index) => [
      Math.max(22, Math.min(76, point[0] + (index === 1 ? -jitter : jitter))),
      Math.max(24, Math.min(79, point[1] + (index === 2 ? -jitter : jitter)))
    ]);
  }

  const artworks = [];
  for (let round = 0; round < 14; round += 1) {
    profiles.forEach((profile, profileIndex) => {
      const order = round * profiles.length + profileIndex;
      const lore = profileLore[profile.id];
      const hue = (order * 37 + profileIndex * 13) % 360;
      artworks.push({
        id: `${profile.id}-${String(round + 1).padStart(2, "0")}`,
        title: profile.titles[round],
        material: profile.material,
        rarity: rarities[(round + profileIndex) % rarities.length],
        unlockRep: 32 + Math.floor(order * 1.85),
        supplyCost: 90 + Math.floor(order * 2.1),
        rewardCoins: 245 + Math.floor(order * 4.7),
        rewardRep: 10 + Math.floor(order / 18),
        appeal: 38 + Math.floor(order * 1.25),
        colors: [`hsl(${hue} 76% 87%)`, `hsl(${(hue + 66) % 360} 58% 82%)`],
        accent: `hsl(${(hue + 318) % 360} 78% 66%)`,
        visual: profile.visual,
        variant: round,
        visualSeed: order * 17 + profileIndex * 29 + 11,
        motif: motifs[(order * 5 + profileIndex) % motifs.length],
        era: lore.eras[round % lore.eras.length],
        artist: `${lore.artistRole} ${artistNames[(round + profileIndex * 3) % artistNames.length]} (가상)`,
        artType: lore.artType,
        origin: lore.origin,
        culturalValue: lore.value,
        story: `${withTopicParticle(profile.titles[round])} ${lore.story}`,
        fictional: true,
        damage: profile.damage,
        summary: profile.summary,
        ethics: profile.ethics,
        steps: profile.steps.map((item, stepIndex) => ({
          name: item[0],
          instruction: item[1],
          tool: item[2],
          diagnosis: item[3],
          targets: makeTargets(order, stepIndex)
        }))
      });
    });
  }

  const catalogMaterialIds = {
    paper: [3,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,175,198,199,200],
    book: [145,146,147,168,169],
    mural: [2,6,7,18,151,152,153,164,165],
    textile: [143,144,150,167,194,195],
    stone: [105,106,107,108,109,110,111,112,114,115,121,122,123,124,126,127,128,129,130,131,135,156,157,172],
    metal: [116,117,118,119,120,132,133,134,136,138,139,141,142,158,160,170,171],
    ceramic: [125,154,161,162,163,166,173,174],
    contemporary: [113,137,140,155,183,185],
    wood: [159]
  };
  const catalogAssignedIds = new Set(Object.values(catalogMaterialIds).flat());
  catalogMaterialIds.painting = Array.from({ length: 200 }, (_, index) => index + 1)
    .filter(sourceId => !catalogAssignedIds.has(sourceId));

  const catalogHighlights = {
    14: { title: "우유빛 오후의 부엌", reference: "우유 따르는 여인", year: "17세기 네덜란드 회화 연구" },
    44: { title: "기울어진 작은 방", reference: "침실", year: "19세기 말 유럽 회화 연구" },
    80: { title: "푸른 파도 너머", reference: "가나가와 앞바다의 큰 파도", year: "19세기 목판화 연구" },
    99: { title: "마당의 한판", reference: "씨름", year: "조선 후기 풍속화 연구" },
    104: { title: "풀잎 사이 작은 친구들", reference: "초충도", year: "조선시대 채색화 연구" },
    105: { title: "잃어버린 팔의 여신", reference: "밀로의 비너스", year: "고대 지중해 조각 연구" },
    106: { title: "바람을 가르는 날개", reference: "사모트라케의 니케", year: "고대 지중해 조각 연구" },
    137: { title: "리본을 맨 작은 무희", reference: "14세의 작은 무희", year: "19세기 복합재 조각 연구" },
    144: { title: "정원의 흰 뿔짐승", reference: "유니콘 태피스트리", year: "15세기 말 태피스트리 연구" },
    145: { title: "별무늬의 오래된 책", reference: "켈스의 서 카이로 페이지", year: "중세 채색 필사본 연구" },
    170: { title: "미소 짓는 사유상", reference: "금동반가사유상", year: "삼국시대 금속공예 연구" },
    171: { title: "봉황이 쉬는 향로", reference: "백제금동대향로", year: "백제 금속공예 연구" },
    174: { title: "구름과 학의 푸른 병", reference: "청자 상감 운학문 매병", year: "고려청자 연구" },
    198: { title: "책과 보물의 방", reference: "책가도", year: "조선 후기 병풍 연구" }
  };
  const highRiskSourceIds = new Set([58,59,60,61,62,63,67,68,69,70,71,72,73,74,75,78,79,139,140,141,142,179,180,183,184,185,186]);
  const profileById = Object.fromEntries(profiles.map(profile => [profile.id, profile]));
  const sourceRows = Object.entries(catalogMaterialIds)
    .flatMap(([profileId, sourceIds]) => sourceIds.map(sourceId => ({ profileId, sourceId })))
    .filter(row => row.sourceId !== 173 && row.sourceId !== 199)
    .sort((a, b) => a.sourceId - b.sourceId);

  function buildExpansionArtwork(profile, expansionIndex, options = {}) {
    const lore = profileLore[profile.id];
    const order = artworks.length;
    const sourceId = options.sourceId || null;
    const highlight = sourceId ? catalogHighlights[sourceId] : null;
    const title = highlight?.title || (sourceId
      ? `${profile.titles[sourceId % profile.titles.length]} · ${motifs[sourceId % motifs.length]} ${rarities[sourceId % rarities.length]}`
      : `${profile.titles[(expansionIndex + 5) % profile.titles.length]} · ${motifs[(expansionIndex * 7) % motifs.length]} 아카이브 ${String(expansionIndex + 1).padStart(3, "0")}`);
    const hue = (order * 41 + expansionIndex * 17) % 360;
    const licenseLocked = Boolean(sourceId && highRiskSourceIds.has(sourceId));
    return {
      id: sourceId ? `catalog-${String(sourceId).padStart(3, "0")}` : `archive-${String(expansionIndex + 1).padStart(3, "0")}`,
      title,
      material: profile.material,
      rarity: licenseLocked ? "권리 검토 중" : sourceId ? "자료 기반 재해석" : "지역 기증 컬렉션",
      unlockRep: 390 + Math.floor(expansionIndex * 1.65),
      supplyCost: 130 + Math.floor(expansionIndex * 2.4),
      rewardCoins: 510 + Math.floor(expansionIndex * 5.2),
      rewardRep: 18 + Math.floor(expansionIndex / 22),
      appeal: 76 + Math.floor(expansionIndex * .9),
      colors: [`hsl(${hue} 74% 86%)`, `hsl(${(hue + 71) % 360} 62% 80%)`],
      accent: `hsl(${(hue + 321) % 360} 76% 62%)`,
      visual: profile.visual,
      variant: 14 + (expansionIndex % 28),
      visualSeed: 7001 + expansionIndex * 43 + (sourceId || 0),
      motif: motifs[(expansionIndex * 5 + (sourceId || 0)) % motifs.length],
      era: highlight?.year || lore.eras[(expansionIndex + 2) % lore.eras.length],
      artist: `${lore.artistRole} ${artistNames[(expansionIndex * 3 + 4) % artistNames.length]} (가상)`,
      artType: lore.artType,
      origin: sourceId ? "국제 보존 연구 교류 컬렉션" : "온별 시민 기증 자료실",
      culturalValue: `${lore.value} 원작의 구도나 형상을 복제하지 않고 재료와 보존 과제만 연구해 만든 게임용 창작품입니다.`,
      story: `${withTopicParticle(title)} ${lore.story}`,
      fictional: true,
      inspirationSourceIds: sourceId ? [sourceId] : [],
      sourceReference: highlight?.reference || (sourceId ? `첨부 카탈로그 연구 후보 #${sourceId}` : "지역 기증 기록"),
      catalogStatus: licenseLocked ? "rights-review" : sourceId ? "adapted" : "original",
      licenseLocked,
      damage: profile.damage,
      summary: profile.summary,
      ethics: profile.ethics,
      steps: profile.steps.map((item, stepIndex) => ({
        name: item[0],
        instruction: item[1],
        tool: item[2],
        diagnosis: item[3],
        targets: makeTargets(order, stepIndex)
      }))
    };
  }

  sourceRows.forEach((row, expansionIndex) => {
    artworks.push(buildExpansionArtwork(profileById[row.profileId], expansionIndex, { sourceId: row.sourceId }));
  });

  const originalExpansionCount = 102;
  for (let expansionIndex = 0; expansionIndex < originalExpansionCount; expansionIndex += 1) {
    const profile = profiles[(expansionIndex * 5 + 3) % profiles.length];
    artworks.push(buildExpansionArtwork(profile, sourceRows.length + expansionIndex));
  }

  window.RESTORATION_ARTWORKS = artworks;
})();
