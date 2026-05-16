import { Fragment, useState } from 'react';
import { GripVertical, Plus, X } from 'lucide-react';

interface Props {
  items: string[];
  onChange: (items: string[]) => void;
  addLabel?: string;
  itemPlaceholder?: string;
}

export function SortableStringList({
  items,
  onChange,
  addLabel = 'Adicionar item',
  itemPlaceholder = '',
}: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [insertAt, setInsertAt] = useState<number | null>(null);

  const update = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([...items, '']);
  };

  const applyMove = (from: number, rawInsert: number) => {
    let at = rawInsert;
    if (from < at) at--;
    if (at === from) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(at, 0, moved);
    onChange(next);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    const ghost = document.createElement('div');
    ghost.style.cssText =
      'position:fixed;top:-9999px;background:#f3f4f6;border:1px solid #d1d5db;font-size:12px;padding:4px 10px;border-radius:6px;white-space:nowrap;color:#374151;';
    ghost.textContent = items[index] || itemPlaceholder || '···';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, 14);
    setTimeout(() => document.body.removeChild(ghost), 0);
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = e.clientY < rect.top + rect.height / 2 ? index : index + 1;
    if (insertAt !== pos) setInsertAt(pos);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setInsertAt(null);
  };

  return (
    <div className="space-y-1">
      {items.map((item, index) => {
        const isDragging = dragIndex === index;
        const showIndicator = dragIndex !== null && insertAt === index;

        return (
          <Fragment key={index}>
            {showIndicator && (
              <div className="h-0.5 bg-purple-400 dark:bg-purple-500 rounded-full mx-1" />
            )}
            <div
              draggable
              onDragStart={e => handleDragStart(e, index)}
              onDragOver={e => handleDragOver(e, index)}
              onDrop={e => {
                e.preventDefault();
                if (dragIndex === null) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = e.clientY < rect.top + rect.height / 2 ? index : index + 1;
                applyMove(dragIndex, pos);
                setDragIndex(null);
                setInsertAt(null);
              }}
              onDragEnd={handleDragEnd}
              className={[
                'flex items-center gap-1.5 rounded-lg border px-2 py-1.5 bg-white dark:bg-gray-900 transition-colors select-none',
                'border-gray-200 dark:border-gray-700',
                isDragging ? 'opacity-40' : '',
              ].join(' ')}
            >
              <GripVertical className="w-4 h-4 shrink-0 text-gray-300 dark:text-gray-600 cursor-grab active:cursor-grabbing" />
              <input
                type="text"
                value={item}
                onChange={e => update(index, e.target.value)}
                placeholder={itemPlaceholder}
                onMouseDown={e => e.stopPropagation()}
                className="flex-1 min-w-0 bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none select-text"
              />
              <button
                type="button"
                onClick={() => remove(index)}
                className="shrink-0 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors"
                aria-label="Remover"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </Fragment>
        );
      })}

      {/* Line indicator at end of list */}
      {dragIndex !== null && insertAt === items.length && (
        <div className="h-0.5 bg-purple-400 dark:bg-purple-500 rounded-full mx-1" />
      )}

      {/* Invisible append zone */}
      {dragIndex !== null && (
        <div
          className="h-4"
          onDragOver={e => { e.preventDefault(); setInsertAt(items.length); }}
          onDrop={e => {
            e.preventDefault();
            if (dragIndex === null) return;
            applyMove(dragIndex, items.length);
            setDragIndex(null);
            setInsertAt(null);
          }}
        />
      )}

      <button
        type="button"
        onClick={add}
        className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:border-purple-400 hover:text-purple-600 dark:hover:border-purple-600 dark:hover:text-purple-400 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        {addLabel}
      </button>
    </div>
  );
}
