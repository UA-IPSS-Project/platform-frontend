import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { ExternalLink, FileText } from 'lucide-react';

interface TermsOfUseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}

export function TermsOfUseModal({ open, onOpenChange, onAccept }: TermsOfUseModalProps) {
  const handleAccept = () => {
    onAccept();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-purple-100 dark:border-purple-900/50 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            Termos de Uso e Política de Privacidade
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400 mt-2">
            Por favor, leia atentamente os termos antes de aceitar. Este documento descreve como tratamos os seus dados em conformidade com o RGPD.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-gray-50 dark:from-gray-800/50 via-gray-50/80 dark:via-gray-800/40 to-transparent pointer-events-none z-10" />
          
          <ScrollArea className="h-[60vh] px-6 py-4">
            <div className="space-y-5 text-sm text-gray-700 dark:text-gray-300 pr-4">
              <section className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-base text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold">1</span>
                Introdução
              </h3>
              <p className="leading-relaxed">
                Bem-vindo à plataforma de gestão de marcações da Instituição Particular de Solidariedade Social (IPSS) Florinhas do Vouga. 
                Ao utilizar esta plataforma, você concorda em cumprir estes Termos de Uso e a nossa Política de Privacidade, 
                em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD).
              </p>
            </section>

            <section className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-base text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold">2</span>
                Recolha e Tratamento de Dados Pessoais
              </h3>
              <p className="leading-relaxed mb-2">
                A plataforma recolhe e processa os seguintes dados pessoais:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Nome completo</li>
                <li>Número de Identificação Fiscal (NIF)</li>
                <li>Endereço de email</li>
                <li>Número de telefone</li>
                <li>Data de nascimento</li>
                <li>Informações relacionadas com marcações e serviços solicitados</li>
              </ul>
            </section>

            <section className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-base text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold">3</span>
                Finalidade do Tratamento de Dados
              </h3>
              <p className="leading-relaxed">
                Os seus dados pessoais são recolhidos e tratados exclusivamente para:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Gestão de marcações e agendamentos</li>
                <li>Comunicação relacionada com os serviços prestados</li>
                <li>Cumprimento de obrigações legais e regulamentares</li>
                <li>Melhoria dos serviços oferecidos pela IPSS</li>
              </ul>
            </section>

            <section className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-base text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold">4</span>
                Direitos dos Titulares dos Dados
              </h3>
              <p className="leading-relaxed mb-2">
                Em conformidade com o RGPD, você tem os seguintes direitos:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Direito de acesso:</strong> Pode solicitar acesso aos seus dados pessoais</li>
                <li><strong>Direito de retificação:</strong> Pode corrigir dados incorretos ou incompletos</li>
                <li><strong>Direito ao apagamento:</strong> Pode solicitar a eliminação dos seus dados</li>
                <li><strong>Direito à portabilidade:</strong> Pode receber os seus dados em formato estruturado</li>
                <li><strong>Direito de oposição:</strong> Pode opor-se ao tratamento dos seus dados</li>
              </ul>
            </section>

            <section className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-base text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold">5</span>
                Segurança dos Dados
              </h3>
              <p className="leading-relaxed">
                Implementamos medidas técnicas e organizacionais adequadas para proteger os seus dados pessoais contra 
                acesso não autorizado, alteração, divulgação ou destruição. Os dados são armazenados em servidores seguros 
                e apenas pessoal autorizado tem acesso aos mesmos.
              </p>
            </section>

            <section className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-base text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold">6</span>
                Conservação de Dados
              </h3>
              <p className="leading-relaxed">
                Os seus dados pessoais serão conservados apenas pelo período necessário para cumprir as finalidades 
                para as quais foram recolhidos, ou conforme exigido por lei.
              </p>
            </section>

            <section className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-base text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold">7</span>
                Partilha de Dados
              </h3>
              <p className="leading-relaxed">
                Os seus dados pessoais não serão partilhados com terceiros, exceto quando necessário para a prestação 
                dos serviços ou quando exigido por lei.
              </p>
            </section>

            <section className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-base text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold">8</span>
                Contacto
              </h3>
              <p className="leading-relaxed">
                Para exercer os seus direitos ou esclarecer dúvidas sobre o tratamento dos seus dados, 
                pode contactar-nos através do email: <strong>privacidade@florinhasdovouga.pt</strong>
              </p>
            </section>

            <div className="border-t border-purple-200 dark:border-purple-800 pt-4 mt-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 rounded-lg p-4">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  // TODO Aqui pode adicionar o link real para o PDF quando disponível
                  window.open('/docs/termos-uso.pdf', '_blank');
                }}
                className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Ler documento completo em PDF
              </a>
            </div>
          </div>
          </ScrollArea>
          
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50 dark:from-gray-800/50 via-gray-50/80 dark:via-gray-800/40 to-transparent pointer-events-none z-10" />
        </div>

        <DialogFooter className="px-6 py-4 border-t border-purple-100 dark:border-purple-900/50 bg-gray-50 dark:bg-gray-800/50 gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAccept}
            className="bg-purple-600 hover:bg-purple-700 text-white transition-colors duration-200"
          >
            Li e Concordo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
