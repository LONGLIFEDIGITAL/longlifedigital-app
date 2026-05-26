export default function LDLogo({ size = 36 }) {
  return (
    <img
      src="/logo.png"
      alt="Longlife Digital"
      width={size}
      height={size}
      style={{ display: "block", objectFit: "contain", flexShrink: 0, mixBlendMode: "screen" }}
    />
  );
}
