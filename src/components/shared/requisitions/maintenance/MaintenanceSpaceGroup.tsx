import { Checkbox } from '../../../ui/checkbox';
import { ManutencaoItem } from '../../../../services/api';

interface MaintenanceSpaceGroupProps {
  espaco: string;
  items: ManutencaoItem[];
  selectedIds: number[];
  onToggleItem: (id: number, checked: boolean) => void;
}

export function MaintenanceSpaceGroup({
  espaco,
  items,
  selectedIds,
  onToggleItem,
}: Readonly<MaintenanceSpaceGroupProps>) {
  return (
    <div className="bg-gray-50/50 dark:bg-gray-800/30 rounded-xl p-4 border border-gray-100 dark:border-gray-800 transition-all hover:shadow-sm">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-purple-500" />
        {espaco}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => {
          const isChecked = selectedIds.includes(item.id);
          return (
            <div
              key={item.id}
              className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer group ${
                isChecked
                  ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800 shadow-sm'
                  : 'bg-white border-gray-100 dark:bg-gray-900 dark:border-gray-800 hover:border-purple-200 dark:hover:border-purple-800'
              }`}
              onClick={() => onToggleItem(item.id, !isChecked)}
            >
              <Checkbox
                id={`item-${item.id}`}
                checked={isChecked}
                className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                onCheckedChange={(checked) => onToggleItem(item.id, !!checked)}
                onClick={(e) => e.stopPropagation()}
              />
              <label
                htmlFor={`item-${item.id}`}
                className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none flex-1 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {item.itemVerificacao}
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
