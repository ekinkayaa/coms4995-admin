"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";

type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  is_superadmin: boolean;
  is_in_study: boolean;
  is_matrix_admin: boolean;
  created_datetime_utc: string | null;
};

function Badge({
  on,
  label,
  color = "#16a34a",
}: {
  on: boolean;
  label: string;
  color?: string;
}) {
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

export default function UsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "superadmin" | "matrix_admin" | "in_study">("all");
  const [error, setError] = useState<string | null>(null);
  const [toasting, setToasting] = useState<string | null>(null);
  const supabase = createClient();

  function applySearch(q: any) {
    if (!search.trim()) return q;
    const s = search.trim();
    return q.or(`email.ilike.%${s}%,first_name.ilike.%${s}%,last_name.ilike.%${s}%`);
  }

  async function load() {
    setLoading(true);
    const [countRes, dataRes] = await Promise.all([
      applySearch(supabase.from("profiles").select("*", { count: "exact", head: true })),
      applySearch(supabase.from("profiles").select("id, email, first_name, last_name, is_superadmin, is_in_study, is_matrix_admin, created_datetime_utc")).order("created_datetime_utc", { ascending: false }).range(0, PAGE - 1),
    ]);
    setTotalCount(countRes.count ?? 0);
    if (dataRes.error) setError(dataRes.error.message);
    else setProfiles((dataRes.data ?? []) as Profile[]);
    setLoading(false);
  }

  async function loadMore() {
    setLoadingMore(true);
    const { data, error } = await applySearch(supabase.from("profiles").select("id, email, first_name, last_name, is_superadmin, is_in_study, is_matrix_admin, created_datetime_utc")).order("created_datetime_utc", { ascending: false }).range(profiles.length, profiles.length + PAGE - 1);
    if (error) { setToasting("Error: " + error.message); setTimeout(() => setToasting(null), 2500); }
    else setProfiles((prev) => [...prev, ...(data ?? []) as Profile[]]);
    setLoadingMore(false);
  }

  useEffect(() => {
    load();
  }, [search]);

  async function toggleField(
    id: string,
    field: "is_superadmin" | "is_in_study",
    current: boolean
  ) {
    const { error } = await supabase
      .from("profiles")
      .update({ [field]: !current })
      .eq("id", id);

    if (error) {
      setToasting("Error: " + error.message);
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [field]: !current } : p))
      );
      setToasting(
        `${field === "is_superadmin" ? "Superadmin" : "In Study"} ${!current ? "enabled" : "disabled"}`
      );
    }
    setTimeout(() => setToasting(null), 2500);
  }

  const filtered = profiles
    .filter((p) => {
      if (roleFilter === "superadmin" && !p.is_superadmin) return false;
      if (roleFilter === "matrix_admin" && !p.is_matrix_admin) return false;
      if (roleFilter === "in_study" && !p.is_in_study) return false;
      return true;
    })
    .sort((a, b) => {
      if (roleFilter !== "all") return 0;
      // Default: superadmins first, then matrix admins, then rest
      const aScore = (a.is_superadmin ? 2 : 0) + (a.is_matrix_admin ? 1 : 0);
      const bScore = (b.is_superadmin ? 2 : 0) + (b.is_matrix_admin ? 1 : 0);
      return bScore - aScore;
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
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
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
            Users
          </h1>
          <p style={{ fontSize: 14, color: "rgba(0,0,0,0.38)", margin: 0 }}>
            {loading ? "Loading…" : `Showing ${profiles.length.toLocaleString()} of ${totalCount.toLocaleString()}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {(["all", "superadmin", "matrix_admin", "in_study"] as const).map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid", borderColor: roleFilter === r ? "#7c5cbf" : "#e5e7eb", background: roleFilter === r ? "#7c5cbf" : "#fff", color: roleFilter === r ? "#fff" : "#111", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {r === "all" ? "All" : r === "superadmin" ? "Superadmin" : r === "matrix_admin" ? "Matrix Admin" : "In Study"}
            </button>
          ))}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", width: 240, background: "#fff" }}
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

      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: "rgba(0,0,0,0.35)",
              fontSize: 14,
            }}
          >
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: "rgba(0,0,0,0.35)",
              fontSize: 14,
            }}
          >
            No users found.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: "#f9fafb",
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                {[
                  "User",
                  "Email",
                  "Superadmin",
                  "In Study",
                  "Matrix Admin",
                  "Joined",
                ].map((h) => (
                  <th
                    key={h}
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
              {filtered.map((p, i) => {
                const name =
                  [p.first_name, p.last_name].filter(Boolean).join(" ") ||
                  "—";
                return (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom:
                        i < filtered.length - 1
                          ? "1px solid #f3f4f6"
                          : "none",
                    }}
                  >
                    {/* User */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "#7c5cbf",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {(p.email ?? "?")[0]?.toUpperCase()}
                        </div>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#111",
                          }}
                        >
                          {name}
                        </span>
                      </div>
                    </td>
                    {/* Email */}
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          fontSize: 13,
                          color: "rgba(0,0,0,0.55)",
                        }}
                      >
                        {p.email ?? "—"}
                      </span>
                    </td>
                    {/* Superadmin toggle */}
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() =>
                          toggleField(p.id, "is_superadmin", p.is_superadmin)
                        }
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                        }}
                      >
                        <Badge
                          on={p.is_superadmin}
                          label={p.is_superadmin ? "Yes" : "No"}
                          color="#7c5cbf"
                        />
                      </button>
                    </td>
                    {/* In Study toggle */}
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() =>
                          toggleField(p.id, "is_in_study", p.is_in_study)
                        }
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                        }}
                      >
                        <Badge
                          on={p.is_in_study}
                          label={p.is_in_study ? "Yes" : "No"}
                          color="#0284c7"
                        />
                      </button>
                    </td>
                    {/* Matrix Admin */}
                    <td style={{ padding: "12px 16px" }}>
                      <Badge
                        on={p.is_matrix_admin}
                        label={p.is_matrix_admin ? "Yes" : "No"}
                        color="#ea580c"
                      />
                    </td>
                    {/* Joined */}
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          fontSize: 12,
                          color: "rgba(0,0,0,0.35)",
                        }}
                      >
                        {p.created_datetime_utc
                          ? new Date(
                              p.created_datetime_utc
                            ).toLocaleDateString()
                          : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {profiles.length < totalCount && (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button onClick={loadMore} disabled={loadingMore} style={{ padding: "10px 28px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#111", fontSize: 13, fontWeight: 600, cursor: loadingMore ? "not-allowed" : "pointer", opacity: loadingMore ? 0.6 : 1 }}>
            {loadingMore ? "Loading…" : `Load More (${(totalCount - profiles.length).toLocaleString()} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
}
