import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { marcacoesApi } from '../services/api';
import type { Appointment } from '../types';

export function useAppointments(userId: number | undefined, userNif: string | undefined) {
    const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
    const [blockedAppointments, setBlockedAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadAppointments = async () => {
        if (!userId) return;

        setIsLoading(true);
        try {
            // Carregar marcações próprias
            const response = await marcacoesApi.obterPorUtente(userId);
            const marcacoes = Array.isArray(response) ? response : [];

            // Converter formato da API para o formato do componente
            const appointmentsFromAPI: Appointment[] = marcacoes.map((m) => {
                const dataHora = new Date(m.data);

                // Mapear estado da API para o formato esperado
                let status: 'scheduled' | 'in-progress' | 'warning' | 'completed' | 'cancelled' | 'no-show' = 'scheduled';
                if (m.estado) {
                    const estadoUpper = m.estado.toUpperCase();
                    if (estadoUpper === 'AGENDADO') status = 'scheduled';
                    else if (estadoUpper === 'EM_PROGRESSO' || estadoUpper === 'EM PROGRESSO') status = 'in-progress';
                    else if (estadoUpper === 'AVISO') status = 'warning';
                    else if (estadoUpper === 'CONCLUIDO') status = 'completed';
                    else if (estadoUpper === 'CANCELADO') status = 'cancelled';
                    else if (estadoUpper === 'NAO_COMPARECIDO') status = 'no-show';
                }

                return {
                    id: m.id.toString(),
                    date: dataHora,
                    time: `${dataHora.getHours().toString().padStart(2, '0')}:${dataHora.getMinutes().toString().padStart(2, '0')}`,
                    duration: 15,
                    patientNIF: userNif || '',
                    patientName: '', // será preenchido externamente
                    patientContact: '',
                    patientEmail: '',
                    subject: m.marcacaoSecretaria?.assunto || 'Sem assunto',
                    description: m.marcacaoSecretaria?.descricao || '',
                    status: status,
                    attendantName: m.atendenteNome,
                    cancellationReason: m.motivoCancelamento,
                };
            });

            setAllAppointments(appointmentsFromAPI);

            const bloqueadasResponse = await marcacoesApi.obterMarcacoesBloqueadas(userId);
            const bloqueadas = Array.isArray(bloqueadasResponse) ? bloqueadasResponse : [];
            const blockedFromAPI: Appointment[] = bloqueadas.map((b: any) => {
                const dataHora = new Date(b.data);
                const isReserved = b.estado === 'EM_PREENCHIMENTO';

                return {
                    id: b.id.toString(),
                    date: dataHora,
                    time: `${dataHora.getHours().toString().padStart(2, '0')}:${dataHora.getMinutes().toString().padStart(2, '0')}`,
                    duration: 15,
                    patientNIF: '',
                    patientName: isReserved ? 'Reservado' : 'Ocupado',
                    patientContact: '',
                    patientEmail: '',
                    subject: isReserved ? 'Horário Indisponível' : 'Ocupado',
                    description: '',
                    status: isReserved ? 'reserved' : 'scheduled',
                };
            });

            setBlockedAppointments(blockedFromAPI);
        } catch (error) {
            console.error('Erro ao carregar marcações:', error);
            toast.error('Erro ao carregar marcações');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAppointments();
        const interval = setInterval(loadAppointments, 60000);
        return () => clearInterval(interval);
    }, [userId]);

    return {
        allAppointments,
        blockedAppointments,
        isLoading,
        refreshAppointments: loadAppointments,
        setAllAppointments
    };
}
