import { apiRequest } from '../core/client';

export interface SendReportRequest {
  to: String;
  subject: String;
  body: String;
}

export const reportsApi = {
  sendByEmail: (payload: SendReportRequest) =>
    apiRequest<void>('/api/reports/email', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
