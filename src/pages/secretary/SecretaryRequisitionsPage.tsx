import { SharedRequisitionsPage, SharedRequisitionsPageProps } from '../requisitions/SharedRequisitionsPage';

export interface SecretaryRequisitionsPageProps extends Omit<SharedRequisitionsPageProps, 'scopeRole' | 'canManageRequests'> {}

export function SecretaryRequisitionsPage(props: Readonly<SecretaryRequisitionsPageProps>) {
  return <SharedRequisitionsPage {...props} scopeRole="ALL" canManageRequests={true} />;
}
