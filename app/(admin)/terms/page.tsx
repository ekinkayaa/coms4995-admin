"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";

type Row = Record<string, unknown>;

const AUTO_COLS = new Set(["id", "created_at", "updated_at", "created_datetime_utc", "updated_datetime_utc"]);

function formatVal(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "object") return JSON.stringify(v);
  const s = String(v);
  if (s.match(/^\d{4}-\d{2}-\d{2}T/)) return new Date(s).toLocaleDateString();
  return s.length > 80 ? s.slice(0, 80) + "…" : s;
}

export default function TermsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [cols, setCols] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasting, setToasting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<{ id?: unknown; form: Row } | null>(null);
  const [search, setSearch] = useState("");
  const supabase = createClient();

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("terms").select("*").order("id", { ascending: true }).limit(200);
    if (error) setError(error.message);
    else {
      setRows(data ?? []);
      if (data && data.length > 0) setCols(Object.keys(data[0]));
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function toast(msg: string) {
    setToasting(msg);
    setTimeout(() => setToasting(null), 2500);
  }

  function openEdit(row: Row) {
    const form: Row = {};
    cols.filter((c) => !AUTO_COLS.has(c)).forEach((c) => { form[c] = row[c] ?? ""; });
    setModal({ id: row.id, form });
  }

  async function handleSave() {
    if (!modal) return;
    setSaving(true);
    const { error } = await supabase.from("terms").update(modal.form).eq("id", modal.id);
    if (error) toast("Error: " + error.message);
    else { setRows((prev) => prev.map((r) => r.id === modal.id ? { ...r, ...modal.form } : r)); setModal(null); toast("Saved!"); }
    setSaving(false);
  }

  async function handleDelete(id: unknown) {
    if (!confirm("Delete this term? This cannot be undone.")) return;
    setDeleting(id);
    const { error } = await supabase.from("terms").delete().eq("id", id);
    if (error) toast("Error: " + error.message);
    else { setRows((prev) => prev.filter((r) => r.id !== id)); toast("Deleted"); }
    setDeleting(null);
  }

  const filtered = rows.filter((r) =>
    !search || Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ padding: "36px 40px" }}>
      {toasting && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#111", color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 100, boxShadow: "0 4px 20px rgba(0,0,0,0.25)" }}>
          {toasting}
        </div>
      )}

      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 520, maxWidth: "90vw", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 20px" }}>Edit Term</h2>
            {Object.entries(modal.form).map(([k, v]) => (
              <div key={k} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.45)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5 }}>{k}</label>
                {String(k).toLowerCase().includes("content") || String(k).toLowerCase().includes("body") ? (
                  <textarea
                    value={v === null || v === undefined ? "" : String(v)}
                    onChange={(e) => setModal((prev) => prev ? { ...prev, form: { ...prev.form, [k]: e.target.value } } : null)}
                    rows={6}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }}
                  />
                ) : (
                  <input
                    value={v === null || v === undefined ? "" : String(v)}
                    onChange={(e) => setModal((prev) => prev ? { ...prev, form: { ...prev.form, [k]: e.target.value } } : null)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                )}
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: "10px 0", background: "#111", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.5 : 1 }}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: "10px 0", background: "#f3f4f6", color: "#111", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111", margin: "0 0 6px", letterSpacing: "-0.01em" }}>Terms</h1>
          <p style={{ fontSize: 14, color: "rgba(0,0,0,0.38)", margin: 0 }}>{rows.length} record{rows.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", width: 200, background: "#fff" }} />
        </div>
      </div>

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#991b1b" }}>{error}</div>}

      <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "rgba(0,0,0,0.35)", fontSize: 14 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "rgba(0,0,0,0.35)", fontSize: 14 }}>No records found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                  {cols.map((c) => <th key={c} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{c}</th>)}
                  <th style={{ padding: "12px 16px" }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    {cols.map((c) => (
                      <td key={c} style={{ padding: "10px 16px", fontSize: 13, color: "#111", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {typeof row[c] === "boolean" ? (
                          <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: row[c] ? "#16a34a18" : "#f3f4f6", color: row[c] ? "#16a34a" : "rgba(0,0,0,0.35)" }}>{row[c] ? "Yes" : "No"}</span>
                        ) : formatVal(row[c])}
                      </td>
                    ))}
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => openEdit(row)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#f9fafb", color: "#111", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                        <button onClick={() => handleDelete(row.id)} disabled={deleting === row.id} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: deleting === row.id ? "not-allowed" : "pointer", opacity: deleting === row.id ? 0.5 : 1 }}>
                          {deleting === row.id ? "…" : "Delete"}
                        </button>
                      </div>
                    </td>
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
