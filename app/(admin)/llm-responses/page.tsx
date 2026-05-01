"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";

type Row = Record<string, unknown>;

function formatVal(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "object") return JSON.stringify(v);
  const s = String(v);
  if (s.match(/^\d{4}-\d{2}-\d{2}T/)) return new Date(s).toLocaleDateString();
  return s.length > 100 ? s.slice(0, 100) + "…" : s;
}

export default function LlmResponsesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [cols, setCols] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const supabase = createClient();

  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data, error }, { count }] = await Promise.all([
        supabase.from("llm_model_responses").select("*").order("id", { ascending: false }).limit(200),
        supabase.from("llm_model_responses").select("*", { count: "exact", head: true }),
      ]);
      if (error) setError(error.message);
      else {
        setRows(data ?? []);
        if (data && data.length > 0) setCols(Object.keys(data[0]));
      }
      setTotal(count ?? null);
      setLoading(false);
    })();
  }, []);

  const filtered = rows.filter((r) =>
    !search || Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ padding: "36px 40px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 6px", letterSpacing: "-0.01em" }}>LLM Call Log</h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 2px" }}>
            {total !== null ? `${total.toLocaleString()} total` : `${rows.length}`} response{(total ?? rows.length) !== 1 ? "s" : ""}
            {total !== null && rows.length < total ? ` · showing latest ${rows.length}` : ""}
          </p>
          <p style={{ fontSize: 12, color: "rgba(0,0,0,0.28)", margin: 0 }}>Raw log of every LLM API call made by the caption generation pipeline</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, outline: "none", width: 220, background: "var(--bg-card)" }}
        />
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#991b1b" }}>
          {error}
        </div>
      )}

      <div style={{ background: "var(--bg-card)", borderRadius: 14, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>No records found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
                  {cols.map((c) => (
                    <th key={c} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                    {cols.map((c) => (
                      <td key={c} style={{ padding: "10px 16px", fontSize: 13, color: "var(--text-primary)", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {typeof row[c] === "boolean" ? (
                          <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: row[c] ? "#16a34a18" : "var(--bg-muted)", color: row[c] ? "#16a34a" : "var(--text-muted)" }}>
                            {row[c] ? "Yes" : "No"}
                          </span>
                        ) : formatVal(row[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
