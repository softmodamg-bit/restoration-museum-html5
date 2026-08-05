import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../js/artworks-data.js", import.meta.url), "utf8");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(source, context);

const artworks = context.window.RESTORATION_ARTWORKS;
const motifRules = [
  /달|별|은하|밤|천문|별자리|우주|해|햇살|노을|새벽|정오/,
  /꽃|연꽃|모란|매화|국화|동백|라일락|양귀비|해바라기|초충|화조|식물|약초/,
  /새(?!벽|끼)|학|봉황|기러기|두루미|물총새|갈매기|날개|화조/,
  /물|파도|바다|강|연못|항구|봄비|빗|폭포|수영|물결/,
  /산|숲|정원|들판|나무|소나무|대나무|풀잎|온실|밀밭/,
  /토끼|고양이|여우|사자|사슴|유니콘|뿔짐승|말|거북|물고기|나비|곤충|산양|새끼|동물/,
  /사람|아이|소녀|소년|여인|여신|무희|배우|가족|악사|산책|초상|씨름|한판|친구들/,
  /방|집|도시|골목|카페|극장|시장|학교|부엌|창가|건축|궁전|사진관|공방/,
  /음악|악보|노래|음표|악사|종소리|인형극/,
  /책|수첩|필사본|일지|도감|노트|기록|편지|지도|달력|대본|시집|화첩|병풍|족자/,
  /포도|복숭아|석류|오렌지|과일|씨앗|도토리/,
  /리본|나선|바람|시간|궤도|소음|숨결|무중력|색면|콜라주/
];

if (!Array.isArray(artworks) || artworks.length !== 496) {
  throw new Error(`확장 작품 데이터가 496개여야 합니다. 현재: ${artworks?.length ?? "없음"}`);
}

const visuals = new Set(artworks.map(artwork => artwork.visual));
if (visuals.size < 14) {
  throw new Error(`작품 기본 실루엣이 14종보다 적습니다. 현재: ${visuals.size}종`);
}

const matched = artworks.filter(artwork => motifRules.some(rule => rule.test(artwork.title)));
const coverage = matched.length / artworks.length;
if (coverage < 0.9) {
  throw new Error(`작품명 모티프 적용 범위가 90% 미만입니다. 현재: ${(coverage * 100).toFixed(1)}%`);
}

console.log(`작품 시각 검사 통과: 전체 500개(핵심 4 + 확장 ${artworks.length}), 기본 실루엣 ${visuals.size}종, 작품명 모티프 ${matched.length}/${artworks.length}개 (${(coverage * 100).toFixed(1)}%)`);
