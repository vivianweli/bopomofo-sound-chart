import { createHash, timingSafeEqual } from "node:crypto";

// A recording is named <bopomofo syllable><tone digit 0-5>.<ext>, e.g. ㄅㄚ2.mp3
const NAME = /^[ㄅ-ㄯ]{1,4}[0-5]\.(mp3|m4a|webm)$/;
const TYPES = { mp3: "audio/mpeg", m4a: "audio/mp4", webm: "audio/webm" };
const MAX_BYTES = 2 * 1024 * 1024;

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", ...headers } });

const digest = s => createHash("sha256").update(s).digest();

async function authorised(req) {
  const secret = process.env.RECORD_PASSWORD;
  if (!secret) return { ok: false, res: json({ error: "RECORD_PASSWORD is not set on the server" }, 503) };
  const given = req.headers.get("x-record-password") || "";
  if (timingSafeEqual(digest(given), digest(secret))) return { ok: true };
  await new Promise(r => setTimeout(r, 600)); // slow down guessing
  return { ok: false, res: json({ error: "Wrong password" }, 401) };
}

// Reading is public. Writing needs the password.
export async function handle(req, store) {
  const { pathname } = new URL(req.url);

  if (pathname === "/api/auth") {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
    const a = await authorised(req);
    return a.ok ? json({ ok: true }) : a.res;
  }

  const m = pathname.match(/^\/api\/sounds(?:\/(.+))?$/);
  if (!m) return json({ error: "Not found" }, 404);
  const name = m[1] && decodeURIComponent(m[1]);

  if (!name) {
    if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
    const { blobs } = await store.list();
    return json(blobs.map(b => b.key).sort(), 200, { "cache-control": "no-cache" });
  }
  if (!NAME.test(name)) return json({ error: "Invalid file name" }, 400);

  if (req.method === "GET") {
    const body = await store.get(name, { type: "arrayBuffer" });
    if (!body) return json({ error: "Not found" }, 404);
    return new Response(body, { headers: { "content-type": TYPES[name.split(".")[1]], "cache-control": "public, max-age=300" } });
  }

  if (req.method === "PUT" || req.method === "DELETE") {
    const a = await authorised(req);
    if (!a.ok) return a.res;
    if (req.method === "DELETE") { await store.delete(name); return json({ ok: true }); }
    const data = await req.arrayBuffer();
    if (!data.byteLength) return json({ error: "Empty file" }, 400);
    if (data.byteLength > MAX_BYTES) return json({ error: "File too large" }, 413);
    await store.set(name, data);
    return json({ ok: true, bytes: data.byteLength });
  }
  return json({ error: "Method not allowed" }, 405);
}
