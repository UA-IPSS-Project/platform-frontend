import { SharedRequisitionsPage } from '../requisitions/SharedRequisitionsPage';

interface BalnearioRequisitionsPageProps {
  isDarkMode: boolean;
  currentUserId: number;
  initialSection?: 'create' | 'list';
}

export function BalnearioRequisitionsPage({ isDarkMode, currentUserId, initialSection }: Readonly<BalnearioRequisitionsPageProps>) {
  return (
    <SharedRequisitionsPage
      isDarkMode={isDarkMode}
      currentUserId={currentUserId}
      scopeRole="BALNEARIO"
      canManageRequests={false}
      initialSection={initialSection}
    />
  );
}
