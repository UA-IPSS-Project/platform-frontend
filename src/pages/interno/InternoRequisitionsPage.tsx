import { SharedRequisitionsPage } from '../requisitions/SharedRequisitionsPage';

interface InternoRequisitionsPageProps {
  isDarkMode: boolean;
  currentUserId: number;
}

export function InternoRequisitionsPage({ isDarkMode, currentUserId }: Readonly<InternoRequisitionsPageProps>) {
  return (
    <SharedRequisitionsPage
      isDarkMode={isDarkMode}
      currentUserId={currentUserId}
      scopeRole="INTERNO"
      canManageRequests={false}
    />
  );
}
