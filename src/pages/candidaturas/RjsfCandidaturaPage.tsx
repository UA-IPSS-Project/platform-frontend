import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { RjsfCandidaturaForm } from '../../components/rjsf/RjsfCandidaturaForm';
import { CandidaturasCard } from '../../components/candidaturas/CandidaturasCard';

export function RjsfCandidaturaPage() {
  const navigate = useNavigate();
  const { candidaturaType } = useParams();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Button variant="outline" onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/dashboard')}>
            Voltar
          </Button>
        </div>

        <CandidaturasCard className="p-6 md:p-8">
          <RjsfCandidaturaForm
            showPreview={false}
            showTitle={true}
            candidaturaType={candidaturaType}
          />
        </CandidaturasCard>
      </div>
    </div>
  );
}

