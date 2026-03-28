import { SharedRequisitionsPage } from '../requisitions/SharedRequisitionsPage';

interface EscolaRequisitionsPageProps {
  isDarkMode: boolean;
  currentUserId: number;
  initialSection?: 'create' | 'list';
}

export function EscolaRequisitionsPage({ isDarkMode, currentUserId, initialSection }: Readonly<EscolaRequisitionsPageProps>) {
  return (
    <SharedRequisitionsPage
      isDarkMode={isDarkMode}
      currentUserId={currentUserId}
      scopeRole="ESCOLA"
      canManageRequests={false}
      initialSection={initialSection}
    />
  );
}
