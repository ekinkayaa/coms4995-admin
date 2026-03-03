"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "◈" },
  { href: "/users", label: "Users", icon: "◉" },
  { href: "/images", label: "Images", icon: "▣" },
  { href: "/captions", label: "Captions", icon: "◎" },
];

export default function Sidebar({
  email,
  name,
}: {
  email: string | null;
  name: string;
}) {
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
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "24px 20px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-0.01em",
          }}
        >
          Admin Panel
        </div>
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.3)",
            marginTop: 3,
            letterSpacing: "0.04em",
          }}
        >
          almostcrackd.ai
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "12px 10px", flex: 1 }}>
        {NAV.map(({ href, label, icon }) => {
          const active =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 8,
                marginBottom: 2,
                fontSize: 14,
                fontWeight: active ? 700 : 400,
                color: active ? "#fff" : "rgba(255,255,255,0.5)",
                background: active ? "rgba(255,255,255,0.1)" : "transparent",
                textDecoration: "none",
                transition: "background 0.12s, color 0.12s",
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  width: 20,
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
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "16px 20px 20px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {name && (
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              marginBottom: 2,
            }}
          >
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
            transition: "background 0.12s",
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
