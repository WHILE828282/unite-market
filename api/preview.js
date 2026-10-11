/* GET /api/preview?q=artist+title -> 30-second preview from Apple's public iTunes Search API (no key needed),
   plus the link to the full track on Apple Music. Cached for a day at the edge. */
export default async function handler(req, res) {
  const q = String((req.query && req.query.q) || "").trim().slice(0, 120);
  if (!q) return res.status(400).json({ ok: false });
  try {
    const url = `https://itunes.apple.com/search?${new URLSearchParams({ term: q, entity: "song", limit: "5", country: "AE" })}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const j = await r.json();
    const hit = (j.results || []).find((x) => x.previewUrl);
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
    if (!hit) return res.status(200).json({ ok: true, found: false });
    return res.status(200).json({ ok: true, found: true, preview: hit.previewUrl, open: hit.trackViewUrl || "", art: hit.artworkUrl100 || "" });
  } catch (e) {
    console.error("Preview lookup failed:", e && e.message);
    return res.status(200).json({ ok: false, found: false });
  }
}
