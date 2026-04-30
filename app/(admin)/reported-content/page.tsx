import { createClient } from "@/lib/supabase-server";
import Link from "next/link";

export default async function ReportedContentPage() {
  const supabase = await createClient();

  const [captionsRes, imagesRes] = await Promise.all([
    supabase
      .from("reported_captions")
      .select("id, reason, created_datetime_utc, profile_id, caption_id, profiles!profile_id(email), captions!caption_id(content)")
      .order("created_datetime_utc", { ascending: false }),
    supabase
      .from("reported_images")
      .select("id, reason, created_datetime_utc, profile_id, image_id, profiles!profile_id(email), images!image_id(url)")
      .order("created_datetime_utc", { ascending: false }),
  ]);

  const reportedCaptions = (captionsRes.data ?? []) as any[];
  const reportedImages = (imagesRes.data ?? []) as any[];
  const total = reportedCaptions.length + reportedImages.length;

  const card = { background: "#fff", borderRadius: 14, overflow: "hidden" as const };
  const thStyle = { padding: "12px 16px", textAlign: "left" as const, fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const };
  const tdStyle = { padding: "12px 16px", fontSize: 13, color: "#111", verticalAlign: "top" as const };
  const emptyStyle = { padding: 40, textAlign: "center" as const, color: "rgba(0,0,0,0.35)", fontSize: 14 };

  return (
    <div style={{ padding: "36px 40px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111", margin: "0 0 6px", letterSpacing: "-0.01em" }}>
          Reported Content
        </h1>
        <p style={{ fontSize: 14, color: "rgba(0,0,0,0.38)", margin: 0 }}>
          {total} pending report{total !== 1 ? "s" : ""} · {reportedCaptions.length} caption{reportedCaptions.length !== 1 ? "s" : ""} · {reportedImages.length} image{reportedImages.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Reported Captions */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111", margin: "0 0 12px" }}>
        Reported Captions <span style={{ fontSize: 13, fontWeight: 400, color: "rgba(0,0,0,0.38)" }}>({reportedCaptions.length})</span>
      </h2>
      <div style={{ ...card, marginBottom: 32 }}>
        {reportedCaptions.length === 0 ? (
          <div style={emptyStyle}>No reported captions.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                <th style={thStyle}>Caption</th>
                <th style={thStyle}>Reported by</th>
                <th style={thStyle}>Reason</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {reportedCaptions.map((r: any, i: number) => (
                <tr key={r.id} style={{ borderBottom: i < reportedCaptions.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <td style={{ ...tdStyle, maxWidth: 300 }}>
                    <span style={{ fontSize: 13, color: "#111", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {(r.captions as any)?.content ?? r.caption_id}
                    </span>
                  </td>
                  <td style={tdStyle}>{(r.profiles as any)?.email ?? "—"}</td>
                  <td style={{ ...tdStyle, maxWidth: 200 }}>
                    <span style={{ fontSize: 12, color: "rgba(0,0,0,0.55)" }}>{r.reason ?? "—"}</span>
                  </td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" as const }}>
                    <span style={{ fontSize: 12, color: "rgba(0,0,0,0.35)" }}>
                      {r.created_datetime_utc ? new Date(r.created_datetime_utc).toLocaleDateString() : "—"}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <Link href={`/captions`} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#f9fafb", color: "#111", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                      View Caption
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Reported Images */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111", margin: "0 0 12px" }}>
        Reported Images <span style={{ fontSize: 13, fontWeight: 400, color: "rgba(0,0,0,0.38)" }}>({reportedImages.length})</span>
      </h2>
      <div style={card}>
        {reportedImages.length === 0 ? (
          <div style={emptyStyle}>No reported images.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                <th style={thStyle}>Image</th>
                <th style={thStyle}>Reported by</th>
                <th style={thStyle}>Reason</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {reportedImages.map((r: any, i: number) => (
                <tr key={r.id} style={{ borderBottom: i < reportedImages.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <td style={tdStyle}>
                    {(r.images as any)?.url ? (
                      <img src={(r.images as any).url} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }} />
                    ) : (
                      <div style={{ width: 56, height: 56, borderRadius: 8, background: "#f3f4f6" }} />
                    )}
                  </td>
                  <td style={tdStyle}>{(r.profiles as any)?.email ?? "—"}</td>
                  <td style={{ ...tdStyle, maxWidth: 200 }}>
                    <span style={{ fontSize: 12, color: "rgba(0,0,0,0.55)" }}>{r.reason ?? "—"}</span>
                  </td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" as const }}>
                    <span style={{ fontSize: 12, color: "rgba(0,0,0,0.35)" }}>
                      {r.created_datetime_utc ? new Date(r.created_datetime_utc).toLocaleDateString() : "—"}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <Link href={`/images`} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#f9fafb", color: "#111", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                      View Images
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
