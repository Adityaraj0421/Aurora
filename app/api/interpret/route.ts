import { generateObject, jsonSchema } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// The provider is chosen from whichever key you set:
//   GEMINI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY -> Google Gemini (direct key)
//   otherwise                                     -> Claude via the Vercel AI Gateway
// Override the model id for the active provider with AURORA_MODEL.
const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
const google = geminiKey ? createGoogleGenerativeAI({ apiKey: geminiKey }) : null;

function resolveModel() {
  if (google) return google(process.env.AURORA_MODEL ?? "gemini-2.5-flash");
  return process.env.AURORA_MODEL ?? "anthropic/claude-haiku-4.5";
}

const CONTEXT_TAGS = [
  "Keep it close",
  "Bring friends",
  "Slow tomorrow down",
  "Something new",
] as const;

type Interpretation = {
  understood: string[];
  reasoning: string;
  contexts: string[];
  surfaceGift: boolean;
  surfaceHealth: boolean;
  headline: string;
};

const schema = jsonSchema<Interpretation>({
  type: "object",
  additionalProperties: false,
  properties: {
    understood: {
      type: "array",
      items: { type: "string" },
      description:
        "2-4 short phrases naming what you inferred — including implicit intent (mood, occasion, who it's for, how private). Not just words the member typed.",
    },
    reasoning: {
      type: "string",
      description: "One warm, concise sentence: what you reshaped and why, as Aurora would say it.",
    },
    contexts: {
      type: "array",
      items: { type: "string", enum: [...CONTEXT_TAGS] },
      description: "Which edit levers to apply. Empty is fine if nothing should change.",
    },
    surfaceGift: { type: "boolean" },
    surfaceHealth: { type: "boolean" },
    headline: { type: "string", description: "3-6 words, e.g. 'Aurora kept Friday private'." },
  },
  required: ["understood", "reasoning", "contexts", "surfaceGift", "surfaceHealth", "headline"],
});

const SYSTEM = `You are Aurora — a private lifestyle concierge for high-profile members. You are curating the London "inspiration" edit for a member named Aditya. His partner is Maya, and Maya's birthday is this Friday.

The current edit holds: a Soho dinner-and-late-music evening; a recovery + movement morning for tomorrow; a discovery set (a private after-hours Tate visit, Sunday lunch at The River Café, an overnight in Deal); and a shared countryside weekend in Bruton.

The member has just told you, in their own words, what to change. Interpret their INTENT — including what they imply but don't say (mood, occasion, who it is for, how private, how much effort). Then reshape the edit using only these levers:

- "Keep it close": fewer transfers, keep the evening in one neighbourhood, more intimate and private.
- "Bring friends": open the evening up to a group of four.
- "Slow tomorrow down": put recovery and longevity ahead of everything tomorrow.
- "Something new": introduce a less familiar, more adventurous option.

Also decide:
- surfaceGift: true if they reference a gift, present, celebration, anniversary, or Maya's birthday — or imply they want to do something for Maya.
- surfaceHealth: true if they mention tiredness, exhaustion, stress, a hard week, sleep, recovery, wellness, longevity, or wanting things gentler or slower.

Read implicitly. Examples: "brutal week" -> tired -> surfaceHealth + "Slow tomorrow down". "somewhere we won't be recognised" / "private" -> "Keep it close". "her birthday" -> surfaceGift. "make it feel special" without mentioning friends -> intimate, NOT a group.

In "understood", name the implicit reads you made (2-4 short phrases), not the literal words. In "reasoning", write ONE warm sentence, in Aurora's voice, on what you reshaped and why. Only include levers that genuinely fit.`;

type Payload = { prompt?: string };

export async function POST(request: Request) {
  let prompt = "";
  try {
    const body = (await request.json()) as Payload;
    prompt = body.prompt?.trim() ?? "";
    if (!prompt) {
      return Response.json({ error: "A prompt is required." }, { status: 400 });
    }

    const { object } = await generateObject({
      model: resolveModel(),
      schema,
      system: SYSTEM,
      prompt,
      temperature: 0.4,
    });

    // Never trust the model's enum: keep only levers the UI knows.
    const contexts = (object.contexts ?? []).filter((c): c is string =>
      (CONTEXT_TAGS as readonly string[]).includes(c),
    );

    return Response.json({ ...object, contexts, source: "model" });
  } catch (error) {
    // The client falls back to a local interpretation, so the demo never breaks.
    const message = error instanceof Error ? error.message : "Interpretation failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
