import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { authApi } from '../../services/api';
import { Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import { validatePassword, isPasswordValid as checkPasswordValid } from '../../lib/validations';
import { useTranslation } from 'react-i18next';

interface ChangePasswordDialogProps {
    open: boolean;
    onClose: () => void;
}

export function ChangePasswordDialog({ open, onClose }: ChangePasswordDialogProps) {
    const { t } = useTranslation();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Validation States
    const passwordValidation = validatePassword(password);
    const isPasswordValid = checkPasswordValid(password);

    const isValid = isPasswordValid && password === confirmPassword && password.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isValid) {
            return;
        }

        setLoading(true);
        try {
            await authApi.updatePassword(password, true); // termsAccepted=true pois já foi aceite ao criar conta
            toast.success(t('auth.passwordChangedSuccess'));
            onClose();
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Erro ao alterar palavra-passe:', error);
            toast.error(t('auth.passwordChangedError'));
        } finally {
            setLoading(false);
        }
    };

    const RequirementItem = ({ fulfilled, text }: { fulfilled: boolean; text: string }) => (
        <div className={`flex items-center gap-2 text-sm ${fulfilled ? 'text-status-success' : 'text-muted-foreground'}`}>
            {fulfilled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            <span>{text}</span>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-primary" />
                        {t('auth.changePasswordTitle')}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-password">{t('auth.newPassword')}</Label>
                        <div className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 shadow-sm focus-within:ring-1 focus-within:ring-ring">
                            <input
                                id="new-password"
                                type={showNewPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t('auth.changePasswordNewPlaceholder')}
                                className="flex-1 bg-transparent outline-none text-sm w-full h-full placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="ml-2 text-muted-foreground hover:text-foreground outline-none flex-shrink-0"
                            >
                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Password Requirements */}
                        <div className="space-y-1 pt-1 ml-1">
                            <RequirementItem fulfilled={passwordValidation.minLength} text={t('auth.passwordRuleMinLength')} />
                            <RequirementItem fulfilled={passwordValidation.hasUpperLower} text={t('auth.passwordRuleCases')} />
                            <RequirementItem fulfilled={passwordValidation.hasNumber} text={t('auth.passwordRuleNumbers')} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">{t('auth.confirmPassword')}</Label>
                        <div className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 shadow-sm focus-within:ring-1 focus-within:ring-ring">
                            <input
                                id="confirm-password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder={t('auth.changePasswordConfirmPlaceholder')}
                                className="flex-1 bg-transparent outline-none text-sm w-full h-full placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="ml-2 text-muted-foreground hover:text-foreground outline-none flex-shrink-0"
                            >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {password && confirmPassword && password !== confirmPassword && (
                            <p className="text-sm text-status-error mt-1">{t('auth.passwordsDoNotMatch')}</p>
                        )}
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            {t('appointmentDialog.actions.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                            disabled={loading || !isValid}
                        >
                            {loading ? t('common.saving') : t('auth.saveChanges')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
