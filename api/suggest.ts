/* -----------------------------------------------------------------------------
 * /api/suggest — Claude reply suggestions for the elder
 *
 * Why a serverless function: same reason as /api/tts. The Anthropic API key
 * must not enter the browser bundle. Vite is intentionally never told about
 * this variable (no `VITE_` prefix), so even an accidental
 * `import.meta.env.ANTHROPIC_API_KEY` resolves to `undefined`.
 *
 * Cost controls baked in here:
 *   - Hard input cap on `transcript` (300 chars).
 *   - `max_tokens` cap on the response.
 *   - Anthropic `cache_control: { type: "ephemeral" }` on the persona system
 *     prompt → first call seeds the cache, subsequent calls within ~5 min
 *     pay ~10% of the input cost on the cached portion.
 *   - Edge runtime + 10 s function timeout (vercel default for edge).
 *
 * Input  (JSON POST): { transcript, persona, partner?, emotion?, recentExchanges? }
 * Output (success):   { suggestions: [string, string, string] }
 * Output (error):     JSON with appropriate HTTP code.
 * ---------------------------------------------------------------------------*/

export const config = { runtime: "edge" };

const MAX_TRANSCRIPT = 300;
const MAX_OUTPUT_TOKENS = 300;
const MAX_EXCHANGES = 5;

interface PersonaInput {
  name?: string;
  age?: string;
  closestFamily?: string;
  familyTerms?: string;
  favoriteFoods?: string;
  frequentPlaces?: string;
  replyLength?: "short" | "detailed";
  jokes?: "yes" | "sometimes" | "no";
  commonQuestions?: string;
  desiredImpression?: string;
}

interface ExchangeInput {
  theyHeard?: string;
  heSaid?: string;
}

interface PartnerInput {
  name?: string;
  speechLevel?: "casual" | "polite";
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function buildSystemPrompt(persona: PersonaInput | undefined): string {
  // A persona-shaped block. Empty fields are silently omitted — the model
  // shouldn't see "name: undefined". Falls back to a generic-elder persona.
  const lines: string[] = [
    "You help a Korean elder who CANNOT SPEAK after a tongue resection.",
    "He communicates by tapping pre-written phrases or by choosing from suggested replies.",
    "Your job: given what the other person just said, suggest three short replies he might want to say back, in his voice.",
    "",
    "About this elder:",
  ];

  if (persona?.name) lines.push(`- Name (호칭): ${persona.name}`);
  if (persona?.age) lines.push(`- Age: ${persona.age}`);
  if (persona?.closestFamily)
    lines.push(`- Talks most often with: ${persona.closestFamily}`);
  if (persona?.familyTerms)
    lines.push(`- How he addresses family: ${persona.familyTerms}`);
  if (persona?.favoriteFoods)
    lines.push(`- Foods he loves: ${persona.favoriteFoods}`);
  if (persona?.frequentPlaces)
    lines.push(`- Places he spends time: ${persona.frequentPlaces}`);
  if (persona?.replyLength)
    lines.push(
      `- Prefers ${persona.replyLength === "short" ? "short, brief replies" : "longer, more detailed replies"}.`,
    );
  if (persona?.jokes)
    lines.push(
      `- Joking tone: ${
        persona.jokes === "yes"
          ? "likes jokes — feel free to include warm humor"
          : persona.jokes === "sometimes"
            ? "sometimes appreciates humor"
            : "prefers earnest, no jokes"
      }.`,
    );
  if (persona?.commonQuestions)
    lines.push(`- Questions he often hears: ${persona.commonQuestions}`);
  if (persona?.desiredImpression)
    lines.push(`- He wants to come across as: ${persona.desiredImpression}`);

  if (lines.length === 5) {
    // No persona fields supplied — keep the prompt useful with a fallback.
    lines.push(
      "- (No personal details provided yet — assume a 70s Korean man, dignified, warm, prefers short replies.)",
    );
  }

  lines.push(
    "",
    "Output strictly as JSON: { \"suggestions\": [\"...\", \"...\", \"...\"] }",
    "- Each suggestion: ONE short Korean sentence the elder might say (default ≤ 20 syllables).",
    "- Three suggestions should cover a range: a quick acknowledgement, a more substantive reply, an alternative angle.",
    "- Use 해요/합니다체 unless the persona suggests otherwise.",
    "- NEVER include explanations, markdown, or extra prose. Output ONLY the JSON object.",
  );
  return lines.join("\n");
}

function buildUserMessage(
  transcript: string,
  emotion: string | undefined,
  recent: ReadonlyArray<ExchangeInput>,
  partner: PartnerInput | undefined,
): string {
  const lines: string[] = [];

  // Who he is speaking to. Lives in the user message (not the cached system
  // prompt) because it changes per conversation. The speech-level line OVERRIDES
  // the system prompt's default 해요/합니다체.
  if (partner?.name || partner?.speechLevel) {
    if (partner.name) {
      lines.push(`He is speaking to: ${partner.name}.`);
    }
    if (partner.speechLevel === "casual") {
      lines.push(
        "Speak to this person in 반말 (informal, intimate Korean) — this is someone close like a grandchild or spouse.",
      );
    } else if (partner.speechLevel === "polite") {
      lines.push(
        "Speak to this person in 존댓말 (polite Korean) — e.g. a doctor, a neighbour, or a guest.",
      );
    }
    lines.push("");
  }

  if (recent.length > 0) {
    lines.push("Recent conversation (oldest first):");
    for (const x of recent) {
      if (x.theyHeard) lines.push(`Other: "${x.theyHeard}"`);
      if (x.heSaid) lines.push(`He: "${x.heSaid}"`);
    }
    lines.push("");
  }
  if (emotion && emotion !== "neutral") {
    lines.push(`Current mood the elder selected: ${emotion}`);
    lines.push("Reflect that mood subtly in the wording, not overtly.");
    lines.push("");
  }
  lines.push("The other person just said:");
  lines.push(`"${transcript}"`);

  // STT-punctuation disambiguation. Korean speech-to-text rarely emits "?"
  // even for clear questions, so a transcript like "밥 먹었어" can mean
  // either "I ate" (statement) or "Did you eat?" (question). We tell the
  // model how to handle each case explicitly.
  const trimmed = transcript.trim();
  const looksLikeQuestion = /[?？]\s*$/.test(trimmed);
  const looksLikeStatement = /[.!。．！]\s*$/.test(trimmed);

  lines.push("");
  if (looksLikeQuestion) {
    lines.push(
      "Punctuation note: this ends with '?', so treat it as a QUESTION. All three replies should answer it.",
    );
  } else if (looksLikeStatement) {
    lines.push(
      "Punctuation note: this ends with terminal punctuation, so treat it as a STATEMENT from the other person. Replies should react to it.",
    );
  } else {
    lines.push(
      "Punctuation note: speech-to-text dropped any final punctuation. This sentence may be EITHER a statement or a question (e.g. \"밥 먹었어\" could mean \"I ate\" OR \"Did you eat?\"). Make the three replies cover the most plausible interpretations — at least one assuming question, at least one assuming statement. Pick the third based on which reading feels more likely given the recent conversation context above.",
    );
  }

  lines.push("");
  lines.push("Suggest three replies in the JSON shape described.");
  return lines.join("\n");
}

interface ClaudeResponse {
  content?: Array<{ type: string; text?: string }>;
  stop_reason?: string;
}

function parseSuggestions(raw: string): string[] | null {
  // Try direct JSON parse first, then fall back to extracting the first JSON
  // object substring (handles stray prose despite the strict instruction).
  const tryParse = (s: string): string[] | null => {
    try {
      const obj = JSON.parse(s) as { suggestions?: unknown };
      if (Array.isArray(obj.suggestions)) {
        const arr = obj.suggestions
          .filter((x): x is string => typeof x === "string" && x.trim() !== "")
          .map((x) => x.trim());
        return arr.length > 0 ? arr.slice(0, 3) : null;
      }
    } catch {
      /* fall through */
    }
    return null;
  };

  const direct = tryParse(raw.trim());
  if (direct) return direct;

  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    const fromExtract = tryParse(match[0]);
    if (fromExtract) return fromExtract;
  }
  return null;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json(503, { error: "ai_not_configured" });

  let payload: {
    transcript?: unknown;
    persona?: unknown;
    partner?: unknown;
    emotion?: unknown;
    recentExchanges?: unknown;
  };
  try {
    payload = (await req.json()) as typeof payload;
  } catch {
    return json(400, { error: "invalid_json" });
  }

  const transcript =
    typeof payload.transcript === "string" ? payload.transcript.trim() : "";
  if (!transcript) return json(400, { error: "transcript_required" });
  if (transcript.length > MAX_TRANSCRIPT) {
    return json(413, { error: "transcript_too_long", max: MAX_TRANSCRIPT });
  }

  const persona: PersonaInput | undefined =
    payload.persona && typeof payload.persona === "object"
      ? (payload.persona as PersonaInput)
      : undefined;

  const partner: PartnerInput | undefined =
    payload.partner && typeof payload.partner === "object"
      ? (payload.partner as PartnerInput)
      : undefined;

  const emotion =
    typeof payload.emotion === "string" ? payload.emotion : undefined;

  const recentExchanges: ExchangeInput[] = Array.isArray(payload.recentExchanges)
    ? (payload.recentExchanges as ExchangeInput[])
        .slice(-MAX_EXCHANGES)
        .filter((x) => x && typeof x === "object")
    : [];

  const systemPrompt = buildSystemPrompt(persona);
  const userMessage = buildUserMessage(
    transcript,
    emotion,
    recentExchanges,
    partner,
  );

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: MAX_OUTPUT_TOKENS,
      // Prompt caching on the (stable) persona system prompt — subsequent
      // calls in the same ~5 min cache window pay a fraction of input cost.
      system: [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    return json(upstream.status, { error: "anthropic_failed", detail });
  }

  const data = (await upstream.json()) as ClaudeResponse;
  const text =
    data.content
      ?.filter((block) => block.type === "text")
      .map((b) => b.text ?? "")
      .join("") ?? "";

  const suggestions = parseSuggestions(text);
  if (!suggestions) {
    return json(502, { error: "bad_model_output", raw: text });
  }

  return json(200, { suggestions });
}
