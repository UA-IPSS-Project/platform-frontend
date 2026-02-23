import { Appointment } from '../types';

export const mapStatusFromApiToUi = (estado: string | undefined): 'scheduled' | 'in-progress' | 'warning' | 'completed' | 'cancelled' | 'reserved' | 'no-show' => {
    const estadoUpper = estado?.toUpperCase() || '';
    if (estadoUpper === 'EM_PREENCHIMENTO') return 'reserved';
    if (estadoUpper === 'AGENDADO') return 'scheduled';
    if (estadoUpper === 'EM_PROGRESSO' || estadoUpper === 'EM PROGRESSO') return 'in-progress';
    if (estadoUpper === 'AVISO') return 'warning';
    if (estadoUpper === 'CONCLUIDO') return 'completed';
    if (estadoUpper === 'CANCELADO') return 'cancelled';
    if (estadoUpper === 'NAO_COMPARECIDO') return 'no-show';
    return 'scheduled';
};

export const mapApiToAppointment = (m: any): Appointment => {
    const dateTime = new Date(m.data);
    const utente = m.marcacaoSecretaria?.utente;

    const status = mapStatusFromApiToUi(m.estado);

    return {
        id: m.id.toString(),
        version: m.version,
        date: dateTime,
        time: dateTime.toTimeString().slice(0, 5),
        duration: 15,
        patientNIF: status === 'reserved' ? '' : (utente?.nif || 'N/A'),
        patientName: status === 'reserved' ? 'reserved' : (utente?.nome || 'Nome não disponível'),
        patientContact: status === 'reserved' ? '' : (utente?.telefone || 'N/A'),
        patientEmail: status === 'reserved' ? '' : (utente?.email || 'Email não disponível'),
        subject: status === 'reserved' ? 'reserved' : (m.marcacaoSecretaria?.assunto || 'Sem assunto'),
        description: status === 'reserved' ? '' : (m.marcacaoSecretaria?.descricao || ''),
        status: status,
        cancellationReason: status === 'cancelled' ? (m.motivoCancelamento || m.marcacaoSecretaria?.motivoCancelamento || 'Motivo não especificado') : undefined,
        attendantName: m.atendenteNome,
    };
};

export const getCurrentActivity = (appointments: Appointment[], isSecretary: boolean = false): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const todayAppointments = appointments
        .filter(apt => {
            const aptDate = new Date(apt.date);
            aptDate.setHours(0, 0, 0, 0);
            return aptDate.getTime() === today.getTime() && apt.status !== 'cancelled';
        })
        .sort((a, b) => {
            const [aHour, aMin] = a.time.split(':').map(Number);
            const [bHour, bMin] = b.time.split(':').map(Number);
            return (aHour * 60 + aMin) - (bHour * 60 + bMin);
        });

    const inProgressApt = todayAppointments.find(apt => apt.status === 'in-progress');
    if (inProgressApt) {
        if (isSecretary && inProgressApt.patientName && inProgressApt.patientName !== 'reserved' && inProgressApt.patientName !== 'Ocupado' && inProgressApt.patientName !== 'Nome não disponível') {
            return `Atendimento a decorrer - ${inProgressApt.patientName}`;
        }
        return `Atendimento a decorrer`;
    }

    for (const apt of todayAppointments) {
        const [hour, minute] = apt.time.split(':').map(Number);
        const aptTime = hour * 60 + minute;

        if (currentTime < aptTime) {
            const diff = aptTime - currentTime;
            const hours = Math.floor(diff / 60);
            const minutes = diff % 60;
            if (hours > 0) return `Próximo agendamento em ${hours} hora${hours > 1 ? 's' : ''} e ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
            return `Próximo agendamento em ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
        }
    }
    return 'Ainda não existem marcações para hoje';
};
