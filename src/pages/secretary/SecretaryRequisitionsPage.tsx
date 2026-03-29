import { SharedRequisitionsPage, SharedRequisitionsPageProps } from '../requisitions/SharedRequisitionsPage';

export interface SecretaryRequisitionsPageProps extends Omit<SharedRequisitionsPageProps, 'scopeRole' | 'canManageRequests'> {
  initialSection?: 'create' | 'list';
  onDirtyChange?: (isDirty: boolean) => void;
}

export function SecretaryRequisitionsPage(props: Readonly<SecretaryRequisitionsPageProps>) {
  return <SharedRequisitionsPage {...props} scopeRole="ALL" canManageRequests={true} />;
}
