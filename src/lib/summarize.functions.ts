import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { generateSummary } from "./summarize.server";

export const summarize = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        text: z.string().trim().min(1).max(100_000),
        length: z.enum(["short", "medium", "detailed"]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const summary = await generateSummary(data.text, data.length);
    return { summary };
  });
