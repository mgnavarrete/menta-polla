// Bandera desde /public/flags/{iso}.svg. width en px (alto = 2/3 del ancho).
export default function Flag({
  iso,
  code,
  width = 24,
}: {
  iso?: string | null;
  code?: string | null;
  width?: number;
}) {
  const height = Math.round((width * 2) / 3);
  if (!iso) {
    return (
      <span className="flag" style={{ width, height }} aria-hidden />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${iso}.svg`}
      alt={code ?? ""}
      width={width}
      height={height}
      className="flag"
      style={{ width, height }}
    />
  );
}
