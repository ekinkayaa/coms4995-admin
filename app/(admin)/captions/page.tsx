"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";

type Caption = {
  id: string;
  content: string | null;
  is_public: boolean;
  is_featured: boolean;
  like_count: number;
  created_datetime_utc: string | null;
  profile_id: string;
  image_id: string;
  profiles: { email: string | null; first_name: string | null; last_name: string | null } | null;
  images: { url: string | null } | null;
};

function Badge({ on, label, color = "#16a34a" }: { on: boolean; label: string; color?: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        background: on ? color + "18" : "#f3f4f6",
        color: on ? color : "rgba(0,0,0,0.35)",
        letterSpacing: "0.04em",
      }}
    >
      {label}
    </span>
  );
}

const PAGE = 100;

export default function CaptionsPage() {
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "featured" | "public">("all");
  const [error, setError] = useState<string | null>(null);
  const [toasting, setToasting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const supabase = createClient();

  async function load() {
    setLoading(true);
    let countQ = supabase.from("captions").select("*", { count: "exact", head: true });
    if (filter === "featured") countQ = countQ.eq("is_featured", true);
    if (filter === "public") countQ = countQ.eq("is_public", true);

    let dataQ = supabase.from("captions").select("id, content, is_public, is_featured, like_count, created_datetime_utc, profile_id, image_id, profiles(email, first_name, last_name), images(url)").order("created_datetime_utc", { ascending: false });
    if (filter === "featured") dataQ = dataQ.eq("is_featured", true);
    if (filter === "public") dataQ = dataQ.eq("is_public", true);

    const [countRes, dataRes] = await Promise.all([countQ, dataQ.range(0, PAGE - 1)]);
    setTotalCount(countRes.count ?? 0);
    if (dataRes.error) setError(dataRes.error.message);
    else setCaptions((dataRes.data ?? []) as unknown as Caption[]);
    setLoading(false);
  }

  async function loadMore() {
    setLoadingMore(true);
    let q = supabase.from("captions").select("id, content, is_public, is_featured, like_count, created_datetime_utc, profile_id, image_id, profiles(email, first_name, last_name), images(url)").order("created_datetime_utc", { ascending: false });
    if (filter === "featured") q = q.eq("is_featured", true);
    if (filter === "public") q = q.eq("is_public", true);
    const { data, error } = await q.range(captions.length, captions.length + PAGE - 1);
    if (error) toast("Error: " + error.message);
    else setCaptions((prev) => [...prev, ...(data ?? []) as unknown as Caption[]]);
    setLoadingMore(false);
  }

  useEffect(() => {
    load();
  }, [filter]);

  function toast(msg: string) {
    setToasting(msg);
    setTimeout(() => setToasting(null), 2500);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this caption? This cannot be undone.")) return;
    setDeleting(id);
    const { error } = await supabase.from("captions").delete().eq("id", id);
    if (error) {
      toast("Error: " + error.message);
    } else {
      setCaptions((prev) => prev.filter((c) => c.id !== id));
      toast("Caption deleted");
    }
    setDeleting(null);
  }

  async function toggleFeatured(id: string, current: boolean) {
    const { error } = await supabase
      .from("captions")
      .update({ is_featured: !current })
      .eq("id", id);
    if (error) {
      toast("Error: " + error.message);
    } else {
      setCaptions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_featured: !current } : c))
      );
      toast(`Caption ${!current ? "featured" : "unfeatured"}`);
    }
  }

  async function togglePublic(id: string, current: boolean) {
    const { error } = await supabase
      .from("captions")
      .update({ is_public: !current })
      .eq("id", id);
    if (error) {
      toast("Error: " + error.message);
    } else {
      setCaptions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_public: !current } : c))
      );
      toast(`Caption made ${!current ? "public" : "private"}`);
    }
  }

  const filtered = captions.filter((c) => {
    if (filter === "featured" && !c.is_featured) return false;
    if (filter === "public" && !c.is_public) return false;
    const q = search.toLowerCase();
    return (
      !q ||
      c.content?.toLowerCase().includes(q) ||
      c.profiles?.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ padding: "36px 40px" }}>
      {/* Toast */}
      {toasting && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "#111",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            zIndex: 100,
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          }}
        >
          {toasting}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 28,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#111",
              margin: "0 0 6px",
              letterSpacing: "-0.01em",
            }}
          >
            Captions
          </h1>
          <p style={{ fontSize: 14, color: "rgba(0,0,0,0.38)", margin: 0 }}>
            {loading ? "Loading…" : `Showing ${captions.length.toLocaleString()} of ${totalCount.toLocaleString()}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {(["all", "featured", "public"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid",
                borderColor: filter === f ? "#111" : "#e5e7eb",
                background: filter === f ? "#111" : "#fff",
                color: filter === f ? "#fff" : "#111",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {f === "all" ? "All" : f === "featured" ? "Featured" : "Public"}
            </button>
          ))}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search content or author…"
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 13,
              outline: "none",
              width: 220,
              background: "#fff",
            }}
          />
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 20,
            fontSize: 13,
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "rgba(0,0,0,0.35)", fontSize: 14 }}>
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "rgba(0,0,0,0.35)", fontSize: 14 }}>
            No captions found.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                {["", "Caption", "Author", "❤️ Likes", "Featured", "Public", "Created", ""].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "rgba(0,0,0,0.4)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const authorName =
                  [c.profiles?.first_name, c.profiles?.last_name]
                    .filter(Boolean)
                    .join(" ") ||
                  c.profiles?.email ||
                  "Unknown";
                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: i < filtered.length - 1 ? "1px solid #f3f4f6" : "none",
                    }}
                  >
                    {/* Image thumb */}
                    <td style={{ padding: "10px 12px 10px 16px", width: 60 }}>
                      {c.images?.url ? (
                        <img
                          src={c.images.url}
                          alt=""
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                          style={{
                            width: 44,
                            height: 44,
                            objectFit: "cover",
                            borderRadius: 6,
                            display: "block",
                            background: "#f3f4f6",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 6,
                            background: "#f3f4f6",
                          }}
                        />
                      )}
                    </td>
                    {/* Content */}
                    <td style={{ padding: "10px 16px", maxWidth: 320 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#111",
                          lineHeight: 1.45,
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        } as React.CSSProperties}
                      >
                        {c.content ?? "—"}
                      </div>
                    </td>
                    {/* Author */}
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>
                        {authorName}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(0,0,0,0.35)" }}>
                        {c.profiles?.email}
                      </div>
                    </td>
                    {/* Likes */}
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>
                        {c.like_count}
                      </span>
                    </td>
                    {/* Featured toggle */}
                    <td style={{ padding: "10px 16px" }}>
                      <button
                        onClick={() => toggleFeatured(c.id, c.is_featured)}
                        style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                      >
                        <Badge on={c.is_featured} label={c.is_featured ? "Yes" : "No"} color="#ea580c" />
                      </button>
                    </td>
                    {/* Public toggle */}
                    <td style={{ padding: "10px 16px" }}>
                      <button
                        onClick={() => togglePublic(c.id, c.is_public)}
                        style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                      >
                        <Badge on={c.is_public} label={c.is_public ? "Yes" : "No"} />
                      </button>
                    </td>
                    {/* Created */}
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ fontSize: 12, color: "rgba(0,0,0,0.35)" }}>
                        {c.created_datetime_utc
                          ? new Date(c.created_datetime_utc).toLocaleDateString()
                          : "—"}
                      </span>
                    </td>
                    {/* Delete */}
                    <td style={{ padding: "10px 16px" }}>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deleting === c.id}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 6,
                          border: "1px solid #fecaca",
                          background: "#fef2f2",
                          color: "#dc2626",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: deleting === c.id ? "not-allowed" : "pointer",
                          opacity: deleting === c.id ? 0.5 : 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {deleting === c.id ? "…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {captions.length < totalCount && (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button onClick={loadMore} disabled={loadingMore} style={{ padding: "10px 28px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#111", fontSize: 13, fontWeight: 600, cursor: loadingMore ? "not-allowed" : "pointer", opacity: loadingMore ? 0.6 : 1 }}>
            {loadingMore ? "Loading…" : `Load More (${(totalCount - captions.length).toLocaleString()} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
}
