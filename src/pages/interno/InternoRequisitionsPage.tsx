import { SharedRequisitionsPage, SharedRequisitionsPageProps } from '../requisitions/SharedRequisitionsPage';

interface InternoRequisitionsPageProps extends Omit<SharedRequisitionsPageProps, 'scopeRole' | 'canManageRequests'> {
  initialSection?: 'create' | 'list';
  onDirtyChange?: (isDirty: boolean) => void;
}

export function InternoRequisitionsPage(props: Readonly<InternoRequisitionsPageProps>) {
  return (
    <SharedRequisitionsPage
      {...props}
      scopeRole="INTERNO"
      canManageRequests={false}
    />
  );
}
