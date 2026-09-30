import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";

import { summarize } from "@/lib/summarize.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Squish — Make long text short and sweet" },
      {
        name: "description",
        content:
          "Paste any article, email, or wall of words and get a clear summary in seconds. Choose short, medium, or long.",
      },
      { property: "og:title", content: "Squish — Make long text short and sweet" },
      {
        property: "og:description",
        content: "Paste long text, pick a length, and get a clear summary in seconds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Length = "short" | "medium" | "detailed";

const LENGTHS: { value: Length; label: string }[] = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "detailed", label: "Long" },
];

const SAMPLE_TEXT = `The quarterly report highlights a 14% increase in recurring revenue, driven largely by the launch of the automated onboarding flow. Customer retention improved to 92%, up from 87% the prior quarter, with the largest gains among self-serve accounts. Support ticket volume fell by a third after the new help center shipped, and the engineering team delivered 41 features across three releases. The biggest friction point remains billing: several users could not find their invoice history, so the team plans to surface a direct link in the account menu and clarify the pricing page. Next quarter, the focus shifts to testing a shorter welcome email sequence, on the hypothesis that fewer, sharper messages will lift day-three retention for new sign-ups.`;

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function Index() {
  const runSummarize = useServerFn(summarize);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [length, setLength] = useState<Length>("medium");
  const [summary, setSummary] = useState("");
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await runSummarize({ data: { text: text.trim(), length } });
      return result.summary;
    },
    onSuccess: (result) => {
      setSummary(result);
      setCopied(false);
    },
  });

  const handleSummarize = () => {
    if (!text.trim() || mutation.isPending) return;
    mutation.mutate();
  };

  const handleCopy = async () => {
    if (!summary) return;
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const scrollToTool = () => {
    textareaRef.current?.focus();
    textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-brand font-display text-xl font-bold text-primary-foreground">
            S
          </div>
          <span className="font-display text-2xl font-bold tracking-tight">Squish</span>
        </div>
        <div className="flex items-center gap-8 text-sm font-medium text-foreground/70">
          <a href="#how-it-works" className="transition-colors hover:text-foreground">
            How it works
          </a>
          <Link to="/evaluate" className="transition-colors hover:text-foreground">
            Evaluate (ROUGE)
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-8 pb-16">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <span className="inline-block rounded-full bg-butter px-4 py-2 font-display text-xs font-semibold tracking-[0.15em] text-accent-foreground uppercase">
              Paste. Squish. Done.
            </span>
            <h1 className="mt-6 font-display text-6xl leading-[0.95] font-bold tracking-tight sm:text-7xl">
              Make long text <span className="text-brand">short</span> and sweet.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
              Drop in a wall of words and Squish squeezes out the parts that actually matter. No
              sign-up, no fuss.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={scrollToTool}
                className="rounded-full bg-brand px-8 py-4 font-display text-lg font-semibold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5"
              >
                Try it free
              </button>
              <button
                onClick={() => {
                  setText(SAMPLE_TEXT);
                  scrollToTool();
                }}
                className="rounded-full border-2 border-border bg-card px-8 py-4 font-display text-lg font-semibold text-foreground"
              >
                See examples
              </button>
            </div>
          </div>

          {/* App card */}
          <div className="lg:col-span-7">
            <div className="rounded-[2rem] border-2 border-border bg-card p-6 shadow-card sm:p-8">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-sm font-semibold">New summary</span>
                <span className="rounded-full bg-teal/15 px-3 py-1 text-xs font-medium text-teal">
                  ~12s to summarize
                </span>
              </div>

              <label
                htmlFor="squish-input"
                className="mb-2 block text-xs font-semibold tracking-[0.12em] text-foreground/40 uppercase"
              >
                Your text
              </label>
              <textarea
                id="squish-input"
                ref={textareaRef}
                value={text}
                onChange={(event) => setText(event.target.value)}
                className="h-32 w-full resize-none rounded-2xl border-2 border-input bg-secondary p-4 text-sm leading-relaxed focus:border-brand focus:outline-none"
                placeholder="Paste your article, email, or notes here…"
              />

              <div className="mt-5 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold tracking-[0.12em] text-foreground/40 uppercase">
                    Length
                  </span>
                  <div className="flex rounded-full bg-secondary p-1">
                    {LENGTHS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setLength(option.value)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                          length === option.value
                            ? "bg-ink text-primary-foreground"
                            : "text-foreground/50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <span className="text-xs tabular-nums text-foreground/40">
                    {countWords(text)} words
                  </span>
                  <button
                    onClick={handleSummarize}
                    disabled={!text.trim() || mutation.isPending}
                    className="rounded-full bg-brand px-7 py-3 font-display font-semibold text-primary-foreground shadow-pop-sm transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0"
                  >
                    {mutation.isPending ? "Squishing…" : "Squish it"}
                  </button>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-ink p-5 text-cream">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-butter" />
                    <span className="text-xs font-semibold tracking-[0.12em] text-cream/60 uppercase">
                      Summary
                    </span>
                  </div>
                  {mutation.isError && (
                    <span className="text-xs font-medium text-cream/80">
                      Something went wrong — try again.
                    </span>
                  )}
                </div>
                {mutation.isPending ? (
                  <p className="text-base leading-relaxed text-cream/70">
                    Squeezing out the important bits<span className="animate-pulse">…</span>
                  </p>
                ) : mutation.isError ? (
                  <p className="text-base leading-relaxed text-cream/70">
                    We couldn't summarize that. Check your connection and give it another go — your
                    text is still safe in the box.
                  </p>
                ) : summary ? (
                  <>
                    <p className="text-base leading-relaxed whitespace-pre-line">{summary}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-cream/15 pt-3">
                      <span className="text-xs tabular-nums text-cream/50">
                        {countWords(summary)} words · saves{" "}
                        {Math.max(
                          0,
                          Math.round(
                            (1 - countWords(summary) / Math.max(1, countWords(text))) * 100,
                          ),
                        )}
                        % shorter
                      </span>
                      <button
                        onClick={handleCopy}
                        className="rounded-full bg-cream/10 px-4 py-1.5 text-xs font-semibold text-cream transition-colors hover:bg-cream/20"
                      >
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-base leading-relaxed text-cream/50">
                    Your summary will appear here. Paste something above and hit "Squish it".
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="rounded-3xl border-2 border-border bg-card p-7">
            <div className="grid size-12 place-items-center rounded-2xl bg-butter font-display text-xl font-bold">
              1
            </div>
            <h3 className="mt-5 font-display text-xl font-semibold">Paste anything</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Articles, emails, transcripts — dump it all in the box.
            </p>
          </div>
          <div className="rounded-3xl border-2 border-border bg-card p-7">
            <div className="grid size-12 place-items-center rounded-2xl bg-teal font-display text-xl font-bold text-primary-foreground">
              2
            </div>
            <h3 className="mt-5 font-display text-xl font-semibold">Pick a length</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Short, medium, or long — you control how much to keep.
            </p>
          </div>
          <div className="rounded-3xl border-2 border-border bg-card p-7">
            <div className="grid size-12 place-items-center rounded-2xl bg-brand font-display text-xl font-bold text-primary-foreground">
              3
            </div>
            <h3 className="mt-5 font-display text-xl font-semibold">Copy the result</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Grab a clean summary in one tap and share it anywhere.
            </p>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 pb-10 text-sm text-foreground/40">
        <span className="font-display font-semibold text-foreground/60">Squish</span>
        <span>Made for busy readers.</span>
      </footer>
    </div>
  );
}
