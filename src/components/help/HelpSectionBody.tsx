import type { HelpBlock, HelpSection } from "@/lib/game/help-content";
import { cn } from "@/lib/utils";

function HelpBlockView({ block }: { block: HelpBlock }) {
  switch (block.type) {
    case "p":
      return <p className="text-sm leading-relaxed text-white/75">{block.text}</p>;
    case "ul":
      return (
        <ul className="list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-white/75">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "note":
      return (
        <p className="rounded-lg border border-presi-gold/20 bg-presi-gold/10 px-3 py-2 text-xs leading-snug text-presi-gold/90">
          {block.text}
        </p>
      );
    case "table":
      return (
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[28rem] border-collapse text-left text-[11px]">
            <thead>
              <tr className="border-b border-white/15 text-presi-gold">
                {block.headers.map((h) => (
                  <th key={h} className="px-1.5 py-1.5 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr
                  key={row.join("|")}
                  className="border-b border-white/5 text-white/70"
                >
                  {row.map((cell, i) => (
                    <td
                      key={`${row[0]}-${i}`}
                      className={cn(
                        "px-1.5 py-1 whitespace-nowrap",
                        i === 0 && "font-medium text-white/85"
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}

export function HelpSectionBody({
  section,
  className,
}: {
  section: HelpSection;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {section.body.map((block, i) => (
        <HelpBlockView key={`${section.id}-${i}`} block={block} />
      ))}
    </div>
  );
}
