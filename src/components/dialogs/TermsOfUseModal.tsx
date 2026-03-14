import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { FileText } from 'lucide-react';

interface TermsOfUseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}

export function TermsOfUseModal({ open, onOpenChange, onAccept }: Readonly<TermsOfUseModalProps>) {
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setHasReachedEnd(false);
      return;
    }

    const element = scrollContainerRef.current;
    if (!element) return;

    const fitsWithoutScroll = element.scrollHeight <= element.clientHeight + 1;
    if (fitsWithoutScroll) {
      setHasReachedEnd(true);
    }
  }, [open]);

  const handleTermsScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (hasReachedEnd) return;

    const element = event.currentTarget;
    const distanceToBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    if (distanceToBottom <= 8) {
      setHasReachedEnd(true);
    }
  };

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
            Termos e Privacidade
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400 mt-2">
            Por favor, leia atentamente os termos antes de aceitar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-gray-50 dark:from-gray-800/50 via-gray-50/80 dark:via-gray-800/40 to-transparent pointer-events-none z-10" />
          
          <div
            ref={scrollContainerRef}
            className="h-[60vh] px-6 py-4 overflow-y-auto"
            onScroll={handleTermsScroll}
          >
            <div className="space-y-5 text-sm text-gray-700 dark:text-gray-300 pr-4">
              <section className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-base text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold">1</span>
                {' '}
                Identificação do Responsável pelo Tratamento
              </h3>
              <p className="leading-relaxed">
                A presente Política de Privacidade regula o tratamento de dados pessoais realizado pela IPSS Florinhas do Vouga,
                pessoa colectiva n.º 501156577, com sede na Praceta Florinhas do Vouga, n.º 10, 3810-064 Aveiro.
              </p>
              <p className="leading-relaxed mt-2">
                Contactos:<br />
                Telefone: 234 377 330<br />
                Email: secretaria@florinhasdovouga.pt
              </p>
              <p className="leading-relaxed mt-2">
                A Instituição é uma IPSS de natureza diocesana, actuando no âmbito da sua missão social e comunitária.
              </p>
            </section>

            <section className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-base text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold">2</span>
                {' '}
                Compromisso com a Protecção de Dados
              </h3>
              <p className="leading-relaxed">
                A IPSS Florinhas do Vouga está empenhada na protecção dos dados pessoais dos seus Utentes,
                Beneficiários, Voluntários, Mecenas, Doadores, Benfeitores, Colaboradores, Parceiros e demais
                entidades que com ela interagem.
              </p>
              <p className="leading-relaxed mt-2">
                O tratamento de dados pessoais é realizado em conformidade com o Regulamento Geral sobre a
                Protecção de Dados (RGPD) e demais legislação nacional aplicável, assegurando os princípios da
                licitude, lealdade, transparência, minimização, exactidão, integridade e confidencialidade.
              </p>
            </section>

            <section className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-base text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold">3</span>
                {' '}
                Dados Pessoais Recolhidos
              </h3>
              <p className="leading-relaxed mb-2">
                Poderão ser recolhidos, entre outros, os seguintes dados:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Nome</li>
                <li>Número de identificação fiscal</li>
                <li>Contactos telefónicos</li>
                <li>Endereço de correio electrónico</li>
                <li>Morada</li>
                <li>Dados necessários à emissão de recibos</li>
                <li>Dados fornecidos voluntariamente através de formulários</li>
              </ul>
              <p className="leading-relaxed mt-2">
                A recolha ocorre apenas quando necessária e com fundamento legal adequado.
              </p>
            </section>

            <section className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-base text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold">4</span>
                {' '}
                Finalidade do Tratamento de Dados
              </h3>
              <p className="leading-relaxed">
                Os dados pessoais são tratados para as seguintes finalidades:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Gestão administrativa e institucional</li>
                <li>Processamento de donativos</li>
                <li>Comunicação institucional</li>
                <li>Gestão de voluntariado</li>
                <li>Cumprimento de obrigações legais</li>
                <li>Resposta a pedidos de contacto</li>
              </ul>
              <p className="leading-relaxed mt-2">
                Os dados não serão utilizados para finalidades incompatíveis com aquelas que motivaram a sua recolha.
              </p>
            </section>

            <section className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-base text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold">5</span>
                {' '}
                Conservação dos Dados
              </h3>
              <p className="leading-relaxed">
                Os dados pessoais serão conservados apenas pelo período necessário ao cumprimento das finalidades
                que determinaram a sua recolha ou pelo período exigido por obrigações legais.
              </p>
            </section>

            <section className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-base text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold">6</span>
                {' '}
                Direitos dos Titulares dos Dados
              </h3>
              <p className="leading-relaxed mb-2">
                Nos termos da lei, os titulares dos dados podem exercer os seguintes direitos:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Direito de acesso</li>
                <li>Direito de rectificação</li>
                <li>Direito ao apagamento</li>
                <li>Direito à limitação do tratamento</li>
                <li>Direito de oposição</li>
                <li>Direito à portabilidade, quando aplicável</li>
              </ul>
              <p className="leading-relaxed mt-2">
                O exercício destes direitos pode ser efectuado através do email: secretaria@florinhasdovouga.pt
              </p>
              <p className="leading-relaxed mt-2">
                Caso considere que os seus direitos não foram respeitados, poderá apresentar reclamação junto da
                Comissão Nacional de Protecção de Dados (CNPD).
              </p>
            </section>


            <section className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-base text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold">7</span>
                {' '}
                O que são Cookies
              </h3>
              <p className="leading-relaxed">
                Cookies são pequenos ficheiros de texto armazenados no dispositivo do utilizador quando visita um website,
                permitindo melhorar a experiência de navegação.
              </p>
            </section>

            <section className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-base text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold">8</span>
                {' '}
                Tipos de Cookies Utilizados
              </h3>
              <p className="leading-relaxed mb-2">
                O website poderá utilizar:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Cookies estritamente necessários ao funcionamento do site</li>
                <li>Cookies de desempenho e análise estatística (caso aplicável)</li>
                <li>Cookies de funcionalidade</li>
              </ul>
              <p className="leading-relaxed mt-2">
                Não são utilizados cookies para fins comerciais invasivos.
              </p>
            </section>

            <section className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-base text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold">9</span>
                {' '}
                Gestão de Cookies
              </h3>
              <p className="leading-relaxed">
                O utilizador pode, a qualquer momento, configurar o seu navegador para bloquear ou eliminar cookies.
              </p>
              <p className="leading-relaxed mt-2">
                A desactivação de determinados cookies poderá afectar o funcionamento do website.
              </p>
            </section>

            <section className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-base text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold">10</span>
                {' '}
                Alterações à Política
              </h3>
              <p className="leading-relaxed">
                A IPSS Florinhas do Vouga reserva-se o direito de actualizar a presente Política sempre que necessário,
                sendo as alterações publicadas no website.
              </p>
            </section>

            <section className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <p className="leading-relaxed">
                Para consultar a informação completa aceda ao site oficial:
              </p>
              <a
                href="https://www.florinhasdovouga.pt/7ca6c-terms-and-privacy/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-purple-700 dark:text-purple-300 hover:underline break-all"
              >
                https://www.florinhasdovouga.pt/7ca6c-terms-and-privacy/
              </a>
            </section>
          </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50 dark:from-gray-800/50 via-gray-50/80 dark:via-gray-800/40 to-transparent pointer-events-none z-10" />
        </div>

        <DialogFooter className="px-6 py-4 border-t border-purple-100 dark:border-purple-900/50 bg-gray-50 dark:bg-gray-800/50 gap-3 justify-end">
          {hasReachedEnd && (
            <Button
              onClick={handleAccept}
              className="bg-purple-600 hover:bg-purple-700 text-white transition-colors duration-200"
            >
              Li e aceito
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
