import { useParams } from 'react-router-dom';
import { CandidaturasByTypePage } from '../candidaturas/CandidaturasByTypePage';
import { useAuth } from '../../contexts/AuthContext';

interface UserCandidaturasProps {
  user: {
    name: string;
    nif: string;
    contact: string;
    email: string;
  };
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export function UserCandidaturas({ user }: Readonly<UserCandidaturasProps>) {
  const { user: authUser } = useAuth();
  const { candidaturaType = 'creche' } = useParams();

  return (
    <CandidaturasByTypePage
      mode="utente"
      candidaturaType={candidaturaType}
      currentUserName={user.name}
      currentUserId={authUser?.id}
    />
  );
}
