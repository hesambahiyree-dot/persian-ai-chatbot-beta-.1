export default function App() {
  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#f3f0e8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#1a2a1c", marginBottom: "0.5rem" }}>
          NOVA AI
        </h1>
        <p style={{ color: "#1a2a1c", opacity: 0.7 }}>
          دستیار هوش مصنوعی فارسی
        </p>
      </div>
    </div>
  );
}
