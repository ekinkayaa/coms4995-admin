import { createClient } from "@/lib/supabase-server";

export default async function BugReportsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bug_reports")
    .select("id, subject, message, created_datetime_utc, profile_id, profiles!profile_id(email, first_name, last_name)")
    .order("created_datetime_utc", { ascending: false });

  const reports = (data ?? []) as any[];

  return (
    <div style={{ padding: "36px 40px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111", margin: "0 0 6px", letterSpacing: "-0.01em" }}>
          Bug Reports
        </h1>
        <p style={{ fontSize: 14, color: "rgba(0,0,0,0.38)", margin: 0 }}>
          {reports.length} report{reports.length !== 1 ? "s" : ""} submitted
        </p>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#991b1b" }}>
          {error.message}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {reports.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 14, padding: 48, textAlign: "center", color: "rgba(0,0,0,0.35)", fontSize: 14 }}>
            No bug reports yet.
          </div>
        ) : (
          reports.map((r: any) => {
            const profile = r.profiles as any;
            const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.email || "Unknown";
            return (
              <div key={r.id} style={{ background: "#fff", borderRadius: 12, padding: "20px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 3 }}>
                      {r.subject || <span style={{ color: "rgba(0,0,0,0.35)", fontWeight: 400 }}>No subject</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(0,0,0,0.38)" }}>
                      {name} · {r.created_datetime_utc ? new Date(r.created_datetime_utc).toLocaleString() : "—"}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, background: "#fef2f2", color: "#dc2626", padding: "3px 10px", borderRadius: 999, letterSpacing: "0.06em", flexShrink: 0 }}>
                    OPEN
                  </span>
                </div>
                {r.message && (
                  <p style={{ fontSize: 13, color: "rgba(0,0,0,0.65)", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {r.message}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
