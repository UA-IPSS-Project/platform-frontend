import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PrivacyNoticeProps {
    context: 'document' | 'appointment' | 'registration' | 'requisition';
    className?: string;
}

export function PrivacyNotice({ context, className = '' }: PrivacyNoticeProps) {
    const { t } = useTranslation();

    return (
        <div className={`bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 ${className}`}>
            <div className="flex gap-3">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 dark:text-blue-100 space-y-1">
                    <p className="font-semibold">{t(`privacy.${context}.title`)}</p>
                    <p>{t(`privacy.${context}.description`)}</p>
                    <p className="text-[11px] opacity-80">
                        {t('privacy.common.rights')}
                    </p>
                </div>
            </div>
        </div>
    );
}
