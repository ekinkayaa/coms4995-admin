"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

const NAV_GROUPS = [
  {
    label: "Core",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "◈" },
      { href: "/users", label: "Users", icon: "◉" },
      { href: "/images", label: "Images", icon: "▣" },
      { href: "/captions", label: "Captions", icon: "◎" },
      { href: "/ratings", label: "Caption Ratings", icon: "◈" },
      { href: "/reported-content", label: "Reported Content", icon: "⚠" },
      { href: "/bug-reports", label: "Bug Reports", icon: "🐛" },
      { href: "/caption-requests", label: "Caption Requests", icon: "◷" },
      { href: "/caption-examples", label: "Caption Examples", icon: "◑" },
      { href: "/terms", label: "Terms", icon: "◻" },
    ],
  },
  {
    label: "Humor",
    items: [
      { href: "/humor-flavors", label: "Humor Flavors", icon: "◕" },
      { href: "/humor-flavor-steps", label: "Flavor Steps", icon: "◔" },
      { href: "/humor-mix", label: "Humor Mix", icon: "◍" },
    ],
  },
  {
    label: "LLM",
    items: [
      { href: "/llm-providers", label: "LLM Providers", icon: "◆" },
      { href: "/llm-models", label: "LLM Models", icon: "◇" },
      { href: "/llm-prompt-chains", label: "Prompt Chains", icon: "◈" },
      { href: "/llm-responses", label: "LLM Responses", icon: "◉" },
    ],
  },
  {
    label: "Access",
    items: [
      { href: "/allowed-domains", label: "Allowed Domains", icon: "◼" },
      { href: "/whitelisted-emails", label: "Whitelisted Emails", icon: "◻" },
    ],
  },
];

export default function Sidebar({ email, name }: { email: string | null; name: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside
      style={{
        width: 220,
        background: "#0f0f0f",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        flexShrink: 0,
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div style={{ padding: "24px 20px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
          Admin Panel
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 3, letterSpacing: "0.04em" }}>
          almostcrackd.ai
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "10px 10px", flex: 1 }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: 8 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "rgba(255,255,255,0.25)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "8px 12px 4px",
              }}
            >
              {group.label}
            </div>
            {group.items.map(({ href, label, icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 12px",
                    borderRadius: 7,
                    marginBottom: 1,
                    fontSize: 13,
                    fontWeight: active ? 700 : 400,
                    color: active ? "#fff" : "rgba(255,255,255,0.5)",
                    background: active ? "rgba(255,255,255,0.1)" : "transparent",
                    textDecoration: "none",
                    transition: "background 0.12s, color 0.12s",
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      width: 18,
                      textAlign: "center",
                      color: active ? "#fff" : "rgba(255,255,255,0.35)",
                    }}
                  >
                    {icon}
                  </span>
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: "16px 20px 20px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        {name && (
          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 2 }}>
            {name}
          </div>
        )}
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.35)",
            marginBottom: 14,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {email}
        </div>
        <button
          onClick={handleSignOut}
          style={{
            width: "100%",
            padding: "8px 12px",
            background: "rgba(255,255,255,0.07)",
            color: "rgba(255,255,255,0.6)",
            border: "none",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
