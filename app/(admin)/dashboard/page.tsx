import { createClient } from "@/lib/supabase-server";

function StatCard({
  label,
  value,
  sub,
  accent = "#111",
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: "24px 28px",
        flex: 1,
        minWidth: 160,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "rgba(0,0,0,0.38)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 38,
          fontWeight: 800,
          color: accent,
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 12,
            color: "rgba(0,0,0,0.38)",
            marginTop: 6,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: "24px 28px",
      }}
    >
      <h2
        style={{
          fontSize: 15,
          fontWeight: 800,
          color: "#111",
          margin: "0 0 20px",
          letterSpacing: "0.01em",
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: userCount },
    { count: imageCount },
    { count: captionCount },
    { count: voteCount },
    { count: upvoteCount },
    { count: reportedCaptionCount },
    { count: reportedImageCount },
    { data: topCaptions },
    { data: recentUsers },
    { data: allImages },
    { count: bugReportCount },
    { count: featuredCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("images").select("*", { count: "exact", head: true }),
    supabase.from("captions").select("*", { count: "exact", head: true }),
    supabase.from("caption_votes").select("*", { count: "exact", head: true }),
    supabase
      .from("caption_votes")
      .select("*", { count: "exact", head: true })
      .eq("vote_value", 1),
    supabase
      .from("reported_captions")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("reported_images")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("captions")
      .select("id, content, like_count, profiles(email, first_name, last_name)")
      .order("like_count", { ascending: false })
      .limit(10),
    supabase
      .from("profiles")
      .select("id, email, first_name, last_name, created_datetime_utc")
      .order("created_datetime_utc", { ascending: false })
      .limit(6),
    supabase
      .from("images")
      .select("profile_id, profiles(email, first_name, last_name)")
      .limit(2000),
    supabase.from("bug_reports").select("*", { count: "exact", head: true }),
    supabase
      .from("captions")
      .select("*", { count: "exact", head: true })
      .eq("is_featured", true),
  ]);

  const upvotePct =
    voteCount ? Math.round(((upvoteCount ?? 0) / voteCount) * 100) : 0;
  const totalReports =
    (reportedCaptionCount ?? 0) + (reportedImageCount ?? 0);

  // Compute top uploaders from images
  const uploaderMap: Record<
    string,
    { email: string; name: string; count: number }
  > = {};
  for (const img of allImages ?? []) {
    const pid = img.profile_id as string;
    if (!pid) continue;
    const p = img.profiles as any;
    const email = p?.email ?? "Unknown";
    const name =
      [p?.first_name, p?.last_name].filter(Boolean).join(" ") || email;
    if (!uploaderMap[pid]) uploaderMap[pid] = { email, name, count: 0 };
    uploaderMap[pid].count++;
  }
  const topUploaders = Object.values(uploaderMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const avatarColors = [
    "#7c5cbf",
    "#4f46e5",
    "#0284c7",
    "#16a34a",
    "#ea580c",
    "#db2777",
  ];

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1200 }}>
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: "#111",
            margin: "0 0 6px",
            letterSpacing: "-0.01em",
          }}
        >
          Dashboard
        </h1>
        <p style={{ fontSize: 14, color: "rgba(0,0,0,0.38)", margin: 0 }}>
          Live overview of almostcrackd.ai
        </p>
      </div>

      {/* Alerts */}
      {(totalReports > 0 || (bugReportCount ?? 0) > 0) && (
        <div style={{ marginBottom: 28, display: "flex", flexDirection: "column", gap: 10 }}>
          {totalReports > 0 && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 10,
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 18 }}>⚠️</span>
              <div>
                <div
                  style={{ fontSize: 14, fontWeight: 700, color: "#991b1b" }}
                >
                  {totalReports} pending content report
                  {totalReports !== 1 ? "s" : ""}
                </div>
                <div style={{ fontSize: 12, color: "#b91c1c" }}>
                  {reportedCaptionCount} caption
                  {reportedCaptionCount !== 1 ? "s" : ""} ·{" "}
                  {reportedImageCount} image
                  {reportedImageCount !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          )}
          {(bugReportCount ?? 0) > 0 && (
            <div
              style={{
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: 10,
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 18 }}>🐛</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#92400e" }}>
                {bugReportCount} bug report{bugReportCount !== 1 ? "s" : ""}{" "}
                submitted
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stat Cards */}
      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 28,
        }}
      >
        <StatCard
          label="Total Users"
          value={(userCount ?? 0).toLocaleString()}
        />
        <StatCard
          label="Total Images"
          value={(imageCount ?? 0).toLocaleString()}
        />
        <StatCard
          label="Total Captions"
          value={(captionCount ?? 0).toLocaleString()}
          sub={`${featuredCount ?? 0} featured`}
        />
        <StatCard
          label="Total Votes"
          value={(voteCount ?? 0).toLocaleString()}
          sub={`${upvotePct}% upvotes`}
          accent={upvotePct >= 50 ? "#16a34a" : "#dc2626"}
        />
      </div>

      {/* Vote sentiment bar */}
      {(voteCount ?? 0) > 0 && (
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: "20px 28px",
            marginBottom: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#111",
              }}
            >
              Vote Sentiment
            </span>
            <span style={{ fontSize: 12, color: "rgba(0,0,0,0.38)" }}>
              {upvoteCount ?? 0} upvotes · {(voteCount ?? 0) - (upvoteCount ?? 0)} downvotes
            </span>
          </div>
          <div
            style={{
              height: 10,
              borderRadius: 999,
              background: "#f3f4f6",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${upvotePct}%`,
                background: "linear-gradient(90deg, #16a34a, #4ade80)",
                borderRadius: 999,
                transition: "width 0.5s ease",
              }}
            />
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
        }}
      >
        {/* Top Captions */}
        <Card title="Top 10 Captions by Likes">
          {(topCaptions ?? []).length === 0 ? (
            <p style={{ color: "rgba(0,0,0,0.35)", fontSize: 13 }}>
              No captions yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {(topCaptions ?? []).map((c: any, i) => (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom:
                      i < (topCaptions ?? []).length - 1
                        ? "1px solid #f3f4f6"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "rgba(0,0,0,0.2)",
                      width: 20,
                      flexShrink: 0,
                      paddingTop: 1,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#111",
                        lineHeight: 1.45,
                        marginBottom: 3,
                      }}
                    >
                      {(c.content ?? "").slice(0, 90)}
                      {(c.content?.length ?? 0) > 90 ? "…" : ""}
                    </div>
                    <div
                      style={{ fontSize: 11, color: "rgba(0,0,0,0.35)" }}
                    >
                      ❤️ {c.like_count} ·{" "}
                      {(c.profiles as any)?.email ?? "Unknown"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Top Uploaders */}
          <Card title="Top Uploaders">
            {topUploaders.length === 0 ? (
              <p style={{ color: "rgba(0,0,0,0.35)", fontSize: 13 }}>
                No uploads yet.
              </p>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {topUploaders.map((u, i) => (
                  <div
                    key={u.email}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          background: avatarColors[i % avatarColors.length],
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {u.email[0]?.toUpperCase()}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#111",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: 140,
                        }}
                      >
                        {u.name || u.email}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#111",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {u.count} img{u.count !== 1 ? "s" : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Signups */}
          <Card title="Recent Signups">
            {(recentUsers ?? []).length === 0 ? (
              <p style={{ color: "rgba(0,0,0,0.35)", fontSize: 13 }}>
                No users yet.
              </p>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {(recentUsers ?? []).map((u: any, i) => (
                  <div
                    key={u.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: avatarColors[i % avatarColors.length],
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {(u.email ?? "?")[0]?.toUpperCase()}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#111",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: 150,
                        }}
                      >
                        {[u.first_name, u.last_name].filter(Boolean).join(" ") ||
                          u.email}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(0,0,0,0.35)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {u.created_datetime_utc
                        ? new Date(
                            u.created_datetime_utc
                          ).toLocaleDateString()
                        : "—"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
