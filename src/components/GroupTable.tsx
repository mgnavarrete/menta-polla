import type { TeamView } from "@/lib/data";
import type { GroupRow } from "@/lib/bracket";
import Flag from "./Flag";

export default function GroupTable({
  letter,
  rows,
}: {
  letter: string;
  rows: { team: TeamView; row: GroupRow }[];
}) {
  return (
    <div className="card p-3">
      <h3 className="font-bold mb-2 text-sm">
        Grupo <span className="text-accent">{letter}</span>
      </h3>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-muted">
            <th className="text-left font-semibold pb-1">Equipo</th>
            <th className="text-center font-semibold pb-1 w-6">PJ</th>
            <th className="text-center font-semibold pb-1 w-6">DG</th>
            <th className="text-center font-semibold pb-1 w-7">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ team, row }, i) => (
            <tr
              key={team.id}
              className={i < 2 ? "" : "text-muted"}
            >
              <td className="py-1 flex items-center gap-1.5">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    i < 2 ? "bg-accent" : "bg-border"
                  }`}
                />
                <Flag iso={team.iso} code={team.code} width={18} />
                <span className="truncate">{team.name}</span>
              </td>
              <td className="text-center tabular-nums">{row.played}</td>
              <td className="text-center tabular-nums">
                {row.gd > 0 ? `+${row.gd}` : row.gd}
              </td>
              <td className="text-center tabular-nums font-bold text-foreground">
                {row.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
