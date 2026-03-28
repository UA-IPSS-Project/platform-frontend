import { SharedRequisitionsPage, SharedRequisitionsPageProps } from '../requisitions/SharedRequisitionsPage';

interface EscolaRequisitionsPageProps extends Omit<SharedRequisitionsPageProps, 'scopeRole' | 'canManageRequests'> {
  initialSection?: 'create' | 'list';
  onDirtyChange?: (isDirty: boolean) => void;
}

export function EscolaRequisitionsPage(props: Readonly<EscolaRequisitionsPageProps>) {
  return (
    <SharedRequisitionsPage
      {...props}
      scopeRole="ESCOLA"
      canManageRequests={false}
    />
  );
}
