import { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PrivacyNoticeProps {
    context: 'document' | 'appointment' | 'registration' | 'requisition';
    className?: string;
}

export function PrivacyNotice({ context, className = '' }: PrivacyNoticeProps) {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={className}>
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
                <Info className="w-3.5 h-3.5" />
                <span>Aviso de Privacidade — clique para ver mais</span>
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {expanded && (
                <div className="mt-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="text-xs text-blue-900 dark:text-blue-100 space-y-1">
                        <p className="font-semibold">{t(`privacy.${context}.title`)}</p>
                        <p>{t(`privacy.${context}.description`)}</p>
                        <p className="text-[11px] opacity-80">{t('privacy.common.rights')}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
