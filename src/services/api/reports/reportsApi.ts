import { apiRequest } from '../core/client';

export interface SendReportRequest {
  to: String;
  subject: String;
  body: String;
  pdfBase64?: String;
  fileName?: String;
}

export const reportsApi = {
  sendByEmail: (payload: SendReportRequest) =>
    apiRequest<void>('/api/reports/email', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
