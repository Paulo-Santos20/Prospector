import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileDown, Edit3, Sparkles, Image as ImageIcon } from 'lucide-react';
import { type Lead } from '../features/search/services/searchService';

// Componente para imagens editáveis na proposta
const EditableImage = ({ defaultImg, alt }: { defaultImg: string, alt: string }) => {
  const [src, setSrc] = useState(defaultImg);

  const handleChangeImage = () => {
    const newUrl = prompt("Cole o link (URL) da imagem que deseja usar aqui:", src);
    if (newUrl) setSrc(newUrl);
  };

  return (
    <div className="relative group cursor-pointer rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50" onClick={handleChangeImage}>
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white font-bold z-10 print:hidden backdrop-blur-sm">
        <ImageIcon className="w-8 h-8 mb-2" />
        <span className="text-xs uppercase tracking-widest">Trocar Imagem</span>
      </div>
      <img src={src} alt={alt} className="w-full h-64 object-cover object-center group-hover:scale-105 transition-transform duration-500" />
    </div>
  );
};

export default function ProposalBuilderPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const lead = location.state?.lead as Lead;

  // Preços editáveis
  const [priceZeus, setPriceZeus] = useState('2.497,00');
  const [priceHermesSetup, setPriceHermesSetup] = useState('1.497,00');
  const [priceHermesMonthly, setPriceHermesMonthly] = useState('197,00');
  const [priceAthena, setPriceAthena] = useState('150,00');
  
  if (!lead) return <div className="p-10 text-white font-black">Lead não encontrado. Volte e selecione um cliente.</div>;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 pb-20">
      {/* BARRA DE CONTROLE (Escondida na impressão) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface border border-slate-700 p-4 rounded-full shadow-2xl flex items-center gap-4 z-50 print:hidden backdrop-blur-md w-[90%] max-w-3xl overflow-x-auto">
        <button onClick={() => navigate(-1)} className="p-3 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-all shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="h-8 w-px bg-slate-700 shrink-0"></div>
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 px-4 whitespace-nowrap">
          <Edit3 className="w-4 h-4 shrink-0" /> Clique nos textos para editar e nas imagens para trocar
        </div>
        <div className="h-8 w-px bg-slate-700 shrink-0"></div>
        <button onClick={handlePrint} className="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-full font-black text-sm flex items-center gap-2 transition-all shadow-[0_0_20px_#3B82F650] shrink-0 ml-auto">
          <FileDown className="w-5 h-5" /> Exportar PDF (A4)
        </button>
      </div>

      {/* ÁREA DA PROPOSTA (Estilo A4) */}
      {/* Adicionado WebkitPrintColorAdjust para forçar as cores exatas na impressão */}
      <div className="w-full max-w-[210mm] mx-auto mt-10 print:mt-0 shadow-2xl print:shadow-none bg-slate-950 overflow-hidden text-slate-200" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
        
        {/* ================= PÁGINA 1: CAPA ================= */}
        <div className="w-full h-[297mm] p-16 flex flex-col justify-center relative break-after-page border-b-8 border-amber-500 overflow-hidden">
          {/* Efeito visual de fundo */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-amber-500/10 blur-[150px] pointer-events-none rounded-full -translate-y-1/4 translate-x-1/3"></div>
          
          <div className="mb-20 relative z-10">
            <h2 className="text-2xl font-black tracking-[0.4em] text-amber-500 uppercase mb-2">Olimpo Soluções</h2>
            <p className="text-sm text-slate-400 font-medium uppercase tracking-widest">O Novo Padrão Web</p>
          </div>

          <h1 className="text-6xl font-black text-white leading-tight mb-8 relative z-10" suppressContentEditableWarning contentEditable>
            Eleve sua Empresa ao <br/>Panteão Digital
          </h1>
          <p className="text-xl text-slate-400 max-w-lg mb-16 relative z-10" suppressContentEditableWarning contentEditable>
            Apresentamos a arquitetura digital definitiva para transformar visitantes em clientes fiéis.
          </p>
          
          <div className="mt-auto border-l-4 border-amber-500 pl-6 relative z-10">
            <p className="text-sm text-slate-500 uppercase tracking-widest mb-1 font-bold">Desenvolvido sob medida para</p>
            <p className="text-4xl font-black text-white" suppressContentEditableWarning contentEditable>{lead.displayName.text}</p>
          </div>
        </div>

        {/* ================= PÁGINA 2: O CAOS & A SOLUÇÃO ================= */}
        <div className="w-full h-[297mm] p-16 flex flex-col relative break-after-page bg-[#0B0F19] border-b-8 border-primary">
          <div className="mb-10">
            <h3 className="text-sm font-black text-red-500 uppercase tracking-[0.3em] mb-2">O Caos</h3>
            <h2 className="text-4xl font-black text-white mb-4" suppressContentEditableWarning contentEditable>A "velha era" está afastando seus clientes</h2>
            <p className="text-md text-slate-400 leading-relaxed" suppressContentEditableWarning contentEditable>
              No mercado atual, não possuir uma infraestrutura própria significa perder autoridade. Clientes modernos não confiam em negócios difíceis de encontrar ou que dependem exclusivamente de plataformas de terceiros.
            </p>
          </div>

          <div className="mb-10">
            {/* Placeholder da Imagem 1: Caos/Frustração */}
            <EditableImage defaultImg="https://images.unsplash.com/photo-1555622900-3756209eefc6?q=80&w=1000&auto=format&fit=crop" alt="O Caos" />
          </div>

          <div className="grid grid-cols-2 gap-6 mt-auto">
            <div className="p-5 bg-red-950/30 border border-red-900/50 rounded-2xl">
              <h4 className="text-red-400 font-bold mb-2 text-lg">Sites Lentos</h4>
              <p className="text-sm text-slate-400 leading-relaxed" suppressContentEditableWarning contentEditable>Páginas que demoram eternidades para carregar fazem potenciais clientes desistirem antes mesmo de conhecer seu serviço.</p>
            </div>
            <div className="p-5 bg-red-950/30 border border-red-900/50 rounded-2xl">
              <h4 className="text-red-400 font-bold mb-2 text-lg">Não Responsivos & Feios</h4>
              <p className="text-sm text-slate-400 leading-relaxed" suppressContentEditableWarning contentEditable>Layouts quebrados no celular e design ultrapassado transmitem uma mensagem errada sobre a qualidade do que você oferece.</p>
            </div>
          </div>
        </div>

        {/* ================= PÁGINA 3: A SOLUÇÃO (ACORDE'S & HEFESTO) ================= */}
        <div className="w-full h-[297mm] p-16 flex flex-col relative break-after-page bg-slate-900 border-b-8 border-emerald-500">
          <div className="mb-8">
            <h3 className="text-sm font-black text-emerald-500 uppercase tracking-[0.3em] mb-2">A Solução Divina</h3>
            <h2 className="text-4xl font-black text-white" suppressContentEditableWarning contentEditable>Como Apolo, trazemos a luz para o seu negócio</h2>
          </div>

          <div className="mb-10">
            {/* Placeholder da Imagem 2/3: Hefesto forjando / Tecnologia */}
            <EditableImage defaultImg="https://images.unsplash.com/photo-1533077162812-ebc52ec1e171?q=80&w=1000&auto=format&fit=crop" alt="A Força de Hefesto" />
          </div>

          <div className="mt-auto bg-slate-950/50 p-8 rounded-3xl border border-slate-800">
            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
              <Sparkles className="text-emerald-500 w-6 h-6" /> A Força de Hefesto
            </h3>
            <p className="text-slate-400 mb-6 italic" suppressContentEditableWarning contentEditable>Diferenciais Técnicos que Constroem o Impossível:</p>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <h4 className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-1">Design UX/UI de Excelência</h4>
                <p className="text-xs text-slate-400" suppressContentEditableWarning contentEditable>Cada pixel é estrategicamente pensado para converter simples visitantes em clientes fiéis e pagantes.</p>
              </div>
              <div>
                <h4 className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-1">Mobile-First Impecável</h4>
                <p className="text-xs text-slate-400" suppressContentEditableWarning contentEditable>Experiência perfeita em qualquer dispositivo, priorizando os smartphones, onde seus clientes realmente estão.</p>
              </div>
              <div>
                <h4 className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-1">Velocidade de Hermes</h4>
                <p className="text-xs text-slate-400" suppressContentEditableWarning contentEditable>Carregamento instantâneo. Tecnologia de ponta que garante performance incomparável nas buscas.</p>
              </div>
              <div>
                <h4 className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-1">Arquitetura Limpa & SEO</h4>
                <p className="text-xs text-slate-400" suppressContentEditableWarning contentEditable>Código forjado com precisão divina, garantindo que seu site seja facilmente encontrado no Google.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= PÁGINA 4: OS PLANOS DE ASCENSÃO ================= */}
        <div className="w-full h-[297mm] p-16 flex flex-col relative break-after-page bg-[#0B0F19] border-b-8 border-amber-500">
          <h3 className="text-sm font-black text-amber-500 uppercase tracking-[0.3em] mb-2 text-center">Modelos de Investimento</h3>
          <h2 className="text-4xl font-black text-white mb-12 text-center" suppressContentEditableWarning contentEditable>Qual será o seu destino?</h2>

          <div className="grid grid-cols-1 gap-8">
            
            {/* O TRONO DE ZEUS (Compra) */}
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2rem] relative">
              <div className="absolute top-0 right-0 py-2 px-4 bg-slate-800 rounded-bl-2xl rounded-tr-[2rem] text-[10px] font-black uppercase text-slate-400 tracking-widest">Compra de Ativo</div>
              <h3 className="text-3xl font-black text-white mb-2">O Trono de Zeus</h3>
              <p className="text-sm text-slate-400 mb-6" suppressContentEditableWarning contentEditable>A aquisição absoluta. "Como Zeus governa o Olimpo, você governará seu domínio digital com poder absoluto."</p>
              
              <ul className="space-y-3 text-sm text-slate-300 mb-8 font-medium" suppressContentEditableWarning contentEditable>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div> Posse completa do ativo digital e código-fonte.</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div> Liberdade total para modificar e evoluir quando quiser.</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div> Independência de fornecedores (Sua TI hospeda e cuida).</li>
              </ul>
              
              <div className="border-t border-slate-800 pt-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Pagamento Único (Sem Mensalidades)</p>
                <div className="flex items-baseline gap-1 text-3xl font-black text-white">
                  R$ <input type="text" value={priceZeus} onChange={e => setPriceZeus(e.target.value)} className="bg-transparent border-none outline-none w-48 text-white focus:bg-slate-800 rounded px-2 -ml-2" />
                </div>
              </div>
            </div>

            {/* A ASA DE HERMES (SaaS) */}
            <div className="p-8 bg-gradient-to-br from-amber-900/20 to-slate-900 border-2 border-amber-500/50 rounded-[2rem] relative shadow-[0_0_30px_#F59E0B15]">
              <div className="absolute top-0 right-0 py-2 px-4 bg-amber-500 text-slate-900 rounded-bl-2xl rounded-tr-[2rem] text-[10px] font-black uppercase tracking-widest shadow-lg">Mais Escolhido</div>
              <h3 className="text-3xl font-black text-amber-500 mb-2">A Asa de Hermes</h3>
              <p className="text-sm text-amber-100/70 mb-6" suppressContentEditableWarning contentEditable>Site as a Service (SaaS). Baixo investimento inicial, previsibilidade financeira e nós cuidamos de toda a tecnologia para você.</p>
              
              <ul className="space-y-3 text-sm text-slate-200 mb-8 font-medium" suppressContentEditableWarning contentEditable>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div> Acesso imediato à tecnologia premium.</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div> Site sempre no ar: Hospedagem e Domínio inclusos.</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div> Ideal para preservar o fluxo de caixa da empresa.</li>
              </ul>
              
              <div className="border-t border-amber-500/20 pt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Setup de Criação</p>
                  <div className="flex items-baseline gap-1 text-2xl font-black text-white">
                    R$ <input type="text" value={priceHermesSetup} onChange={e => setPriceHermesSetup(e.target.value)} className="bg-transparent border-none outline-none w-32 text-white focus:bg-amber-900/50 rounded px-1 -ml-1" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Licença e Hospedagem</p>
                  <div className="flex items-baseline gap-1 text-2xl font-black text-amber-400">
                    R$ <input type="text" value={priceHermesMonthly} onChange={e => setPriceHermesMonthly(e.target.value)} className="bg-transparent border-none outline-none w-24 text-amber-400 focus:bg-amber-900/50 rounded px-1 -ml-1" />
                    <span className="text-sm text-amber-500/50 font-medium">/mês</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ================= PÁGINA 5: ATENA, QUEM SOMOS E FECHAMENTO ================= */}
        <div className="w-full h-[297mm] p-16 flex flex-col relative bg-slate-950 border-b-8 border-primary">
          
          <div className="mb-12 p-8 bg-blue-950/20 border border-blue-900/30 rounded-3xl">
            <h3 className="text-2xl font-black text-blue-400 mb-2">O Escudo de Atena (Manutenção)</h3>
            <p className="text-sm text-slate-400 mb-6 italic" suppressContentEditableWarning contentEditable>"A sabedoria de Atena nos ensina que um site sem manutenção é como uma fortaleza sem guardas."</p>
            <ul className="space-y-2 text-sm text-slate-300 mb-6" suppressContentEditableWarning contentEditable>
              <li>• <strong>Proteção constante:</strong> Atualizações rigorosas de segurança contra ameaças digitais.</li>
              <li>• <strong>Vigilância 24/7:</strong> Monitoramento contínuo e resposta rápida a incidentes.</li>
              <li>• <strong>Dinamicidade:</strong> Pequenas alterações mensais de textos e fotos garantidas por nós.</li>
            </ul>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold text-blue-400 uppercase tracking-widest text-[10px]">Adicional Mensal:</span>
              <span className="font-black text-white">R$ <input type="text" value={priceAthena} onChange={e => setPriceAthena(e.target.value)} className="bg-transparent border-none outline-none w-20 text-white focus:bg-blue-900/50 rounded px-1" /></span>
              <span className="text-xs text-slate-500">(Opcional no plano Zeus, incluso no plano Hermes)</span>
            </div>
          </div>

          <div className="mb-10">
            <h3 className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-4">Quem Somos</h3>
            <div className="grid grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-sm text-slate-300 leading-relaxed mb-4" suppressContentEditableWarning contentEditable>
                  Somos arquitetos digitais focados em trazer o poder do desenvolvimento moderno para empresas terrenas. Conectamos a sabedoria milenar do design com a tecnologia de vanguarda do presente.
                </p>
                <p className="text-sm text-slate-300 leading-relaxed font-bold" suppressContentEditableWarning contentEditable>
                  Oferecemos 100% de Código Proprietário, suporte divino e infinitas possibilidades de escalabilidade para o seu negócio.
                </p>
              </div>
              <EditableImage defaultImg="https://images.unsplash.com/photo-1555992828-ca4dbe41d294?q=80&w=1000&auto=format&fit=crop" alt="Olimpo Temple" />
            </div>
          </div>

          <div className="mt-auto text-center">
            <h3 className="text-sm font-black text-amber-500 uppercase tracking-[0.3em] mb-4">O Oráculo</h3>
            <h2 className="text-3xl font-black text-white mb-4" suppressContentEditableWarning contentEditable>O futuro pertence àqueles que ousam ascender ao Olimpo Digital.</h2>
            <p className="text-slate-400 mb-8" suppressContentEditableWarning contentEditable>O Poder da Conversão está ao seu alcance. Vamos iniciar essa jornada?</p>
            
            <div className="inline-block px-8 py-4 bg-primary text-white font-black uppercase tracking-widest rounded-full text-sm">
              Aprovar Proposta e Iniciar Projeto
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}