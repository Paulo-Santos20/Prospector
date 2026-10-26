import { Copy, Check, X, FileText, Send, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { type Lead } from '../../search/services/searchService';

interface ProposalModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

export const ProposalModal = ({ lead, isOpen, onClose }: ProposalModalProps) => {
  const [copied, setCopied] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const { analysis } = lead;
  const ai = analysis.aiData;

  const generateCopy = () => {
    const item = ai?.featuredItem || 'excelente trabalho';
    const aiPain = ai?.mainPainPoint;

    const greeting = 'Olá! Tudo bem?';

    const intro = `Vi o perfil da ${lead.displayName.text} no Google e notei que vocês são referência na região, especialmente pelo trabalho com ${item} (vi as ${lead.userRatingCount || 'várias'} avaliações positivas!).`;
    
    let painPoint = "";
    
    if (aiPain) {
      painPoint = `Analisei o site de vocês e notei um ponto crítico: ${aiPain}. Isso pode estar dificultando a conversão de novos clientes que chegam pelo Google.`;
    } else if (analysis.status === 'NO_WEBSITE') {
      painPoint = "Porém, notei que vocês ainda não possuem um site próprio. Hoje, mais de 80% das decisões de compra começam com uma busca, e depender apenas de terceiros (como iFood ou redes sociais) faz vocês perderem margem de lucro e o controle dos dados dos seus clientes.";
    } else if (analysis.isResponsive === false) { 
      painPoint = "Porém, analisei seu site e notei que a experiência no celular está comprometida. Como a maioria das buscas hoje é feita por smartphone, isso acaba frustrando potenciais clientes e fazendo você perder vendas para a concorrência.";
    } else if (analysis.isSecure === false) { 
      painPoint = "Porém, notei que seu site aparece como 'Não Seguro' nos navegadores. Além de transmitir falta de confiança, o Google penaliza o seu posicionamento, escondendo vocês de novos clientes.";
    } else {
      painPoint = "Notei que seu site já tem uma estrutura base, mas sinto que podemos modernizar a conversão para transformar mais visitantes em clientes reais através de um design focado em resultados.";
    }

    const solution = `Eu ajudo negócios como o seu a profissionalizarem essa presença digital. Criei um modelo de como podemos otimizar o site da ${lead.displayName.text} para que ele venda tanto quanto a sua operação física.`;
    const cta = `Podemos conversar 5 minutos para eu te mostrar como aplicar isso?`;

    return `${greeting}\n\n${intro}\n\n${painPoint}\n\n${solution}\n\n${cta}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateCopy());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="proposal-modal-title"
        className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-surface shadow-2xl sm:rounded-3xl"
      >
        
        <div className="flex items-center justify-between gap-3 border-b border-slate-700 bg-slate-800/50 p-4 sm:p-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="shrink-0 rounded-xl bg-primary/20 p-2">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 id="proposal-modal-title" className="truncate text-lg font-black leading-none text-white sm:text-xl">Proposta Inteligente</h2>
              {ai && (
                <div className="mt-1 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Enriquecido com IA Real</span>
                </div>
              )}
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar proposta"
            className="shrink-0 rounded-full p-2.5 text-slate-400 transition-all hover:bg-slate-700 hover:text-white"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-8">
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Script de Abordagem Personalizado</p>
          
          <div className="relative rounded-2xl border border-slate-800 bg-background p-4 shadow-inner sm:p-6">
            <pre className="max-h-[40vh] overflow-y-auto whitespace-pre-wrap pr-14 font-sans text-sm leading-relaxed text-slate-300 scrollbar-thin sm:max-h-[400px]">
              {generateCopy()}
            </pre>
            <button 
              type="button"
              onClick={copyToClipboard}
              className="absolute right-3 top-3 rounded-xl border border-slate-600 bg-slate-800 p-2.5 shadow-lg transition-all hover:bg-slate-700 active:scale-90 sm:right-4 sm:top-4"
              title="Copiar texto"
              aria-label="Copiar script"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-slate-400" />}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4">
            <button
              type="button"
              onClick={copyToClipboard}
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-600 bg-slate-800 py-3.5 font-bold text-white transition-all hover:bg-slate-700 active:scale-95 sm:py-4"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copiado para o Clipboard' : 'Copiar Script'}
            </button>
            <a 
              href={`https://wa.me/${lead.internationalPhoneNumber?.replace(/\D/g, '')}?text=${encodeURIComponent(generateCopy())}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 font-black text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-500 active:scale-95 sm:py-4"
            >
              <Send className="h-4 w-4" /> Enviar no WhatsApp
            </a>
          </div>
        </div>

        <div className="border-t border-slate-800 bg-slate-900/80 p-4 text-center sm:p-5">
          <p className="text-[10px] font-medium italic leading-relaxed text-slate-500">
            Dica: Abordagens personalizadas com detalhes do negócio <br className="hidden sm:block" /> têm 3x mais chance de receber uma resposta positiva.
          </p>
        </div>
      </div>
    </div>
  );
};
