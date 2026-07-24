import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { requests } from "../../../db/schema";

type RequestPayload = {
  title?: string;
  guests?: string;
  note?: string;
  plan?: Array<{
    time: string;
    title: string;
    detail: string;
    state: "checked" | "request" | "dependent";
  }>;
};

function routeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  if (message.includes("no such table") || message.includes("requests")) {
    return "The request timeline is being prepared. Please try again shortly.";
  }
  return message;
}

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db.select().from(requests).orderBy(desc(requests.submittedAt), desc(requests.id)).limit(12);
    return Response.json({ requests: rows });
  } catch (error) {
    return Response.json({ error: routeError(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as RequestPayload;
    const title = payload.title?.trim() ?? "";
    const plan = payload.plan ?? [];

    if (!title || plan.length === 0) {
      return Response.json({ error: "A title and itinerary are required." }, { status: 400 });
    }

    const reference = `AUR-${Date.now().toString().slice(-6)}`;
    const db = await getDb();
    const [created] = await db
      .insert(requests)
      .values({
        reference,
        title,
        guests: payload.guests?.trim() || "Aditya + Maya",
        note: payload.note?.trim() || "",
        planJson: JSON.stringify(plan),
      })
      .returning();

    return Response.json({ request: created }, { status: 201 });
  } catch (error) {
    return Response.json({ error: routeError(error) }, { status: 500 });
  }
}
