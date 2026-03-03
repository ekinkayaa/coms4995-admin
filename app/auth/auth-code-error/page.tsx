export default function AuthCodeError() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f0f0f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Auth Error</h1>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: 0 }}>
        Could not sign you in. Please try again.
      </p>
      <a
        href="/login"
        style={{
          marginTop: 8,
          padding: "10px 24px",
          background: "#fff",
          color: "#111",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Back to Login
      </a>
    </div>
  );
}
