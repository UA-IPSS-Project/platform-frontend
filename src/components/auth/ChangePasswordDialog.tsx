import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { authApi } from '../../services/api';
import { Lock, Eye, EyeOff, Check, X } from 'lucide-react';

interface ChangePasswordDialogProps {
    open: boolean;
    onClose: () => void;
}

export function ChangePasswordDialog({ open, onClose }: ChangePasswordDialogProps) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Validation States
    const hasMinLen = password.length >= 8;
    const hasUpperLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);

    const isValid = hasMinLen && hasUpperLower && hasNumber && password === confirmPassword && password.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isValid) {
            return;
        }

        setLoading(true);
        try {
            await authApi.updatePassword(password, true); // termsAccepted=true pois já foi aceite ao criar conta
            toast.success('Palavra-passe alterada com sucesso');
            onClose();
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Erro ao alterar palavra-passe:', error);
            toast.error('Erro ao alterar palavra-passe');
        } finally {
            setLoading(false);
        }
    };

    const RequirementItem = ({ fulfilled, text }: { fulfilled: boolean; text: string }) => (
        <div className={`flex items-center gap-2 text-sm ${fulfilled ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
            {fulfilled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            <span>{text}</span>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-purple-600" />
                        Alterar Palavra-passe
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-password">Nova Palavra-passe</Label>
                        <div className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 shadow-sm focus-within:ring-1 focus-within:ring-ring">
                            <input
                                id="new-password"
                                type={showNewPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Introduza a nova palavra-passe"
                                className="flex-1 bg-transparent outline-none text-sm w-full h-full placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="ml-2 text-gray-500 hover:text-gray-700 outline-none flex-shrink-0"
                            >
                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Password Requirements */}
                        <div className="space-y-1 pt-1 ml-1">
                            <RequirementItem fulfilled={hasMinLen} text="Min. 8 caracteres" />
                            <RequirementItem fulfilled={hasUpperLower} text="Maiúsculas e minúsculas" />
                            <RequirementItem fulfilled={hasNumber} text="Números" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirmar Palavra-passe</Label>
                        <div className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 shadow-sm focus-within:ring-1 focus-within:ring-ring">
                            <input
                                id="confirm-password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirme a nova palavra-passe"
                                className="flex-1 bg-transparent outline-none text-sm w-full h-full placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="ml-2 text-gray-500 hover:text-gray-700 outline-none flex-shrink-0"
                            >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {password && confirmPassword && password !== confirmPassword && (
                            <p className="text-sm text-red-500 mt-1">As palavras-passe não coincidem</p>
                        )}
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            disabled={loading || !isValid}
                        >
                            {loading ? 'A guardar...' : 'Guardar Alterações'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
