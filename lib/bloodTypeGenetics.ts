/**
 * ABO / Rh 血型遺傳計算。
 *
 * 為什麼放 lib 而非元件內：計算是純函式、無副作用，server 端要用它產 metadata 與
 * 靜態內容（讓「O 型和 A 型會生出什麼血型」這類問題直接寫在 HTML 裡被爬到），
 * client 端計算機也要用同一份邏輯，避免兩邊算出不同答案。
 *
 * 遺傳學基礎：ABO 由三個對偶基因 A、B、O 決定，A/B 對 O 為顯性、A 與 B 共顯性。
 * 因此 A 型的基因型可能是 AA 或 AO，B 型可能是 BB 或 BO，AB 型只有 AB，O 型只有 OO。
 * 「父母表現型」無法唯一決定基因型，所以結果分成「一定可能」與「視基因型而定」兩級，
 * 不能只給一張是非表——這正是多數血型遺傳表講不清楚的地方。
 */

export type AboPhenotype = "A" | "B" | "O" | "AB";
export type AboGenotype = "AA" | "AO" | "BB" | "BO" | "AB" | "OO";
type Allele = "A" | "B" | "O";

export const ABO_PHENOTYPES: AboPhenotype[] = ["A", "B", "O", "AB"];

/** 各表現型對應的可能基因型 */
export const GENOTYPES_OF: Record<AboPhenotype, AboGenotype[]> = {
  A: ["AA", "AO"],
  B: ["BB", "BO"],
  AB: ["AB"],
  O: ["OO"],
};

function allelesOf(genotype: AboGenotype): [Allele, Allele] {
  return [genotype[0] as Allele, genotype[1] as Allele];
}

function phenotypeOf(a: Allele, b: Allele): AboPhenotype {
  const hasA = a === "A" || b === "A";
  const hasB = a === "B" || b === "B";
  if (hasA && hasB) return "AB";
  if (hasA) return "A";
  if (hasB) return "B";
  return "O";
}

/** 單一基因型組合的子女血型機率（分母固定為 4 種對偶基因組合） */
export function crossGenotypes(
  father: AboGenotype,
  mother: AboGenotype
): Record<AboPhenotype, number> {
  const result: Record<AboPhenotype, number> = { A: 0, B: 0, O: 0, AB: 0 };
  const [f1, f2] = allelesOf(father);
  const [m1, m2] = allelesOf(mother);
  for (const f of [f1, f2]) {
    for (const m of [m1, m2]) {
      result[phenotypeOf(f, m)] += 25;
    }
  }
  return result;
}

export interface GenotypeCombination {
  father: AboGenotype;
  mother: AboGenotype;
  probabilities: Record<AboPhenotype, number>;
}

export interface AboResult {
  /** 不論父母基因型為何都可能出現的血型 */
  always: AboPhenotype[];
  /** 只有在特定基因型組合下才可能出現的血型 */
  conditional: AboPhenotype[];
  /** 任何基因型組合都不可能出現的血型 */
  impossible: AboPhenotype[];
  /** 各基因型組合的細部機率，供進階展開 */
  combinations: GenotypeCombination[];
}

/** 由父母「表現型」推算子女可能血型 */
export function crossPhenotypes(
  father: AboPhenotype,
  mother: AboPhenotype
): AboResult {
  const combinations: GenotypeCombination[] = [];
  for (const f of GENOTYPES_OF[father]) {
    for (const m of GENOTYPES_OF[mother]) {
      combinations.push({ father: f, mother: m, probabilities: crossGenotypes(f, m) });
    }
  }

  const always: AboPhenotype[] = [];
  const conditional: AboPhenotype[] = [];
  const impossible: AboPhenotype[] = [];

  for (const p of ABO_PHENOTYPES) {
    const count = combinations.filter((c) => c.probabilities[p] > 0).length;
    if (count === combinations.length) always.push(p);
    else if (count > 0) conditional.push(p);
    else impossible.push(p);
  }

  return { always, conditional, impossible, combinations };
}

/* ---------------------------------- Rh ---------------------------------- */

export type RhPhenotype = "+" | "-";

export interface RhResult {
  /** 一定會是這個結果時填入；否則為 null 表示兩種都可能 */
  certain: RhPhenotype | null;
  /** Rh 陰性子女是否可能 */
  negativePossible: boolean;
  note: string;
}

/**
 * Rh(D) 以 D 顯性、d 隱性遺傳。Rh 陽性可能是 DD 或 Dd（帶因），Rh 陰性只有 dd。
 * 兩個 Rh 陽性的父母若都是 Dd，仍有 1/4 機率生出 Rh 陰性子女——這是最常被誤解的一點。
 */
export function crossRh(father: RhPhenotype, mother: RhPhenotype): RhResult {
  if (father === "-" && mother === "-") {
    return {
      certain: "-",
      negativePossible: true,
      note: "父母都是 Rh 陰性（dd），只能傳下 d，子女必定是 Rh 陰性。",
    };
  }
  if (father === "+" && mother === "+") {
    return {
      certain: null,
      negativePossible: true,
      note: "父母都是 Rh 陽性，但若兩人都是帶因的 Dd，仍有約 25% 機率生出 Rh 陰性子女。這是最常被誤解的一點。",
    };
  }
  return {
    certain: null,
    negativePossible: true,
    note: "一方 Rh 陽性、一方 Rh 陰性：若陽性方為 DD 則子女全為陽性；若為帶因的 Dd，則子女約有一半機率是 Rh 陰性。",
  };
}

/* ------------------------------ 輸血相容性 ------------------------------ */

/** 各血型的紅血球可捐給誰、可接受誰（僅列 ABO 主體，實際輸血仍須交叉配對） */
export const COMPATIBILITY: Record<
  AboPhenotype,
  { canGiveTo: AboPhenotype[]; canReceiveFrom: AboPhenotype[] }
> = {
  O: { canGiveTo: ["O", "A", "B", "AB"], canReceiveFrom: ["O"] },
  A: { canGiveTo: ["A", "AB"], canReceiveFrom: ["O", "A"] },
  B: { canGiveTo: ["B", "AB"], canReceiveFrom: ["O", "B"] },
  AB: { canGiveTo: ["AB"], canReceiveFrom: ["O", "A", "B", "AB"] },
};

/** 台灣 ABO 血型人口分布（依台灣血液基金會公布之概略比例） */
export const TAIWAN_DISTRIBUTION: Record<AboPhenotype, number> = {
  O: 44,
  A: 26,
  B: 24,
  AB: 6,
};
