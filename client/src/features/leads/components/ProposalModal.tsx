import { Copy, Check, X, FileText, Send } from 'lucide-react';
import { useState } from 'react';
import { type Lead } from '../../search/services/searchService';

interface ProposalModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

export const ProposalModal = ({ lead, isOpen, onClose }: ProposalModalProps) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const { analysis } = lead;

  // LÓGICA DE COPYWRITING AUTOMÁTICA
  const generateCopy = () => {
    const greeting = "Olá, tudo bem?";
    const intro = `Vi o perfil da ${lead.displayName.text} no Google e notei que vocês estão fazendo um excelente trabalho (vi as ${lead.userRatingCount} avaliações!).`;
    
    let painPoint = "";
    if (analysis.status === 'NO_WEBSITE') {
      painPoint = "Porém, notei que vocês ainda não possuem um site próprio. Hoje, 80% dos clientes pesquisam o site antes de decidir, e depender apenas de redes sociais ou iFood faz vocês perderem margem e controle.";
    } else if (!analysis.isResponsive) {
      painPoint = "Porém, analisei seu site e notei que ele não funciona bem no celular. Como a maioria das buscas hoje é via smartphone, vocês podem estar perdendo clientes que acham o site difícil de navegar.";
    } else if (!analysis.isSecure) {
      painPoint = "Porém, notei que seu site aparece como 'Não Seguro' no navegador. Isso afasta clientes e faz o Google penalizar o posicionamento de vocês nas buscas.";
    } else {
      painPoint = "Notei que seu site já tem uma boa base, mas sinto que podemos modernizar a conversão para atrair ainda mais clientes locais.";
    }

    const solution = "Eu trabalho com aceleração digital para negócios locais e montei uma proposta de como podemos resolver isso rapidamente para aumentar suas vendas.";
    const cta = "Podemos conversar 5 minutos por aqui ou por telefone?";

    return `${greeting}\n\n${intro}\n\n${painPoint}\n\n${solution}\n\n${cta}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateCopy());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-surface border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-white">Proposta Comercial</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <p className="text-sm text-slate-400 mb-4 font-medium uppercase tracking-wider">Script de Abordagem Sugerido:</p>
          <div className="bg-background border border-slate-800 rounded-xl p-6 relative group">
            <pre className="text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
              {generateCopy()}
            </pre>
            <button 
              onClick={copyToClipboard}
              className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 transition-all active:scale-90"
              title="Copiar texto"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={copyToClipboard}
              className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition"
            >
              {copied ? 'Copiado!' : 'Copiar Texto'}
            </button>
            <a 
              href={`https://wa.me/${lead.internationalPhoneNumber?.replace(/\D/g, '')}?text=${encodeURIComponent(generateCopy())}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition"
            >
              <Send className="w-4 h-4" /> Enviar via WhatsApp
            </a>
          </div>
        </div>

        <div className="p-4 bg-slate-900/50 text-center">
          <p className="text-[10px] text-slate-500 italic">Personalize o script acima antes de enviar para torná-lo ainda mais humano.</p>
        </div>
      </div>
    </div>
  );
};