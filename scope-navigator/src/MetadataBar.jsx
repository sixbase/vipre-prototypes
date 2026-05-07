import { typeConfig, entityTypeOrder } from './config';

export default function MetadataBar({ entities }) {
  if (!entities?.length) return null;

  const counts = {};
  for (const e of entities) counts[e.type] = (counts[e.type] || 0) + 1;
  const chips = entityTypeOrder.filter(t => counts[t]);
  if (!chips.length) return null;

  return (
    <div className="bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800 px-3 py-2">
      <div className="flex items-center gap-2 overflow-x-auto">
        {chips.map((type, i) => {
          const { Icon, label, color } = typeConfig[type];
          return (
            <div key={type} className="flex items-center gap-2 flex-shrink-0">
              {i > 0 && <span className="text-zinc-300 dark:text-zinc-600 text-[10px]">&middot;</span>}
              <div className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <span className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}s</span>
                <span className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100">{counts[type]}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
