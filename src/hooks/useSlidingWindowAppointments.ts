import { useState, useCallback, useRef } from 'react';
import { Appointment } from '../types';
import { marcacoesApi } from '../services/api';
import { mapApiToAppointment } from '../utils/appointmentUtils';
import { startOfWeek, endOfWeek, addDays, format } from 'date-fns';

interface WeekCache {
    [weekKey: string]: {
        data: Appointment[];
        timestamp: number;
        promise: Promise<Appointment[]> | null;
    };
}

export function useSlidingWindowAppointments(tipo?: string) {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loadingWeeks, setLoadingWeeks] = useState<{ [key: string]: boolean }>({});

    // Cache to store fetched weeks (key: YYYY-MM-DD of Monday)
    const weekCache = useRef<WeekCache>({});

    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

    // Helper function to format date as a key
    const formatDateKey = useCallback((date: Date) => {
        return format(date, 'yyyy-MM-dd');
    }, []);

    // Helper function to get Monday of a given date's week
    const getWeekKeyByDate = useCallback((date: Date) => {
        // Portuguese week starts on Monday (1)
        const monday = new Date(date);
        const day = monday.getDay();
        const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
        monday.setDate(diff);
        return formatDateKey(monday);
    }, [formatDateKey]);

    // General load method
    const loadWeekAppointments = useCallback(async (
        targetDate: Date,
        options: { force?: boolean; setCurrent?: boolean; expectedKey?: string } = {}
    ) => {
        const monday = new Date(targetDate);
        const day = monday.getDay();
        const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);

        const sunday = addDays(monday, 6);
        sunday.setHours(23, 59, 59, 999);

        const weekKey = formatDateKey(monday);

        // If expectedKey is provided and doesn't match, we might have navigated away
        if (options.expectedKey && options.expectedKey !== weekKey) {
            return [];
        }

        const now = Date.now();
        const cached = weekCache.current[weekKey];

        // Use valid cache if not forcing refresh
        if (!options.force && cached && cached.data && (now - cached.timestamp < CACHE_TTL)) {
            if (options.setCurrent) {
                setAppointments(cached.data);
            }
            return cached.data;
        }

        // Wait for in-flight requests to avoid duplication
        if (!options.force && cached && cached.promise) {
            setLoadingWeeks(prev => ({ ...prev, [weekKey]: true }));
            try {
                const data = await cached.promise;
                if (options.setCurrent && (!options.expectedKey || options.expectedKey === weekKey)) {
                    setAppointments(data);
                }
                return data;
            } finally {
                setLoadingWeeks(prev => ({ ...prev, [weekKey]: false }));
            }
        }

        // Actually fetch the data
        setLoadingWeeks(prev => ({ ...prev, [weekKey]: true }));

        const doFetch = async () => {
            try {
                const response = await marcacoesApi.consultarAgenda(
                    format(monday, "yyyy-MM-dd'T'HH:mm:ss"),
                    format(sunday, "yyyy-MM-dd'T'HH:mm:ss"),
                    tipo
                );
                const mapped = response.map(mapApiToAppointment);

                // Save to cache
                weekCache.current[weekKey] = {
                    data: mapped,
                    timestamp: Date.now(),
                    promise: null
                };

                return mapped;
            } catch (error) {
                console.error(`Erro ao carregar marcações para a semana de ${weekKey}:`, error);

                // Remove failed promise from cache
                if (weekCache.current[weekKey]?.promise === fetchPromise) {
                    weekCache.current[weekKey] = {
                        data: weekCache.current[weekKey]?.data || [], // Keep old data if possible
                        timestamp: 0,
                        promise: null
                    };
                }
                throw error;
            }
        };

        const fetchPromise = doFetch();

        // Store the promise in the cache to prevent duplicate requests
        weekCache.current[weekKey] = {
            data: cached?.data || [],
            timestamp: cached?.timestamp || 0,
            promise: fetchPromise
        };

        try {
            const data = await fetchPromise;
            if (options.setCurrent && (!options.expectedKey || options.expectedKey === weekKey)) {
                setAppointments(data);
            }
            return data;
        } finally {
            if (weekCache.current[weekKey]) {
                weekCache.current[weekKey].promise = null;
            }
            setLoadingWeeks(prev => ({ ...prev, [weekKey]: false }));
        }
    }, [formatDateKey]);

    const refreshCurrentWeek = useCallback(async (currentWeekStart: Date) => {
        return loadWeekAppointments(currentWeekStart, { force: true, setCurrent: true });
    }, [loadWeekAppointments]);

    // Pre-load a few weeks around the current date for smooth scrolling
    const preloadSurroundingWeeks = useCallback((centerDate: Date) => {
        loadWeekAppointments(addDays(centerDate, -7), { force: false, setCurrent: false });
        loadWeekAppointments(addDays(centerDate, 7), { force: false, setCurrent: false });
    }, [loadWeekAppointments]);

    const updateAppointmentOptimistically = useCallback((id: string, updates: Partial<Appointment>) => {
        // Update local state
        setAppointments(prev => prev.map(app =>
            app.id === id ? { ...app, ...updates } : app
        ));

        // Update cache across all weeks
        Object.keys(weekCache.current).forEach(weekKey => {
            if (weekCache.current[weekKey] && weekCache.current[weekKey].data) {
                weekCache.current[weekKey].data = weekCache.current[weekKey].data.map(app =>
                    app.id === id ? { ...app, ...updates } : app
                );
            }
        });
    }, []);

    return {
        appointments,
        loadingWeeks,
        loadWeekAppointments,
        refreshCurrentWeek,
        preloadSurroundingWeeks,
        updateAppointmentOptimistically,
        getWeekKeyByDate
    };
}
