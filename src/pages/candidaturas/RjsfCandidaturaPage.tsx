import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { RjsfCandidaturaForm } from './rjsf/RjsfCandidaturaForm';

export function RjsfCandidaturaPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Voltar ao dashboard
          </Button>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-6 md:p-8 shadow-xl">
          <RjsfCandidaturaForm showPreview={true} showTitle={true} />
        </div>
      </div>
    </div>
  );
}

