export default function LDLogo({ size = 36 }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: 8,
      overflow: "hidden",
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#000",
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
