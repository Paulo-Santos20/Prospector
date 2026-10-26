import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileDown, Image as ImageIcon, 
  Wand2, Loader2, Sparkles, Settings, Lock, Unlock, Save,
  ShieldAlert, Zap, Server, Globe
} from 'lucide-react';
import { type Lead } from '../features/search/services/searchService';
// Importação corrigida e ativa do crmService
import { saveProposalData } from '../features/crm/services/crmService';

const EditableImage = ({ 
  value, onChange, alt, isGenerating, isLocked, onToggleLock 
}: { 
  value: string, onChange: (val: string) => void, alt: string, isGenerating?: boolean, isLocked: boolean, onToggleLock: () => void 
}) => {
  const [imgSrc, setImgSrc] = useState(value);

  useEffect(() => {
    setImgSrc(value);
  }, [value]);

  const handleChangeImage = () => {
    if (isGenerating || isLocked) return;
    const newUrl = prompt("Cole o link (URL) da imagem que deseja usar aqui:", value);
    if (newUrl) onChange(newUrl);
  };

  const handleImageError = () => {
    setImgSrc('https://images.unsplash.com/photo-1618044733300-9472054094ee?q=80&w=1000&auto=format&fit=crop');
  };

  return (
    <div className="group relative h-48 w-full shrink-0 overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900 shadow-2xl sm:h-64">
      <button 
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggleLock(); }} 
        className={`absolute right-3 top-3 z-30 rounded-full border p-2.5 backdrop-blur-md transition-all print:hidden sm:right-4 sm:top-4 ${
          isLocked 
            ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 hover:bg-amber-500/30' 
            : 'bg-slate-900/60 text-white border-slate-600 hover:bg-slate-800'
        }`}
        title={isLocked ? "Desbloquear imagem" : "Fixar imagem (Proteger da IA)"}
        aria-label={isLocked ? "Desbloquear imagem" : "Fixar imagem para proteger da IA"}
      >
        {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
      </button>

      <div
        onClick={handleChangeImage}
        role="button"
        tabIndex={isLocked ? -1 : 0}
        aria-label={`Trocar imagem: ${alt}`}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleChangeImage();
          }
        }}
        className="h-full w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400"
      >
        {isGenerating && !isLocked ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/80 font-bold text-amber-400 backdrop-blur-sm">
            <Loader2 className="mb-2 h-8 w-8 animate-spin" />
            <span className="text-[10px] uppercase tracking-widest animate-pulse">IA Forjando Arte...</span>
          </div>
        ) : (
          !isLocked && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 font-bold text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 print:hidden">
              <ImageIcon className="mb-2 h-8 w-8" />
              <span className="text-[10px] uppercase tracking-widest">Trocar Imagem</span>
            </div>
          )
        )}
        
        <img 
          src={imgSrc} 
          alt={alt} 
          onError={handleImageError}
          className={`h-full w-full object-cover object-center transition-transform duration-700 ${
            isGenerating && !isLocked ? 'scale-110 blur-sm opacity-50' : 'group-hover:scale-105'
          }`} 
        />
      </div>
    </div>
  );
};

export default function ProposalBuilderPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const lead = location.state?.lead as Lead;

  interface SavedProposal {
    priceZeus?: string;
    priceHermesSetup?: string;
    priceHermesMonthly?: string;
    priceAthena?: string;
    imgCaos?: string;
    imgHefesto?: string;
    imgOlimpo?: string;
  }

  const savedData: SavedProposal =
    (lead as Lead & { proposalData?: SavedProposal })?.proposalData || {};

  const [priceZeus, setPriceZeus] = useState(savedData.priceZeus || '2.497,00');
  const [priceHermesSetup, setPriceHermesSetup] = useState(savedData.priceHermesSetup || '1.497,00');
  const [priceHermesMonthly, setPriceHermesMonthly] = useState(savedData.priceHermesMonthly || '197,00');
  const [priceAthena, setPriceAthena] = useState(savedData.priceAthena || '150,00');

  const [imgCaos, setImgCaos] = useState(savedData.imgCaos || 'https://images.unsplash.com/photo-1555622900-3756209eefc6?q=80&w=1000&auto=format&fit=crop');
  const [imgHefesto, setImgHefesto] = useState(savedData.imgHefesto || 'https://images.unsplash.com/photo-1533077162812-ebc52ec1e171?q=80&w=1000&auto=format&fit=crop');
  const [imgOlimpo, setImgOlimpo] = useState(savedData.imgOlimpo || 'https://images.unsplash.com/photo-1555992828-ca4dbe41d294?q=80&w=1000&auto=format&fit=crop');
  
  const [lockedCaos, setLockedCaos] = useState(!!savedData.imgCaos);
  const [lockedHefesto, setLockedHefesto] = useState(!!savedData.imgHefesto);
  const [lockedOlimpo, setLockedOlimpo] = useState(!!savedData.imgOlimpo);

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState('');
  
  if (!lead) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center text-slate-200">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">Editor de Proposta</p>
        <h1 className="mb-3 text-2xl font-black text-white sm:text-4xl">Lead não encontrado</h1>
        <p className="mb-8 max-w-md text-sm text-slate-400">Abra a proposta a partir dos detalhes de um lead para carregar os dados do cliente.</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-black text-white transition-colors hover:bg-blue-600"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao Dashboard
        </button>
      </div>
    );
  }

  const handlePrint = () => window.print();

  // Função que salva no banco usando a API do Render
  const handleSaveProposal = async () => {
    setIsSaving(true);
    setSaveFeedback('');
    try {
      const proposalData = { 
        priceZeus, 
        priceHermesSetup, 
        priceHermesMonthly, 
        priceAthena, 
        imgCaos, 
        imgHefesto, 
        imgOlimpo 
      };
      
      // Chamada real para o Backend
      await saveProposalData(lead.id, proposalData);
      setSaveFeedback('Proposta salva com sucesso.');
      setTimeout(() => setSaveFeedback(''), 4000);
    } catch (error) {
      console.error(error);
      setSaveFeedback('Erro ao salvar a proposta. Verifique o console.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateAIPictures = () => {
    if (lockedCaos && lockedHefesto && lockedOlimpo) {
      alert("Todas as imagens estão fixadas! Destrave alguma clicando no cadeado para gerar novas.");
      return;
    }

    setIsGeneratingAI(true);
    
    const baseStyle = "flat vector illustration, minimal corporate design, greek mythology theme, warm tones, pastel beige and amber colors, elegant, clean white background, high resolution";
    
    const seed1 = Math.floor(Math.random() * 100000);
    const seed2 = Math.floor(Math.random() * 100000) + 1;
    const seed3 = Math.floor(Math.random() * 100000) + 2;

    const promptCaos = `A frustrated person sitting at a desk looking at a computer screen surrounded by chaotic flying bugs and errors, ${baseStyle}`;
    const promptHefesto = `Greek god Hephaestus with white beard forging glowing golden digital code on an anvil, ${baseStyle}`;
    const promptOlimpo = `A majestic classic greek temple on top of a mountain glowing in golden sunlight, ${baseStyle}`;

    const generateUrl = (promptText: string, seed: number) => 
      `https://image.pollinations.ai/prompt/${encodeURIComponent(promptText)}?width=800&height=400&model=flux&seed=${seed}&nologo=true`;

    setTimeout(() => {
      if (!lockedCaos) setImgCaos(generateUrl(promptCaos, seed1));
      if (!lockedHefesto) setImgHefesto(generateUrl(promptHefesto, seed2));
      if (!lockedOlimpo) setImgOlimpo(generateUrl(promptOlimpo, seed3));
      setTimeout(() => setIsGeneratingAI(false), 1000);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-28 font-sans text-slate-200 sm:pb-24 print:bg-white print:pb-0">
      
      {/* BARRA DE CONTROLE */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex w-full items-center gap-2 overflow-x-auto border-t border-slate-700 bg-surface/95 p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-md scrollbar-hide print:hidden sm:bottom-6 sm:left-1/2 sm:right-auto sm:w-[95%] sm:max-w-5xl sm:-translate-x-1/2 sm:gap-4 sm:rounded-full sm:border sm:p-4 sm:pb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="shrink-0 rounded-full p-3 text-slate-400 transition-all hover:bg-slate-800 hover:text-white"
          title="Voltar"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        <div className="hidden h-8 w-px shrink-0 bg-slate-700 sm:block"></div>
        
        <button 
          type="button"
          onClick={handleGenerateAIPictures} 
          disabled={isGeneratingAI}
          className="flex shrink-0 items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-3 text-[10px] font-black uppercase tracking-wider text-amber-400 transition-all hover:bg-slate-700 disabled:opacity-50 sm:px-5 sm:text-[11px] sm:tracking-widest"
          aria-label="Gerar fotos com IA"
        >
          {isGeneratingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          <span className="sm:hidden">{isGeneratingAI ? 'Gerando' : 'Fotos'}</span>
          <span className="hidden sm:inline">{isGeneratingAI ? 'Forjando Arte...' : 'Gerar Fotos (IA)'}</span>
        </button>

        <button 
          type="button"
          onClick={handleSaveProposal} 
          disabled={isSaving}
          className="flex shrink-0 items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-3 text-[10px] font-black uppercase tracking-wider text-white transition-all hover:bg-slate-700 disabled:opacity-50 sm:px-5 sm:text-[11px] sm:tracking-widest"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span className="sm:hidden">{isSaving ? 'Salvando' : 'Salvar'}</span>
          <span className="hidden sm:inline">{isSaving ? 'Salvando...' : 'Salvar Progresso'}</span>
        </button>

        <div className="ml-auto hidden h-8 w-px shrink-0 bg-slate-700 sm:block"></div>
        
        <button
          type="button"
          onClick={handlePrint}
          aria-label="Exportar PDF"
          title="Exportar PDF"
          className="flex shrink-0 items-center gap-2 rounded-full bg-primary px-3 py-3 text-[10px] font-black uppercase tracking-wider text-white shadow-[0_0_20px_#3B82F650] transition-all hover:bg-blue-600 sm:px-6 sm:text-[11px] sm:tracking-widest"
        >
          <FileDown className="h-5 w-5" /> <span className="hidden sm:inline">Exportar PDF</span>
        </button>
      </div>

      {saveFeedback && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-center text-xs font-bold text-slate-200 shadow-2xl sm:bottom-28"
        >
          {saveFeedback}
        </div>
      )}

      {/* ÁREA DA PROPOSTA (Formato A4) */}
      <div className="mx-auto mt-4 w-full max-w-[210mm] overflow-hidden bg-slate-950 text-slate-200 shadow-2xl print:mt-0 print:shadow-none sm:mt-10" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
        
        {/* === PÁGINA 1: CAPA === */}
        <div className="relative flex min-h-[70vh] w-full flex-col justify-center overflow-hidden border-b-8 border-amber-500 p-5 break-after-page sm:h-[297mm] sm:min-h-0 sm:p-10 lg:p-16 print:h-[297mm] print:p-16">
          <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] -translate-y-1/4 translate-x-1/3 rounded-full bg-amber-500/10 blur-[150px] sm:h-[800px] sm:w-[800px]"></div>
          
          <div className="relative z-10 mb-10 sm:mb-20">
            <h2 className="mb-2 text-lg font-black uppercase tracking-[0.25em] text-amber-500 sm:text-2xl sm:tracking-[0.4em]">Olimpo Soluções</h2>
            <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400 sm:text-sm">Consultoria e Engenharia Digital</p>
          </div>

          <h1 className="relative z-10 mb-5 text-3xl font-black leading-tight text-white sm:mb-8 sm:text-5xl lg:text-6xl" suppressContentEditableWarning contentEditable>
            Eleve seu Negócio ao <br/>Panteão Digital
          </h1>
          <p className="relative z-10 mb-10 max-w-lg text-base leading-relaxed text-slate-400 sm:mb-16 sm:text-xl" suppressContentEditableWarning contentEditable>
            Apresentamos o novo padrão web: A arquitetura definitiva para transformar visitantes orgânicos em clientes matriculados e fiéis.
          </p>
          
          <div className="relative z-10 mt-auto border-l-4 border-amber-500 pl-4 sm:pl-6">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 sm:text-sm">Proposta de Ascensão para</p>
            <p className="text-2xl font-black text-white sm:text-4xl" suppressContentEditableWarning contentEditable>{lead.displayName.text}</p>
          </div>
        </div>

        {/* === PÁGINA 2: O CAOS === */}
        <div className="relative flex w-full flex-col overflow-hidden border-b-8 border-red-500 bg-[#0B0F19] p-5 break-after-page sm:h-[297mm] sm:p-10 lg:p-16 print:h-[297mm] print:p-16">
          <div className="mb-6 shrink-0 sm:mb-8">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-red-500 sm:text-sm sm:tracking-[0.3em]"><ShieldAlert className="h-4 w-4"/> O Caos Atual</h3>
            <h2 className="mb-3 text-2xl font-black text-white sm:mb-4 sm:text-4xl" suppressContentEditableWarning contentEditable>A "velha era" está afastando seus clientes</h2>
            <p className="text-sm leading-relaxed text-slate-400 sm:text-base" suppressContentEditableWarning contentEditable>
              Sem um ambiente digital próprio e otimizado, sua empresa perde credibilidade instantânea. Clientes modernos não confiam em negócios difíceis de encontrar no Google ou que dependem exclusivamente do Instagram.
            </p>
          </div>

          <div className="mb-6 shrink-0 sm:mb-8">
            <EditableImage 
              value={imgCaos} onChange={setImgCaos} alt="O Caos" 
              isGenerating={isGeneratingAI} isLocked={lockedCaos} onToggleLock={() => setLockedCaos(!lockedCaos)} 
            />
          </div>

          <div className="mt-auto grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6">
            <div className="rounded-2xl border border-red-900/50 bg-red-950/30 p-4 sm:p-5">
              <h4 className="mb-2 text-base font-bold text-red-400 sm:text-lg">Lentidão que Custa Caro</h4>
              <p className="text-xs leading-relaxed text-slate-400 sm:text-sm" suppressContentEditableWarning contentEditable>Páginas que demoram para carregar frustram o usuário. Cada segundo de espera resulta em potenciais clientes abandonando a página antes de conhecer seu trabalho.</p>
            </div>
            <div className="rounded-2xl border border-red-900/50 bg-red-950/30 p-4 sm:p-5">
              <h4 className="mb-2 text-base font-bold text-red-400 sm:text-lg">Aparência Amadora</h4>
              <p className="text-xs leading-relaxed text-slate-400 sm:text-sm" suppressContentEditableWarning contentEditable>Layouts quebrados no celular e design ultrapassado transmitem a mensagem de que o seu serviço também parou no tempo. A primeira impressão é letal.</p>
            </div>
          </div>
        </div>

        {/* === PÁGINA 3: A SOLUÇÃO (HEFESTO) === */}
        <div className="relative flex w-full flex-col overflow-hidden border-b-8 border-emerald-500 bg-slate-900 p-5 break-after-page sm:h-[297mm] sm:p-10 lg:p-16 print:h-[297mm] print:p-16">
          <div className="mb-6 shrink-0 sm:mb-8">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-500 sm:text-sm sm:tracking-[0.3em]"><Sparkles className="h-4 w-4"/> A Solução Divina</h3>
            <h2 className="text-2xl font-black text-white sm:text-4xl" suppressContentEditableWarning contentEditable>Como Apolo, trazemos a luz da excelência para o seu negócio</h2>
          </div>

          <div className="mb-6 shrink-0 sm:mb-8">
            <EditableImage 
              value={imgHefesto} onChange={setImgHefesto} alt="A Força de Hefesto" 
              isGenerating={isGeneratingAI} isLocked={lockedHefesto} onToggleLock={() => setLockedHefesto(!lockedHefesto)} 
            />
          </div>

          <div className="mt-auto shrink-0 rounded-3xl border border-slate-800 bg-slate-950/50 p-4 sm:p-8">
            <h3 className="mb-4 flex items-center gap-3 text-xl font-black text-white sm:mb-6 sm:text-2xl">
              A Força de Hefesto
            </h3>
            <p className="mb-4 text-sm italic text-slate-400 sm:mb-6" suppressContentEditableWarning contentEditable>Diferenciais técnicos e precisos que constroem resultados impossíveis:</p>
            
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 sm:gap-y-6">
              <div>
                <h4 className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-400 sm:text-sm">Design de Conversão</h4>
                <p className="text-xs leading-relaxed text-slate-400" suppressContentEditableWarning contentEditable>Cada pixel, cor e botão é estrategicamente posicionado com um único objetivo: guiar o visitante até o botão de contato e fechar a venda.</p>
              </div>
              <div>
                <h4 className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-400 sm:text-sm">Mobile-First Impecável</h4>
                <p className="text-xs leading-relaxed text-slate-400" suppressContentEditableWarning contentEditable>Sua empresa na palma da mão do cliente. Uma experiência fluida e moderna, priorizando os smartphones (origem de 90% dos acessos).</p>
              </div>
              <div>
                <h4 className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-400 sm:text-sm">Velocidade de Hermes</h4>
                <p className="text-xs leading-relaxed text-slate-400" suppressContentEditableWarning contentEditable>Sistemas desenvolvidos com tecnologia de ponta para carregamento em milissegundos. Rápido, leve e impossível de ser ignorado.</p>
              </div>
              <div>
                <h4 className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-400 sm:text-sm">Arquitetura Limpa & SEO</h4>
                <p className="text-xs leading-relaxed text-slate-400" suppressContentEditableWarning contentEditable>Código forjado para o algoritmo do Google. Preparamos o terreno para que sua marca domine as buscas locais da sua região.</p>
              </div>
            </div>
          </div>
        </div>

        {/* === PÁGINA 4: OS PLANOS DE ASCENSÃO === */}
        <div className="relative flex w-full flex-col overflow-hidden border-b-8 border-amber-500 bg-[#0B0F19] p-5 break-after-page sm:h-[297mm] sm:p-10 lg:p-16 print:h-[297mm] print:p-16">
          <h3 className="mb-2 shrink-0 text-center text-xs font-black uppercase tracking-[0.2em] text-amber-500 sm:text-sm sm:tracking-[0.3em]">Planos de Investimento</h3>
          <h2 className="mb-6 shrink-0 text-center text-2xl font-black text-white sm:mb-12 sm:text-4xl" suppressContentEditableWarning contentEditable>Escolha como deseja reinar</h2>

          <div className="mt-auto grid shrink-0 grid-cols-1 gap-4 sm:gap-8">
            {/* O TRONO DE ZEUS (Compra) */}
            <div className="relative rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:rounded-[2rem] sm:p-8">
              <div className="absolute right-0 top-0 rounded-bl-2xl rounded-tr-3xl bg-slate-800 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 sm:rounded-tr-[2rem] sm:px-4 sm:py-2 sm:text-[10px]">Plano A</div>
              <h3 className="mb-2 flex items-center gap-2 pr-16 text-xl font-black text-white sm:gap-3 sm:pr-0 sm:text-3xl"><Settings className="h-6 w-6 shrink-0 text-slate-400 sm:h-7 sm:w-7" /> O Trono de Zeus</h3>
              <p className="mb-4 text-xs text-slate-400 sm:mb-6 sm:text-sm" suppressContentEditableWarning contentEditable>
                "Como Zeus governa o Olimpo, você governará seu domínio digital." O cliente adquire o código-fonte e hospeda na sua própria infraestrutura de TI.
              </p>
              
              <ul className="mb-6 space-y-2.5 text-xs font-medium text-slate-300 sm:mb-8 sm:space-y-3 sm:text-sm" suppressContentEditableWarning contentEditable>
                <li className="flex items-start gap-2"><div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500"></div> Posse completa e vitalícia do ativo digital e código-fonte.</li>
                <li className="flex items-start gap-2"><div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500"></div> Independência total de fornecedores após a entrega do projeto.</li>
                <li className="flex items-start gap-2"><div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500"></div> Ideal para empresas que já possuem uma equipe de servidores.</li>
              </ul>
              
              <div className="border-t border-slate-800 pt-4 sm:pt-6">
                <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-slate-500 sm:text-[10px]">Pagamento Único (Compra do Ativo)</p>
                <div className="flex items-baseline gap-1 text-2xl font-black text-white sm:text-3xl">
                  R$ <input type="text" value={priceZeus} onChange={e => setPriceZeus(e.target.value)} className="-ml-2 w-full min-w-0 flex-1 rounded bg-transparent px-2 text-2xl text-white outline-none focus:bg-slate-800 sm:w-48 sm:flex-none sm:text-3xl" aria-label="Preço do Trono de Zeus" />
                </div>
              </div>
            </div>

            {/* A ASA DE HERMES (SaaS) */}
            <div className="relative rounded-3xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-900/20 to-slate-900 p-4 shadow-[0_0_30px_#F59E0B15] sm:rounded-[2rem] sm:p-8">
              <div className="absolute right-0 top-0 rounded-bl-2xl rounded-tr-3xl bg-amber-500 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-900 shadow-lg sm:rounded-tr-[2rem] sm:px-4 sm:py-2 sm:text-[10px]">Plano B • Recomendado</div>
              <h3 className="mb-2 flex items-center gap-2 pr-24 text-xl font-black text-amber-500 sm:gap-3 sm:pr-0 sm:text-3xl"><Zap className="h-6 w-6 shrink-0 sm:h-7 sm:w-7" /> A Asa de Hermes</h3>
              <p className="mb-4 text-xs text-amber-100/70 sm:mb-6 sm:text-sm" suppressContentEditableWarning contentEditable>
                Nós cuidamos da burocracia e da tecnologia, você foca em atender seus novos clientes. Baixo custo inicial e tranquilidade operacional garantida.
              </p>
              
              <ul className="mb-6 space-y-2.5 text-xs font-medium text-slate-200 sm:mb-8 sm:space-y-3 sm:text-sm" suppressContentEditableWarning contentEditable>
                <li className="flex items-start gap-2"><div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"></div> Criação Premium + Hospedagem de alta performance inclusa.</li>
                <li className="flex items-start gap-2"><div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"></div> Previsibilidade financeira: Baixo investimento inicial.</li>
                <li className="flex items-start gap-2"><div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"></div> Seu site atualizado, no ar e seguro sem dores de cabeça.</li>
              </ul>
              
              <div className="grid grid-cols-1 gap-4 border-t border-amber-500/20 pt-4 sm:grid-cols-2 sm:pt-6">
                <div>
                  <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-amber-500 sm:text-[10px]">Setup (Criação do Site)</p>
                  <div className="flex items-baseline gap-1 text-xl font-black text-white sm:text-2xl">
                    R$ <input type="text" value={priceHermesSetup} onChange={e => setPriceHermesSetup(e.target.value)} className="-ml-1 w-full min-w-0 flex-1 rounded bg-transparent px-1 text-xl text-white outline-none focus:bg-amber-900/50 sm:w-32 sm:flex-none sm:text-2xl" aria-label="Preço de setup do Plano Hermes" />
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-amber-500 sm:text-[10px]">Licença & Servidor Dedicado</p>
                  <div className="flex items-baseline gap-1 text-xl font-black text-amber-400 sm:text-2xl">
                    R$ <input type="text" value={priceHermesMonthly} onChange={e => setPriceHermesMonthly(e.target.value)} className="-ml-1 w-full min-w-0 flex-1 rounded bg-transparent px-1 text-xl text-amber-400 outline-none focus:bg-amber-900/50 sm:w-24 sm:flex-none sm:text-2xl" aria-label="Mensalidade do Plano Hermes" />
                    <span className="text-sm font-medium text-amber-500/50">/mês</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === PÁGINA 5: ATENA, QUEM SOMOS E FECHAMENTO === */}
        <div className="relative flex w-full flex-col overflow-hidden border-b-8 border-primary bg-slate-950 p-5 sm:h-[297mm] sm:p-10 lg:p-16 print:h-[297mm] print:p-16">
          
          <div className="mb-6 shrink-0 rounded-3xl border border-blue-900/30 bg-blue-950/20 p-4 sm:mb-10 sm:p-8">
            <h3 className="mb-2 flex items-center gap-2 text-xl font-black text-blue-400 sm:text-2xl"><Server className="h-5 w-5 shrink-0"/> O Escudo de Atena</h3>
            <p className="mb-4 text-xs italic text-slate-400 sm:mb-6 sm:text-sm" suppressContentEditableWarning contentEditable>"A sabedoria ensina que um site sem manutenção é como uma fortaleza sem guardas." Este pacote opcional blinda seu ativo digital.</p>
            <ul className="mb-4 space-y-2 text-xs text-slate-300 sm:mb-6 sm:text-sm" suppressContentEditableWarning contentEditable>
              <li>• <strong>Proteção constante:</strong> Atualizações rigorosas de sistema e barreira contra invasões.</li>
              <li>• <strong>Vigilância 24/7:</strong> Monitoramento de estabilidade. Se o site cair, nossa equipe sabe antes de você.</li>
              <li>• <strong>Dinamicidade:</strong> Pequenas alterações de texto e fotos mensais inclusas, para o site nunca ficar defasado.</li>
            </ul>
            <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-xs sm:flex-row sm:items-center sm:text-sm">
              <span className="text-[9px] font-bold uppercase tracking-widest text-blue-400 sm:text-[10px]">Valor Mensal da Manutenção:</span>
              <span className="font-black text-white">R$ <input type="text" value={priceAthena} onChange={e => setPriceAthena(e.target.value)} className="w-20 rounded bg-transparent px-1 text-white outline-none focus:bg-blue-900/50" aria-label="Valor mensal da manutenção Atena" /></span>
              <span className="text-[9px] uppercase text-slate-500 sm:text-[10px]">(Opcional no Plano Zeus. Já 100% incluso no Plano Hermes)</span>
            </div>
          </div>

          <div className="mb-6 shrink-0 sm:mb-8">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-primary sm:mb-4 sm:text-sm sm:tracking-[0.3em]"><Globe className="h-4 w-4"/> Sobre Nós</h3>
            <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2 sm:gap-8">
              <div>
                <p className="mb-3 text-xs leading-relaxed text-slate-300 sm:mb-4 sm:text-sm" suppressContentEditableWarning contentEditable>
                  A <strong>Olimpo Soluções</strong> é formada por arquitetos digitais focados em trazer o poder da alta conversão para empresas terrenas. Nossa missão é conectar a sabedoria milenar do bom design com a tecnologia de vanguarda.
                </p>
                <p className="text-xs font-bold leading-relaxed text-slate-300 sm:text-sm" suppressContentEditableWarning contentEditable>
                  Entregamos 100% de Código Proprietário, suporte divino e infinitas possibilidades de escalabilidade para que a sua empresa cresça sem barreiras tecnológicas.
                </p>
              </div>
              <EditableImage 
                value={imgOlimpo} onChange={setImgOlimpo} alt="Olimpo Temple" 
                isGenerating={isGeneratingAI} isLocked={lockedOlimpo} onToggleLock={() => setLockedOlimpo(!lockedOlimpo)} 
              />
            </div>
          </div>

          <div className="mt-auto shrink-0 text-center">
            <h3 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-amber-500 sm:mb-4 sm:text-sm sm:tracking-[0.3em]">O Oráculo Dita o Futuro</h3>
            <h2 className="mb-3 text-xl font-black text-white sm:mb-4 sm:text-3xl" suppressContentEditableWarning contentEditable>"O futuro pertence àqueles que ousam ascender ao Olimpo Digital."</h2>
            <p className="mb-6 text-xs text-slate-400 sm:mb-8 sm:text-sm" suppressContentEditableWarning contentEditable>O poder de converter mais visitantes em clientes está ao seu alcance. Vamos iniciar esta jornada?</p>
            
            <div className="inline-block rounded-full bg-primary px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-[0_0_20px_#3B82F640] sm:px-10 sm:py-4 sm:text-sm sm:tracking-widest">
              Aprovar Proposta e Iniciar Projeto
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}