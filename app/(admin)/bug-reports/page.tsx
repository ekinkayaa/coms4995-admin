"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";

type BugReport = {
  id: string;
  subject: string | null;
  message: string | null;
  created_datetime_utc: string | null;
  profiles: { email: string | null; first_name: string | null; last_name: string | null } | null;
};

export default function BugReportsPage() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("bug_reports")
        .select("id, subject, message, created_datetime_utc, profiles!profile_id(email, first_name, last_name)")
        .order("created_datetime_utc", { ascending: false });
      if (error) setError(error.message);
      else setReports((data ?? []) as unknown as BugReport[]);
      setLoading(false);
    })();
  }, []);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div style={{ padding: "36px 40px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111", margin: "0 0 6px", letterSpacing: "-0.01em" }}>
          Bug Reports
        </h1>
        <p style={{ fontSize: 14, color: "rgba(0,0,0,0.38)", margin: 0 }}>
          {loading ? "Loading…" : `${reports.length} report${reports.length !== 1 ? "s" : ""} submitted`}
        </p>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#991b1b" }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ padding: 48, textAlign: "center", color: "rgba(0,0,0,0.35)", fontSize: 14 }}>Loading…</div>
      )}

      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reports.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 14, padding: 48, textAlign: "center", color: "rgba(0,0,0,0.35)", fontSize: 14 }}>
              No bug reports yet.
            </div>
          ) : (
            reports.map((r) => {
              const profile = r.profiles as any;
              const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.email || "Unknown";
              const isOpen = expanded.has(r.id);
              return (
                <div key={r.id} style={{ background: "#fff", borderRadius: 12, padding: "20px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 3 }}>
                        {r.subject || <span style={{ color: "rgba(0,0,0,0.35)", fontWeight: 400 }}>No subject</span>}
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(0,0,0,0.38)" }}>
                        {name} · {r.created_datetime_utc ? new Date(r.created_datetime_utc).toLocaleString() : "—"}
                      </div>
                    </div>
                    <button
                      onClick={() => toggle(r.id)}
                      style={{
                        fontSize: 10, fontWeight: 700,
                        background: isOpen ? "#f0fdf4" : "#fef2f2",
                        color: isOpen ? "#16a34a" : "#dc2626",
                        padding: "4px 12px", borderRadius: 999,
                        letterSpacing: "0.06em", flexShrink: 0,
                        border: "none", cursor: "pointer",
                      }}
                    >
                      {isOpen ? "CLOSE" : "OPEN"}
                    </button>
                  </div>
                  {isOpen && r.message && (
                    <p style={{ fontSize: 13, color: "rgba(0,0,0,0.65)", margin: "14px 0 0", lineHeight: 1.6, whiteSpace: "pre-wrap", borderTop: "1px solid #f3f4f6", paddingTop: 14 }}>
                      {r.message}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
