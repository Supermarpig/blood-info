/**
 * 「捐血迷思大挑戰」題庫。
 *
 * 每題是一句常見說法，isTrue 代表這句話「本身」是否為真。
 * 數字全部對照現行 2025 新版《捐血者健康標準》（見 memory blood_donation_facts_2025_standard），
 * 避免像舊制數字（17歲/刺青6個月/拔牙72小時等）再度污染全站。
 */

export interface MythQuestion {
  id: string;
  statement: string;
  isTrue: boolean;
  explanation: string;
}

export const MYTH_QUESTIONS: MythQuestion[] = [
  {
    id: "weakness",
    statement: "捐血會讓身體變得虛弱、容易貧血。",
    isTrue: false,
    explanation:
      "一次捐血約 250–500 毫升，僅占健康成人總血量的 8–10%。血漿在 24–48 小時內就能補足，骨髓也會加速造血，健康成人捐血後不會出現明顯貧血。",
  },
  {
    id: "needle",
    statement: "捐血站用的針具和血袋都是無菌單次拋棄式，用完即丟。",
    isTrue: true,
    explanation:
      "台灣所有捐血站的採血針頭、血袋與管路全部是無菌單次拋棄式耗材，工作人員會在你面前當場拆封，用畢立即銷毀，絕不重複使用。",
  },
  {
    id: "infection",
    statement: "捐血可能會讓人感染愛滋病或肝炎。",
    isTrue: false,
    explanation:
      "感染是因為血液「流入」體內才可能發生，捐血是血液「流出」，加上全程使用全新無菌針具，捐血者根本沒有機會接觸他人血液，不存在感染風險。",
  },
  {
    id: "age",
    statement: "現在只要年滿 16 歲、附上法定代理人同意書，就可以捐血。",
    isTrue: true,
    explanation:
      "現行《捐血者健康標準》規定 16–65 歲皆可捐血，16、17 歲須檢附法定代理人同意書；未滿 17 歲僅能捐 250ml，並非舊制的滿 17 歲才行。",
  },
  {
    id: "interval",
    statement: "捐 500 毫升全血後，要間隔 3 個月才能再捐。",
    isTrue: true,
    explanation:
      "全血依捐血量不同：捐 250 毫升間隔 2 個月，捐 500 毫升間隔 3 個月即可再次捐血，不需要等到半年以上。",
  },
  {
    id: "tattoo",
    statement: "身上有刺青的人這輩子都不能捐血。",
    isTrue: false,
    explanation:
      "刺青或穿洞後只需暫緩 1 年（現行新制，不是舊制的 6 個月），並非永久禁止；滿 1 年後只要符合其他健康條件，仍可以恢復捐血。",
  },
  {
    id: "period",
    statement: "月經期間完全不能捐血。",
    isTrue: false,
    explanation:
      "生理期並非捐血的絕對禁忌，只要當下沒有不適、血紅素達到女性 12 g/dL 以上的標準，仍然可以捐血。",
  },
  {
    id: "otype",
    statement: "O 型血因為誰都能輸，所以血庫存量最不缺。",
    isTrue: false,
    explanation:
      "O 型是紅血球的萬用供血者，但台灣 O 型人口約占 44%、臨床用量也最大，供需壓力最大，反而是最常拉警報的血型。",
  },
  {
    id: "dental",
    statement: "拔牙後只要暫緩 7 天，就可以捐血。",
    isTrue: true,
    explanation: "洗牙、拔牙、根管治療或植牙後暫緩 7 天即可，比許多人以為的時間短很多。",
  },
  {
    id: "rest",
    statement: "捐血後要臥床休息一整天，當天不能有任何活動。",
    isTrue: false,
    explanation:
      "捐血後在休息區坐 10–15 分鐘、補充點心飲料即可離開；只要當天 24 小時內避免激烈運動或粗重勞動就好，不需要臥床一整天。",
  },
];

export type ScoreTier = {
  minCorrect: number;
  title: string;
  desc: string;
};

export const SCORE_TIERS: ScoreTier[] = [
  { minCorrect: 9, title: "捐血迷思破解達人", desc: "10 題幾乎全對，你懂的比大部分人都正確！" },
  { minCorrect: 7, title: "知識豐富", desc: "答對大部分，只差臨門一腳就是滿分。" },
  { minCorrect: 4, title: "半信半疑", desc: "有些迷思還是把你騙倒了，值得重新確認一次。" },
  { minCorrect: 0, title: "還有很多要破解", desc: "很多常見說法其實都是錯的，重新測一次會發現不少驚喜。" },
];

export function getScoreTier(correct: number): ScoreTier {
  return SCORE_TIERS.find((t) => correct >= t.minCorrect) ?? SCORE_TIERS[SCORE_TIERS.length - 1];
}
