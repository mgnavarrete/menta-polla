// Fondo decorativo: elementos flotantes con temática mundialera.
// Puramente visual (pointer-events: none, z-index -1). No afecta la funcionalidad.

type Item = {
  e: string;
  left: string;
  top: string;
  size: number;
  delay: string;
  dur: string;
};

const ITEMS: Item[] = [
  { e: "⚽", left: "6%", top: "12%", size: 34, delay: "0s", dur: "13s" },
  { e: "🏆", left: "88%", top: "18%", size: 30, delay: "1.5s", dur: "16s" },
  { e: "⚽", left: "78%", top: "70%", size: 26, delay: "3s", dur: "15s" },
  { e: "🥅", left: "14%", top: "78%", size: 30, delay: "2s", dur: "17s" },
  { e: "🎉", left: "44%", top: "8%", size: 24, delay: "4s", dur: "12s" },
  { e: "🏟️", left: "60%", top: "40%", size: 28, delay: "0.8s", dur: "18s" },
  { e: "⚽", left: "30%", top: "52%", size: 22, delay: "5s", dur: "14s" },
  { e: "🟢", left: "92%", top: "55%", size: 16, delay: "2.6s", dur: "11s" },
  { e: "🟣", left: "20%", top: "30%", size: 14, delay: "3.8s", dur: "12s" },
  { e: "🔵", left: "52%", top: "82%", size: 14, delay: "1.2s", dur: "13s" },
  { e: "🟡", left: "70%", top: "14%", size: 14, delay: "4.6s", dur: "12s" },
];

export default function Backdrop() {
  return (
    <div className="wc-backdrop" aria-hidden>
      {ITEMS.map((it, i) => (
        <span
          key={i}
          className="wc-float"
          style={{
            left: it.left,
            top: it.top,
            fontSize: it.size,
            animationDelay: it.delay,
            animationDuration: it.dur,
          }}
        >
          {it.e}
        </span>
      ))}
    </div>
  );
}
