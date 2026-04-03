
import { Button } from '../../components/ui/button';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EyeIcon } from '../../components/shared/CustomIcons';
import { Plus } from 'lucide-react';

interface UserCandidaturasProps {
    user: {
        name: string;
        nif: string;
        contact: string;
        email: string;
    }
    onLogout: () => void;
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
    candidaturaType: string;
}

export function UserCandidaturas({ user }: UserCandidaturasProps) {
	const { t } = useTranslation();
	const [statusFilter, setStatusFilter] = useState('all');
	const [dayFilter, setDayFilter] = useState('');
	const [appliedStatusFilter, setAppliedStatusFilter] = useState('all');
	const [appliedDayFilter, setAppliedDayFilter] = useState('');
	const [selectedApplicationCode, setSelectedApplicationCode] = useState<string | null>(null);

	const candidaturasMock = [
		{
			code: '#CAND-2026-001',
			status: 'pending',
			statusLabel: t('applications.status.pending', 'Pendente'),
			statusClass: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
			description: t('applications.card.description', 'Candidatura submetida para avaliacao inicial.'),
			date: '2026-04-03',
		},
		{
			code: '#CAND-2026-002',
			status: 'approved',
			statusLabel: t('applications.status.approved', 'Aprovada'),
			statusClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
			description: t('applications.card.description', 'Candidatura submetida para avaliacao inicial.'),
			date: '2026-04-01',
		},
	];

	const filteredCandidaturas = candidaturasMock.filter((candidatura) => {
		const matchesStatus = appliedStatusFilter === 'all' || candidatura.status === appliedStatusFilter;
		const matchesDay = !appliedDayFilter || candidatura.date === appliedDayFilter;
		return matchesStatus && matchesDay;
	});

	const handleApplyFilters = () => {
		setAppliedStatusFilter(statusFilter);
		setAppliedDayFilter(dayFilter);
	};

	const handleClearFilters = () => {
		setStatusFilter('all');
		setDayFilter('');
		setAppliedStatusFilter('all');
		setAppliedDayFilter('');
	};

	const handleViewApplication = (applicationCode: string) => {
		setSelectedApplicationCode(applicationCode);
	};

	const formatDate = (isoDate: string) => {
		const [year, month, day] = isoDate.split('-');
		return `${day}/${month}/${year}`;
	};

	return (
			<div className="max-w-6xl mx-auto mt-4 p-6 sm:p-8 bg-white/95 dark:bg-gray-900/95 rounded-2xl shadow-lg border border-purple-200 dark:border-purple-800">
				<div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-5 mb-6 bg-gray-50/70 dark:bg-gray-800/40">
					<div className="flex flex-col md:flex-row md:items-end gap-4">
						<div className="flex-1">
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
								{t('applications.filters.status', 'Estado')}
							</label>
							<select
								value={statusFilter}
								onChange={(event) => setStatusFilter(event.target.value)}
								className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
							>
								<option value="all">{t('applications.status.all', 'Todos')}</option>
								<option value="pending">{t('applications.status.pending', 'Pendente')}</option>
								<option value="approved">{t('applications.status.approved', 'Aprovada')}</option>
								<option value="rejected">{t('applications.status.rejected', 'Rejeitada')}</option>
							</select>
						</div>

						<div className="flex-1">
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
								{t('applications.filters.day', 'Dia')}
							</label>
							<input
								type="date"
								value={dayFilter}
								onChange={(event) => setDayFilter(event.target.value)}
								className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
							/>
						</div>

						<div className="md:ml-auto flex flex-col sm:flex-row gap-2 w-full md:w-auto">
							<Button
								onClick={handleApplyFilters}
								className="w-full md:w-auto bg-gray-800 hover:bg-gray-900 text-white dark:bg-gray-700 dark:hover:bg-gray-600"
							>
								{t('applications.applyFilters', 'Aplicar filtros')}
							</Button>
							<Button
								onClick={handleClearFilters}
								variant="outline"
								className="w-full md:w-auto"
							>
								{t('applications.clearFilters', 'Retirar filtros')}
							</Button>
							<Button className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white gap-2">
								<Plus className="w-4 h-4" />
								{t('applications.newApplication', 'Nova Candidatura')}
							</Button>
						</div>
					</div>
				</div>

				<div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-5 bg-white/70 dark:bg-gray-900/40">
					<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
						{t('applications.listTitle', 'As Minhas Candidaturas')}
					</h2>

					{selectedApplicationCode && (
						<p className="text-sm text-purple-700 dark:text-purple-300 mb-4">
							{t('applications.viewing', 'A visualizar dados da candidatura')} {selectedApplicationCode}
						</p>
					)}

					{filteredCandidaturas.length > 0 ? (
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
							{filteredCandidaturas.map((candidatura) => (
								<div key={candidatura.code} className="rounded-xl border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950/30 p-5 shadow-sm">
									<div className="flex items-start justify-between gap-4 mb-3">
										<div />
										<span className={`px-2.5 py-1 text-xs font-medium rounded-full ${candidatura.statusClass}`}>
											{candidatura.statusLabel}
										</span>
									</div>

									<p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
										{candidatura.description}
									</p>

									<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
										<div>
											<p className="text-gray-500 dark:text-gray-400">{t('applications.card.date', 'Data')}</p>
											<p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(candidatura.date)}</p>
										</div>
										<div>
											<p className="text-gray-500 dark:text-gray-400">{t('applications.card.candidate', 'Candidato')}</p>
											<p className="font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
										</div>
										<div className="flex items-end sm:justify-end">
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleViewApplication(candidatura.code)}
												className="gap-2"
												aria-label={`${t('applications.view', 'Ver')} ${candidatura.code}`}
											>
												<EyeIcon className="w-4 h-4" />
												{t('applications.view', 'Ver')}
											</Button>
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						<p className="text-sm text-gray-600 dark:text-gray-300">
							{t('applications.noResults', 'Nao existem candidaturas para os filtros selecionados.')}
						</p>
					)}
				</div>
			</div>
	);
}
