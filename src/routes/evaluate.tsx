import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { summarize } from "@/lib/summarize.functions";
import { computeRouge, type RougeResult } from "@/lib/rouge";

export const Route = createFileRoute("/evaluate")({
  head: () => ({
    meta: [
      { title: "ROUGE Evaluator — Squish" },
      {
        name: "description",
        content:
          "Score a summary against a human reference with ROUGE-1, ROUGE-2 and ROUGE-L precision, recall and F1.",
      },
      { property: "og:title", content: "ROUGE Evaluator — Squish" },
      {
        property: "og:description",
        content: "Compare generated summaries to human references using ROUGE scores.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Evaluate,
});

const SAMPLE_SOURCE = `The quarterly report highlights a 14% increase in recurring revenue, driven largely by the launch of the automated onboarding flow. Customer retention improved to 92%, up from 87% the prior quarter, with the largest gains among self-serve accounts. Support ticket volume fell by a third after the new help center shipped, and the engineering team delivered 41 features across three releases. The biggest friction point remains billing: several users could not find their invoice history, so the team plans to surface a direct link in the account menu.`;
const SAMPLE_REFERENCE = `Recurring revenue rose 14% thanks to automated onboarding, retention climbed to 92%, and support tickets dropped by a third. Billing remains the main pain point, so the team will add a direct invoice link to the account menu.`;
const SAMPLE_CANDIDATE = `Recurring revenue grew 14% due to the automated onboarding flow, and retention improved to 92%. Support tickets fell by a third. Billing is still the biggest friction point, so a direct invoice link will be added to the account menu.`;

const ROWS: { key: keyof RougeResult; label: string; hint: string }[] = [
  { key: "rouge1", label: "ROUGE-1", hint: "Single-word overlap" },
  { key: "rouge2", label: "ROUGE-2", hint: "Two-word phrase overlap" },
  { key: "rougeL", label: "ROUGE-L", hint: "Longest common word sequence" },
];

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function Evaluate() {
  const runSummarize = useServerFn(summarize);
  const [source, setSource] = useState("");
  const [candidate, setCandidate] = useState("");
  const [reference, setReference] = useState("");
  const [result, setResult] = useState<RougeResult | null>(null);

  const gen = useMutation({
    mutationFn: async () =>
      (await runSummarize({ data: { text: source.trim(), length: "short" } })).summary,
    onSuccess: (s) => {
      setCandidate(s);
      setResult(null);
    },
  });

  const canScore = candidate.trim() && reference.trim();

  const field =
    "w-full resize-none rounded-2xl border-2 border-input bg-secondary p-4 text-sm leading-relaxed focus:border-brand focus:outline-none";
  const label =
    "mb-2 block text-xs font-semibold tracking-[0.12em] text-foreground/40 uppercase";

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-brand font-display text-xl font-bold text-primary-foreground">
            S
          </div>
          <span className="font-display text-2xl font-bold tracking-tight">Squish</span>
        </Link>
        <div className="flex items-center gap-8 text-sm font-medium text-foreground/70">
          <Link to="/" className="hover:text-foreground">Summarize</Link>
          <Link to="/evaluate" className="text-foreground">Evaluate</Link>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 pt-6 pb-20">
        <span className="inline-block rounded-full bg-butter px-4 py-2 font-display text-xs font-semibold tracking-[0.15em] text-accent-foreground uppercase">
          ROUGE scores
        </span>
        <h1 className="mt-5 font-display text-5xl font-bold tracking-tight sm:text-6xl">
          How good is that <span className="text-brand">summary</span>?
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Compare a generated summary against a human-written reference. We compute ROUGE-1,
          ROUGE-2 and ROUGE-L precision, recall and F1.
        </p>

        <div className="mt-8 rounded-[2rem] border-2 border-border bg-card p-6 shadow-card sm:p-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <span className="font-display text-sm font-semibold">Inputs</span>
            <button
              onClick={() => {
                setSource(SAMPLE_SOURCE);
                setReference(SAMPLE_REFERENCE);
                setCandidate(SAMPLE_CANDIDATE);
                setResult(null);
              }}
              className="rounded-full border-2 border-border px-4 py-1.5 text-xs font-semibold"
            >
              Load example
            </button>
          </div>

          <label htmlFor="src" className={label}>Original text (optional — to generate a summary)</label>
          <textarea id="src" value={source} onChange={(e) => setSource(e.target.value)} className={`${field} h-28`} placeholder="Paste the source text…" />
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => gen.mutate()}
              disabled={!source.trim() || gen.isPending}
              className="rounded-full bg-teal px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {gen.isPending ? "Generating…" : "Generate summary with Squish"}
            </button>
            {gen.isError && <span className="text-xs text-destructive">Couldn't generate — try again.</span>}
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="cand" className={label}>Generated summary (candidate)</label>
              <textarea id="cand" value={candidate} onChange={(e) => { setCandidate(e.target.value); setResult(null); }} className={`${field} h-40`} placeholder="Summary produced by a model or extractor…" />
            </div>
            <div>
              <label htmlFor="ref" className={label}>Human reference summary</label>
              <textarea id="ref" value={reference} onChange={(e) => { setReference(e.target.value); setResult(null); }} className={`${field} h-40`} placeholder="Gold-standard summary written by a person…" />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setResult(computeRouge(candidate, reference))}
              disabled={!canScore}
              className="rounded-full bg-brand px-7 py-3 font-display font-semibold text-primary-foreground shadow-pop-sm transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              Compute ROUGE
            </button>
          </div>

          {result && (
            <div className="mt-6 overflow-hidden rounded-2xl bg-ink p-5 text-cream">
              <table className="w-full text-left text-sm tabular-nums">
                <thead>
                  <tr className="text-xs tracking-[0.12em] text-cream/50 uppercase">
                    <th className="pb-3 font-semibold">Metric</th>
                    <th className="pb-3 font-semibold">Precision</th>
                    <th className="pb-3 font-semibold">Recall</th>
                    <th className="pb-3 font-semibold">F1</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((r) => {
                    const s = result[r.key];
                    return (
                      <tr key={r.key} className="border-t border-cream/15">
                        <td className="py-3">
                          <div className="font-display font-semibold">{r.label}</div>
                          <div className="text-xs text-cream/50">{r.hint}</div>
                        </td>
                        <td className="py-3">{pct(s.precision)}</td>
                        <td className="py-3">{pct(s.recall)}</td>
                        <td className="py-3">
                          <div className="font-semibold text-butter">{pct(s.f1)}</div>
                          <div className="mt-1 h-1.5 w-24 rounded-full bg-cream/15">
                            <div className="h-full rounded-full bg-butter" style={{ width: pct(s.f1) }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="mt-4 border-t border-cream/15 pt-3 text-xs text-cream/50">
                Precision = overlap ÷ candidate size · Recall = overlap ÷ reference size · F1 =
                harmonic mean. Text is lowercased and punctuation removed, like Python's rouge-score.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
