import { SharedRequisitionsPage, SharedRequisitionsPageProps } from '../requisitions/SharedRequisitionsPage';

interface BalnearioRequisitionsPageProps extends Omit<SharedRequisitionsPageProps, 'scopeRole' | 'canManageRequests'> {
  initialSection?: 'create' | 'list';
  onDirtyChange?: (isDirty: boolean) => void;
}

export function BalnearioRequisitionsPage({ isDarkMode, currentUserId, initialSection, onDirtyChange }: Readonly<BalnearioRequisitionsPageProps>) {
  return (
    <SharedRequisitionsPage
      isDarkMode={isDarkMode}
      currentUserId={currentUserId}
      scopeRole="BALNEARIO"
      canManageRequests={false}
      initialSection={initialSection}
      onDirtyChange={onDirtyChange}
    />
  );
}
