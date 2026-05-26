export default function LDLogo({ size = 36 }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: 10,
      overflow: "hidden",
      flexShrink: 0,
      background: "#1a0533",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 0 0 1px rgba(147,51,234,0.3)",
    }}>
      <img
        src="/logo.png"
        alt="Longlife Digital"
        width={size}
        height={size}
        style={{ display: "block", objectFit: "contain" }}
      />
    </div>
  );
}
