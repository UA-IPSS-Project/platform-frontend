import { Appointment } from '../types';

export const mapApiToAppointment = (m: any): Appointment => {
    const dateTime = new Date(m.data);
    const utente = m.marcacaoSecretaria?.utente;

    // Mapear estado da API para o formato esperado
    let status: 'scheduled' | 'in-progress' | 'warning' | 'completed' | 'cancelled' | 'reserved' | 'no-show' = 'scheduled';

    // Use a safer check for optional chaining if needed, though 'm' implies it exists
    const estadoUpper = m.estado?.toUpperCase() || '';

    if (estadoUpper === 'EM_PREENCHIMENTO') status = 'reserved';
    else if (estadoUpper === 'AGENDADO') status = 'scheduled';
    else if (estadoUpper === 'EM_PROGRESSO' || estadoUpper === 'EM PROGRESSO') status = 'in-progress';
    else if (estadoUpper === 'AVISO') status = 'warning';
    else if (estadoUpper === 'CONCLUIDO') status = 'completed';
    else if (estadoUpper === 'CANCELADO') status = 'cancelled';
    else if (estadoUpper === 'NAO_COMPARECIDO') status = 'no-show';

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
