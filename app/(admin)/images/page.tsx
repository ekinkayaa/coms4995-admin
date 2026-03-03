"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";

type Image = {
  id: string;
  url: string | null;
  additional_context: string | null;
  image_description: string | null;
  is_public: boolean | null;
  is_common_use: boolean | null;
  created_datetime_utc: string | null;
  profile_id: string | null;
  profiles: { email: string | null; first_name: string | null; last_name: string | null } | null;
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

export default function ImagesPage() {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "public" | "common">("all");
  const [error, setError] = useState<string | null>(null);
  const [toasting, setToasting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const supabase = createClient();

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("images")
      .select(
        "id, url, additional_context, image_description, is_public, is_common_use, created_datetime_utc, profile_id, profiles(email, first_name, last_name)"
      )
      .order("created_datetime_utc", { ascending: false })
      .limit(300);
    if (error) setError(error.message);
    else setImages((data ?? []) as unknown as Image[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function toast(msg: string) {
    setToasting(msg);
    setTimeout(() => setToasting(null), 2500);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this image? This cannot be undone.")) return;
    setDeleting(id);
    const { error } = await supabase.from("images").delete().eq("id", id);
    if (error) {
      toast("Error: " + error.message);
    } else {
      setImages((prev) => prev.filter((img) => img.id !== id));
      toast("Image deleted");
    }
    setDeleting(null);
  }

  async function toggleField(id: string, field: "is_public" | "is_common_use", current: boolean | null) {
    const { error } = await supabase
      .from("images")
      .update({ [field]: !current })
      .eq("id", id);
    if (error) {
      toast("Error: " + error.message);
    } else {
      setImages((prev) =>
        prev.map((img) => (img.id === id ? { ...img, [field]: !current } : img))
      );
      toast(`${field === "is_public" ? "Public" : "Common use"} ${!current ? "enabled" : "disabled"}`);
    }
  }

  const filtered = images.filter((img) => {
    if (filter === "public" && !img.is_public) return false;
    if (filter === "common" && !img.is_common_use) return false;
    const q = search.toLowerCase();
    return (
      !q ||
      img.profiles?.email?.toLowerCase().includes(q) ||
      img.additional_context?.toLowerCase().includes(q) ||
      img.image_description?.toLowerCase().includes(q)
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
            Images
          </h1>
          <p style={{ fontSize: 14, color: "rgba(0,0,0,0.38)", margin: 0 }}>
            {images.length} image{images.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {(["all", "public", "common"] as const).map((f) => (
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
              {f === "all" ? "All" : f === "public" ? "Public" : "Common Use"}
            </button>
          ))}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 13,
              outline: "none",
              width: 200,
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
            No images found.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                {["", "Uploader", "Context", "Public", "Common Use", "Uploaded", ""].map((h, i) => (
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
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((img, i) => {
                const uploaderName =
                  [img.profiles?.first_name, img.profiles?.last_name]
                    .filter(Boolean)
                    .join(" ") || img.profiles?.email || "Unknown";
                return (
                  <tr
                    key={img.id}
                    style={{
                      borderBottom: i < filtered.length - 1 ? "1px solid #f3f4f6" : "none",
                    }}
                  >
                    {/* Thumbnail */}
                    <td style={{ padding: "10px 12px 10px 16px", width: 72 }}>
                      {img.url ? (
                        <img
                          src={img.url}
                          alt=""
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                          style={{
                            width: 56,
                            height: 56,
                            objectFit: "cover",
                            borderRadius: 8,
                            display: "block",
                            background: "#f3f4f6",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 8,
                            background: "#f3f4f6",
                          }}
                        />
                      )}
                    </td>
                    {/* Uploader */}
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>
                        {uploaderName}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(0,0,0,0.35)" }}>
                        {img.profiles?.email}
                      </div>
                    </td>
                    {/* Context */}
                    <td style={{ padding: "10px 16px", maxWidth: 200 }}>
                      <div
                        style={{
                          fontSize: 12,
                          color: "rgba(0,0,0,0.55)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {img.additional_context || img.image_description || "—"}
                      </div>
                    </td>
                    {/* Public toggle */}
                    <td style={{ padding: "10px 16px" }}>
                      <button
                        onClick={() => toggleField(img.id, "is_public", img.is_public)}
                        style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                      >
                        <Badge on={!!img.is_public} label={img.is_public ? "Yes" : "No"} />
                      </button>
                    </td>
                    {/* Common Use toggle */}
                    <td style={{ padding: "10px 16px" }}>
                      <button
                        onClick={() => toggleField(img.id, "is_common_use", img.is_common_use)}
                        style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                      >
                        <Badge on={!!img.is_common_use} label={img.is_common_use ? "Yes" : "No"} color="#0284c7" />
                      </button>
                    </td>
                    {/* Uploaded */}
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ fontSize: 12, color: "rgba(0,0,0,0.35)" }}>
                        {img.created_datetime_utc
                          ? new Date(img.created_datetime_utc).toLocaleDateString()
                          : "—"}
                      </span>
                    </td>
                    {/* Delete */}
                    <td style={{ padding: "10px 16px" }}>
                      <button
                        onClick={() => handleDelete(img.id)}
                        disabled={deleting === img.id}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 6,
                          border: "1px solid #fecaca",
                          background: "#fef2f2",
                          color: "#dc2626",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: deleting === img.id ? "not-allowed" : "pointer",
                          opacity: deleting === img.id ? 0.5 : 1,
                        }}
                      >
                        {deleting === img.id ? "…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
