// ROUGE-1, ROUGE-2 and ROUGE-L, matching Google's `rouge-score` package
// (default tokenizer: lowercase, non-alphanumerics -> spaces, no stemming).

export type RougeScore = { precision: number; recall: number; f1: number };
export type RougeResult = { rouge1: RougeScore; rouge2: RougeScore; rougeL: RougeScore };

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function score(overlap: number, candTotal: number, refTotal: number): RougeScore {
  const precision = candTotal ? overlap / candTotal : 0;
  const recall = refTotal ? overlap / refTotal : 0;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  return { precision, recall, f1 };
}

function ngrams(tokens: string[], n: number): Map<string, number> {
  const counts = new Map<string, number>();
  for (let i = 0; i + n <= tokens.length; i++) {
    const key = tokens.slice(i, i + n).join(" ");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function rougeN(cand: string[], ref: string[], n: number): RougeScore {
  const c = ngrams(cand, n);
  const r = ngrams(ref, n);
  let overlap = 0;
  for (const [k, v] of c) overlap += Math.min(v, r.get(k) ?? 0);
  return score(overlap, Math.max(0, cand.length - n + 1), Math.max(0, ref.length - n + 1));
}

function lcsLength(a: string[], b: string[]): number {
  const prev = new Array<number>(b.length + 1).fill(0);
  const curr = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      curr[j] = a[i - 1] === b[j - 1] ? prev[j - 1]! + 1 : Math.max(prev[j]!, curr[j - 1]!);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j]!;
  }
  return prev[b.length]!;
}

export function computeRouge(candidate: string, reference: string): RougeResult {
  const cand = tokenize(candidate);
  const ref = tokenize(reference);
  return {
    rouge1: rougeN(cand, ref, 1),
    rouge2: rougeN(cand, ref, 2),
    rougeL: score(lcsLength(cand, ref), cand.length, ref.length),
  };
}
