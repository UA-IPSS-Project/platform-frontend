import { RegisterForm } from '../../components/auth/RegisterForm';
import { useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12">
      <RegisterForm 
        onNavigateToLogin={() => navigate('/login')}
        initialAccountType="user"
      />
    </div>
  );
}
