import type { Context } from "@netlify/functions";
import { createHash } from "node:crypto";

const PIXEL_ID = "1214324123910321";
const API_VERSION = "v21.0";
const GRAPH_URL = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`;

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function hashUserData(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!v || typeof v !== "string") continue;
    // email and phone get hashed; ip, ua, fbc, fbp pass through
    if (k === "em" || k === "ph") {
      out[k] = sha256(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export default async (req: Request, _ctx: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const token = Netlify.env.get("META_CAPI_TOKEN");
  if (!token) {
    return Response.json({ error: "META_CAPI_TOKEN not configured" }, { status: 500 });
  }

  let body: {
    event_name: string;
    event_id: string;
    user_data?: Record<string, unknown>;
    event_source_url?: string;
    action_source?: string;
  };

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.event_name || !body.event_id) {
    return Response.json({ error: "event_name and event_id required" }, { status: 400 });
  }

  const eventData: Record<string, unknown> = {
    event_name: body.event_name,
    event_time: Math.floor(Date.now() / 1000),
    event_id: body.event_id,
    event_source_url: body.event_source_url,
    action_source: body.action_source || "website",
    user_data: body.user_data ? hashUserData(body.user_data) : {},
  };

  const payload = {
    data: [eventData],
    access_token: token,
  };

  try {
    const res = await fetch(GRAPH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();

    if (!res.ok) {
      return Response.json({ error: result }, { status: res.status });
    }
    return Response.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 502 });
  }
};
