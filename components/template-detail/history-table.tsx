"use client";

interface Transition {
  from: string | null;
  to: string;
  date: string;
  by: string;
  note: string;
  files: string[];
  direction?: string;
}

interface HistoryTableProps {
  transitions: Transition[];
}

export function HistoryTable({ transitions }: HistoryTableProps) {
  // Sort by date descending (most recent first)
  // Date format is DD/MM/YYYY, so we parse for sorting
  const sorted = [...transitions].sort((a, b) => {
    const parseDate = (d: string) => {
      const [day, month, year] = d.split("/");
      return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
    };
    return parseDate(b.date) - parseDate(a.date);
  });

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma transição registrada.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="pb-2 pr-4 font-medium text-muted-foreground">
              Data
            </th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">
              Por
            </th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">
              De &rarr; Para
            </th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">
              Direção
            </th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">
              Nota
            </th>
            <th className="pb-2 font-medium text-muted-foreground">Arquivos</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((t, index) => {
            const isBackward = t.direction === "backward";
            return (
              <tr
                key={index}
                className={`border-b border-border/50 ${
                  isBackward ? "bg-red-50" : ""
                }`}
              >
                <td className="py-2.5 pr-4 whitespace-nowrap">{t.date}</td>
                <td className="py-2.5 pr-4 whitespace-nowrap">{t.by}</td>
                <td className="py-2.5 pr-4 whitespace-nowrap">
                  <span className="text-muted-foreground">
                    {t.from ?? "Criação"}
                  </span>
                  <span className="mx-1">&rarr;</span>
                  <span>{t.to}</span>
                </td>
                <td className="py-2.5 pr-4">
                  {isBackward ? (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      Devolução
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Avanço
                    </span>
                  )}
                </td>
                <td className="py-2.5 pr-4 max-w-[200px] truncate">
                  {t.note || "-"}
                </td>
                <td className="py-2.5">
                  {t.files.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {t.files.map((file, fi) => (
                        <a
                          key={fi}
                          href={`/uploads/${file}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-blue-600 hover:underline"
                        >
                          {file}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
