import { SharedRequisitionsPage } from '../requisitions/SharedRequisitionsPage';

interface InternoRequisitionsPageProps {
  isDarkMode: boolean;
  currentUserId: number;
  initialSection?: 'create' | 'list';
}

export function InternoRequisitionsPage({ isDarkMode, currentUserId, initialSection }: Readonly<InternoRequisitionsPageProps>) {
  return (
    <SharedRequisitionsPage
      isDarkMode={isDarkMode}
      currentUserId={currentUserId}
      scopeRole="INTERNO"
      canManageRequests={false}
      initialSection={initialSection}
    />
  );
}
