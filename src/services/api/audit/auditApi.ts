import { apiRequest } from '../core/client';

export interface AuditLogDTO {
    id: number;
    userId: number | null;
    userName: string;
    action: string;
    entityType: string | null;
    entityId: number | null;
    details: string | null;
    ipAddress: string | null;
    timestamp: string;
}

export interface AuditLogFilters {
    userId?: number;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export const auditApi = {
    getLogs: (filters: AuditLogFilters = {}) => {
        const params = new URLSearchParams();
        if (filters.userId) params.append('userId', filters.userId.toString());
        if (filters.action) params.append('action', filters.action);
        if (filters.entityType) params.append('entityType', filters.entityType);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        params.append('page', (filters.page || 0).toString());
        params.append('size', (filters.size || 50).toString());

        return apiRequest<PageResponse<AuditLogDTO>>(`/api/audit/logs?${params.toString()}`, {
            method: 'GET',
        });
    },
};
