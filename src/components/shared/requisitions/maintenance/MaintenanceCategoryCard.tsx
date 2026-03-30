import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { ManutencaoItem } from '../../../../services/api';
import { MaintenanceSpaceGroup } from './MaintenanceSpaceGroup';
import { motion, AnimatePresence } from 'framer-motion';

interface MaintenanceCategoryCardProps {
  displayLabel: string;
  itemsBySpace: Record<string, ManutencaoItem[]>;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  selectedIds: number[];
  onToggleItem: (id: number, checked: boolean) => void;
  observacao: string;
  onUpdateObservacao: (obs: string) => void;
  t: (key: string) => string;
}

export function MaintenanceCategoryCard({
  displayLabel,
  itemsBySpace,
  isExpanded,
  onToggleExpansion,
  selectedIds,
  onToggleItem,
  observacao,
  onUpdateObservacao,
  t,
}: Readonly<MaintenanceCategoryCardProps>) {
  const espacos = Object.keys(itemsBySpace).sort();
  const selectedInCategory = Object.values(itemsBySpace)
    .flat()
    .filter(item => selectedIds.includes(item.id)).length;

  return (
    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
      isExpanded 
        ? 'border-purple-200 dark:border-purple-800 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm' 
        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-purple-300 dark:hover:border-purple-700 shadow-sm'
    }`}>
      <button
        type="button"
        onClick={onToggleExpansion}
        className="w-full px-6 py-5 flex items-center justify-between group transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
            isExpanded ? 'bg-purple-600 text-white rotate-3 shadow-lg shadow-purple-500/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 group-hover:text-purple-600'
          }`}>
            <span className="font-bold text-lg">{displayLabel[0]}</span>
          </div>
          <div className="text-left">
            <h3 className={`font-semibold text-lg transition-colors ${isExpanded ? 'text-purple-700 dark:text-purple-400' : 'text-gray-900 dark:text-gray-100'}`}>
              {displayLabel}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {selectedInCategory > 0 
                ? `${selectedInCategory} item(ns) selecionado(s)` 
                : `${espacos.length} espaços disponíveis`
              }
            </p>
          </div>
        </div>
        <div className={`p-2 rounded-lg transition-all ${isExpanded ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600' : 'text-gray-400'}`}>
          {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="px-6 pb-6 pt-2 space-y-6">
              <div className="space-y-4">
                {espacos.map((espaco) => (
                  <MaintenanceSpaceGroup
                    key={espaco}
                    espaco={espaco}
                    items={itemsBySpace[espaco]}
                    selectedIds={selectedIds}
                    onToggleItem={onToggleItem}
                  />
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <MessageSquare className="w-4 h-4 text-purple-500" />
                  <span>{t('maintenance.labels.observations')}</span>
                </div>
                <textarea
                  value={observacao}
                  onChange={(e) => onUpdateObservacao(e.target.value)}
                  placeholder={t('maintenance.placeholders.observations')}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all resize-none min-h-[100px]"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
