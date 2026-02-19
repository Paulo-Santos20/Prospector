import { Copy, Check, X, FileText, Send, Sparkles } from 'lucide-react';
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

  // LÓGICA DE COPYWRITING INTELIGENTE (IA + DIAGNÓSTICO TÉCNICO)
  const generateCopy = () => {
    // Extraindo dados da IA (caso existam)
    const ai = analysis.aiData;
    const owner = ai?.ownerName || 'Responsável';
    const item = ai?.featuredItem || 'excelente trabalho';
    const aiPain = ai?.mainPainPoint;

    // 1. Saudação Personalizada
    const greeting = `Olá, ${owner}! Tudo bem?`;

    // 2. Quebra de gelo com Prova Social e Item em Destaque (IA)
    const intro = `Vi o perfil da ${lead.displayName.text} no Google e notei que vocês são referência na região, especialmente pelo trabalho com ${item} (vi as ${lead.userRatingCount} avaliações positivas!).`;
    
    // 3. Identificação da Dor (Prioriza a IA, depois o técnico)
    let painPoint = "";
    
    if (aiPain) {
      painPoint = `Analisei o site de vocês e notei um ponto crítico: ${aiPain}. Isso pode estar dificultando a conversão de novos clientes que chegam pelo Google.`;
    } else if (analysis.status === 'NO_WEBSITE') {
      painPoint = "Porém, notei que vocês ainda não possuem um site próprio. Hoje, mais de 80% das decisões de compra começam com uma busca, e depender apenas de terceiros (como iFood ou redes sociais) faz vocês perderem margem de lucro e o controle dos dados dos seus clientes.";
    } else if (!analysis.isResponsive) {
      painPoint = "Porém, analisei seu site e notei que a experiência no celular está comprometida. Como a maioria das buscas hoje é feita por smartphone, isso acaba frustrando potenciais clientes e fazendo você perder vendas para a concorrência.";
    } else if (!analysis.isSecure) {
      painPoint = "Porém, notei que seu site aparece como 'Não Seguro' nos navegadores. Além de transmitir falta de confiança, o Google penaliza o seu posicionamento, escondendo vocês de novos clientes.";
    } else {
      painPoint = "Notei que seu site já tem uma estrutura base, mas sinto que podemos modernizar a conversão para transformar mais visitantes em clientes reais através de um design focado em resultados.";
    }

    // 4. Proposta de Valor e Chamada para Ação
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-all">
      <div className="bg-surface border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header com indicador de IA */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-xl">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white leading-none">Proposta Inteligente</h2>
              {analysis.aiData && (
                <div className="flex items-center gap-1 mt-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-widest">Enriquecido com IA Real</span>
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Script de Abordagem Personalizado</p>
            {analysis.aiData?.ownerName && (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                Dono(a) identificado: {analysis.aiData.ownerName}
              </span>
            )}
          </div>
          
          <div className="bg-background border border-slate-800 rounded-2xl p-6 relative group shadow-inner">
            <pre className="text-slate-300 whitespace-pre-wrap font-sans text-sm leading-relaxed max-h-[400px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-700">
              {generateCopy()}
            </pre>
            <button 
              onClick={copyToClipboard}
              className="absolute top-4 right-4 p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-600 transition-all active:scale-90 shadow-lg group-hover:border-primary/50"
              title="Copiar texto"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={copyToClipboard}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all border border-slate-600 active:scale-95"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado para o Clipboard' : 'Copiar Script'}
            </button>
            <a 
              href={`https://wa.me/${lead.internationalPhoneNumber?.replace(/\D/g, '')}?text=${encodeURIComponent(generateCopy())}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Send className="w-4 h-4" /> 
              Enviar no WhatsApp
            </a>
          </div>
        </div>

        <div className="p-5 bg-slate-900/80 text-center border-t border-slate-800">
          <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
            Dica: Abordagens personalizadas com o nome do responsável e itens do cardápio/serviço <br /> têm 3x mais chance de receber uma resposta positiva.
          </p>
        </div>
      </div>
    </div>
  );
};