<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules

- AI summarization runs through the Lovable AI Gateway (`openai/gpt-6-astra` on `/v1/responses`) inside `src/lib/summarize.server.ts`; the system prompt must go in the `instructions` option (not a system message) and the run-ID fetch helper lives in `src/lib/ai/run-id.server.ts`. Why: the AI SDK's Responses transport rejects system messages, and gateway run-ID correlation keeps request logs grouped.
- Server functions are declared in `src/lib/*.functions.ts` (client-importable) and hold their secrets/gateway helpers in `src/lib/*.server.ts` (import-protected). Why: client bundles must never pull server-only modules.
