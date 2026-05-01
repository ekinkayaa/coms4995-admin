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
  return s.length > 80 ? s.slice(0, 80) + "…" : s;
}

export default function HumorFlavorsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [cols, setCols] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const supabase = createClient();
  const PAGE = 100;

  useEffect(() => {
    (async () => {
      const [countRes, dataRes] = await Promise.all([
        supabase.from("humor_flavors").select("*", { count: "exact", head: true }),
        supabase.from("humor_flavors").select("*").order("id", { ascending: true }).range(0, PAGE - 1),
      ]);
      setTotalCount(countRes.count ?? 0);
      if (dataRes.error) setError(dataRes.error.message);
      else {
        setRows(dataRes.data ?? []);
        if (dataRes.data && dataRes.data.length > 0) setCols(Object.keys(dataRes.data[0]));
      }
      setLoading(false);
    })();
  }, []);

  async function loadMore() {
    setLoadingMore(true);
    const { data } = await supabase.from("humor_flavors").select("*").order("id", { ascending: true }).range(rows.length, rows.length + PAGE - 1);
    if (data) setRows((prev) => [...prev, ...data]);
    setLoadingMore(false);
  }

  const filtered = rows.filter((r) =>
    !search ||
    Object.values(r).some((v) =>
      String(v ?? "").toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div style={{ padding: "36px 40px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 6px", letterSpacing: "-0.01em" }}>
            Humor Flavors
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
            {loading ? "Loading…" : `Showing ${rows.length.toLocaleString()} of ${totalCount.toLocaleString()} flavors`}
          </p>
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
                    <th key={c} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                    {cols.map((c) => (
                      <td key={c} style={{ padding: "10px 16px", fontSize: 13, color: "var(--text-primary)", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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

      {rows.length < totalCount && (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button onClick={loadMore} disabled={loadingMore} style={{ padding: "10px 28px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 13, fontWeight: 600, cursor: loadingMore ? "not-allowed" : "pointer", opacity: loadingMore ? 0.6 : 1 }}>
            {loadingMore ? "Loading…" : `Load More (${(totalCount - rows.length).toLocaleString()} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
}
