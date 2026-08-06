/**
 * Espacio reservado para una foto que todavía no existe. El diseño evita fotos
 * de personas reales en una clínica ficticia; estos bloques marcan dónde y con
 * qué proporción iría una imagen real del local (ver DESIGN.md).
 */
export function PhotoPlaceholder({
  label,
  className = "",
  tone = "arena",
}: {
  label: string;
  className?: string;
  tone?: "arena" | "menta";
}) {
  const stripes =
    tone === "menta"
      ? "repeating-linear-gradient(-45deg,#eef7f3 0 14px,#e2efe8 14px 28px)"
      : "repeating-linear-gradient(-45deg,#f3ecdf 0 14px,#ede3d0 14px 28px)";

  return (
    <div
      className={`grid place-items-center overflow-hidden border border-arena-200 ${className}`}
      style={{ background: stripes }}
    >
      <span className="rounded-full border border-arena-200 bg-blanco px-3.5 py-2 font-mono text-xs text-tinta-500">
        {label}
      </span>
    </div>
  );
}
