import { SharedRequisitionsPage } from '../requisitions/SharedRequisitionsPage';

interface EscolaRequisitionsPageProps {
  isDarkMode: boolean;
  currentUserId: number;
}

export function EscolaRequisitionsPage({ isDarkMode, currentUserId }: Readonly<EscolaRequisitionsPageProps>) {
  return (
    <SharedRequisitionsPage
      isDarkMode={isDarkMode}
      currentUserId={currentUserId}
      scopeRole="ESCOLA"
      canManageRequests={false}
    />
  );
}
