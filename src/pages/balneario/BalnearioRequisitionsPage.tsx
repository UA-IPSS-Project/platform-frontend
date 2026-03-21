import { SharedRequisitionsPage } from '../requisitions/SharedRequisitionsPage';

interface BalnearioRequisitionsPageProps {
  isDarkMode: boolean;
  currentUserId: number;
}

export function BalnearioRequisitionsPage({ isDarkMode, currentUserId }: Readonly<BalnearioRequisitionsPageProps>) {
  return (
    <SharedRequisitionsPage
      isDarkMode={isDarkMode}
      currentUserId={currentUserId}
      scopeRole="BALNEARIO"
      canManageRequests={false}
    />
  );
}
