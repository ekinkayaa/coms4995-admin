import { createClient } from "@/lib/supabase-server";

interface VoteRow {
  caption_id: string;
  vote_value: number;
  profile_id: string;
  captions: { content: string; humor_flavor_id: number | null } | null;
}

interface FlavorStat {
  id: number;
  slug: string;
  totalVotes: number;
  upvotes: number;
  downvotes: number;
  netScore: number;
  captionCount: number;
}

interface CaptionStat {
  id: string;
  content: string;
  upvotes: number;
  downvotes: number;
  netScore: number;
}

function StatCard({ label, value, sub, accent = "#111" }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "24px 28px", flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.38)", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontSize: 34, fontWeight: 800, color: accent, lineHeight: 1, letterSpacing: "-0.02em" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: "rgba(0,0,0,0.38)", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "24px 28px" }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111", margin: "0 0 20px", letterSpacing: "0.01em" }}>{title}</h2>
      {children}
    </div>
  );
}

export default async function RatingsPage() {
  const supabase = await createClient();

  const [votesRes, flavorsRes] = await Promise.all([
    supabase
      .from("caption_votes")
      .select("caption_id, vote_value, profile_id, captions(content, humor_flavor_id)"),
    supabase
      .from("humor_flavors")
      .select("id, slug")
      .order("slug"),
  ]);

  const votes = (votesRes.data ?? []) as unknown as VoteRow[];
  const flavors = (flavorsRes.data ?? []) as { id: number; slug: string }[];

  // ── Summary ────────────────────────────────────────────────────
  const total = votes.length;
  const upvotes = votes.filter((v) => v.vote_value > 0).length;
  const downvotes = votes.filter((v) => v.vote_value < 0).length;
  const uniqueRaters = new Set(votes.map((v) => v.profile_id)).size;
  const uniqueCaptions = new Set(votes.map((v) => v.caption_id)).size;
  const upvotePct = total === 0 ? 0 : Math.round((upvotes / total) * 100);

  // ── Per-flavor ─────────────────────────────────────────────────
  const flavorMap = new Map<number, { up: number; down: number; captions: Set<string> }>();
  votes.forEach((v) => {
    const fid = v.captions?.humor_flavor_id;
    if (!fid) return;
    if (!flavorMap.has(fid)) flavorMap.set(fid, { up: 0, down: 0, captions: new Set() });
    const e = flavorMap.get(fid)!;
    if (v.vote_value > 0) e.up++; else if (v.vote_value < 0) e.down++;
    e.captions.add(v.caption_id);
  });

  const flavorStats: FlavorStat[] = flavors
    .map((f) => {
      const e = flavorMap.get(f.id);
      return { id: f.id, slug: f.slug, totalVotes: (e?.up ?? 0) + (e?.down ?? 0), upvotes: e?.up ?? 0, downvotes: e?.down ?? 0, netScore: (e?.up ?? 0) - (e?.down ?? 0), captionCount: e?.captions.size ?? 0 };
    })
    .filter((f) => f.totalVotes > 0)
    .sort((a, b) => b.totalVotes - a.totalVotes);

  // ── Per-caption ────────────────────────────────────────────────
  const captionMap = new Map<string, { content: string; up: number; down: number }>();
  votes.forEach((v) => {
    if (!v.captions?.content) return;
    if (!captionMap.has(v.caption_id)) captionMap.set(v.caption_id, { content: v.captions.content, up: 0, down: 0 });
    const e = captionMap.get(v.caption_id)!;
    if (v.vote_value > 0) e.up++; else if (v.vote_value < 0) e.down++;
  });

  const captionStats: CaptionStat[] = [...captionMap.entries()].map(([id, e]) => ({
    id, content: e.content, upvotes: e.up, downvotes: e.down, netScore: e.up - e.down,
  }));

  const topCaptions = [...captionStats].sort((a, b) => b.netScore - a.netScore).slice(0, 10);
  const bottomCaptions = [...captionStats].sort((a, b) => a.netScore - b.netScore).slice(0, 10);

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1200 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111", margin: "0 0 6px", letterSpacing: "-0.01em" }}>
          Caption Ratings
        </h1>
        <p style={{ fontSize: 14, color: "rgba(0,0,0,0.38)", margin: 0 }}>
          Statistics from all user votes in the rating app.
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
        <StatCard label="Total Votes" value={total.toLocaleString()} />
        <StatCard label="Upvotes" value={upvotes.toLocaleString()} sub={`${upvotePct}% of votes`} accent="#16a34a" />
        <StatCard label="Downvotes" value={downvotes.toLocaleString()} sub={`${100 - upvotePct}% of votes`} accent="#dc2626" />
        <StatCard label="Unique Raters" value={uniqueRaters.toLocaleString()} sub="Distinct users" />
        <StatCard label="Captions Rated" value={uniqueCaptions.toLocaleString()} sub="Distinct captions" />
      </div>

      {/* Sentiment bar */}
      {total > 0 && (
        <div style={{ background: "#fff", borderRadius: 14, padding: "20px 28px", marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>Vote Sentiment</span>
            <span style={{ fontSize: 12, color: "rgba(0,0,0,0.38)" }}>{upvotes.toLocaleString()} upvotes · {downvotes.toLocaleString()} downvotes</span>
          </div>
          <div style={{ height: 10, borderRadius: 999, background: "#f3f4f6", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${upvotePct}%`, background: "linear-gradient(90deg,#16a34a,#4ade80)", borderRadius: 999 }} />
          </div>
        </div>
      )}

      {/* Top / Bottom captions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
        <Card title="👍 Top-Rated Captions">
          {topCaptions.length === 0 ? (
            <p style={{ color: "rgba(0,0,0,0.35)", fontSize: 13 }}>No votes yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {topCaptions.map((c, i) => (
                <div key={c.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: i < topCaptions.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(0,0,0,0.2)", width: 20, flexShrink: 0, paddingTop: 1 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111", lineHeight: 1.45, marginBottom: 3 }}>
                      {c.content.slice(0, 90)}{c.content.length > 90 ? "…" : ""}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(0,0,0,0.35)" }}>
                      <span style={{ color: "#16a34a", fontWeight: 700 }}>+{c.upvotes}</span>
                      {" / "}
                      <span style={{ color: "#dc2626", fontWeight: 700 }}>−{c.downvotes}</span>
                      {" · net "}
                      <span style={{ fontWeight: 700, color: c.netScore >= 0 ? "#16a34a" : "#dc2626" }}>
                        {c.netScore > 0 ? "+" : ""}{c.netScore}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="👎 Lowest-Rated Captions">
          {bottomCaptions.length === 0 ? (
            <p style={{ color: "rgba(0,0,0,0.35)", fontSize: 13 }}>No votes yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {bottomCaptions.map((c, i) => (
                <div key={c.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: i < bottomCaptions.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(0,0,0,0.2)", width: 20, flexShrink: 0, paddingTop: 1 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111", lineHeight: 1.45, marginBottom: 3 }}>
                      {c.content.slice(0, 90)}{c.content.length > 90 ? "…" : ""}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(0,0,0,0.35)" }}>
                      <span style={{ color: "#16a34a", fontWeight: 700 }}>+{c.upvotes}</span>
                      {" / "}
                      <span style={{ color: "#dc2626", fontWeight: 700 }}>−{c.downvotes}</span>
                      {" · net "}
                      <span style={{ fontWeight: 700, color: c.netScore >= 0 ? "#16a34a" : "#dc2626" }}>
                        {c.netScore > 0 ? "+" : ""}{c.netScore}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Per-flavor table */}
      {flavorStats.length > 0 && (
        <Card title="Votes by Humor Flavor">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Flavor", "Captions Rated", "Upvotes", "Downvotes", "Net Score", "Total Votes"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "6px 12px", fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.38)", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" as const, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flavorStats.map((f, i) => (
                  <tr key={f.id} style={{ background: i % 2 === 0 ? "transparent" : "#fafafa" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#111" }}>{f.slug}</td>
                    <td style={{ padding: "10px 12px", color: "rgba(0,0,0,0.55)" }}>{f.captionCount}</td>
                    <td style={{ padding: "10px 12px", color: "#16a34a", fontWeight: 600 }}>+{f.upvotes}</td>
                    <td style={{ padding: "10px 12px", color: "#dc2626", fontWeight: 600 }}>−{f.downvotes}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: f.netScore >= 0 ? "#16a34a" : "#dc2626" }}>
                      {f.netScore > 0 ? "+" : ""}{f.netScore}
                    </td>
                    <td style={{ padding: "10px 12px", color: "rgba(0,0,0,0.55)" }}>{f.totalVotes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
