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
    <div className="relative group rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 bg-slate-900 w-full h-64 shrink-0">
      <button 
        onClick={(e) => { e.stopPropagation(); onToggleLock(); }} 
        className={`absolute top-4 right-4 z-30 p-2.5 rounded-full transition-all print:hidden backdrop-blur-md border ${
          isLocked 
            ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 hover:bg-amber-500/30' 
            : 'bg-slate-900/60 text-white border-slate-600 hover:bg-slate-800'
        }`}
        title={isLocked ? "Desbloquear imagem" : "Fixar imagem (Proteger da IA)"}
      >
        {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
      </button>

      <div onClick={handleChangeImage} className="w-full h-full cursor-pointer">
        {isGenerating && !isLocked ? (
          <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center text-amber-400 font-bold z-20 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 mb-2 animate-spin" />
            <span className="text-[10px] uppercase tracking-widest animate-pulse">IA Forjando Arte...</span>
          </div>
        ) : (
          !isLocked && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white font-bold z-10 print:hidden backdrop-blur-sm">
              <ImageIcon className="w-8 h-8 mb-2" />
              <span className="text-[10px] uppercase tracking-widest">Trocar Imagem</span>
            </div>
          )
        )}
        
        <img 
          src={imgSrc} 
          alt={alt} 
          onError={handleImageError}
          className={`w-full h-full object-cover object-center transition-transform duration-700 ${
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

  const savedData = (lead as any)?.proposalData || {};

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
  
  if (!lead) return <div className="p-10 text-white font-black">Lead não encontrado. Volte e selecione um cliente.</div>;

  const handlePrint = () => window.print();

  // Função que salva no banco usando a API do Render
  const handleSaveProposal = async () => {
    setIsSaving(true);
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
      alert("Proposta salva com sucesso no Banco de Dados!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar a proposta. Verifique o console.");
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
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 pb-20">
      
      {/* BARRA DE CONTROLE */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface border border-slate-700 p-4 rounded-full shadow-2xl flex items-center gap-4 z-50 print:hidden backdrop-blur-md w-[95%] max-w-5xl overflow-x-auto scrollbar-hide">
        <button onClick={() => navigate(-1)} className="p-3 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-all shrink-0" title="Voltar">
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="h-8 w-px bg-slate-700 shrink-0"></div>
        
        <button 
          onClick={handleGenerateAIPictures} 
          disabled={isGeneratingAI}
          className="bg-slate-800 hover:bg-slate-700 text-amber-400 px-5 py-3 rounded-full font-black text-[11px] flex items-center gap-2 transition-all uppercase tracking-widest shrink-0 border border-slate-700 disabled:opacity-50"
        >
          {isGeneratingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {isGeneratingAI ? 'Forjando Arte...' : 'Gerar Fotos (IA)'}
        </button>

        <button 
          onClick={handleSaveProposal} 
          disabled={isSaving}
          className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-full font-black text-[11px] flex items-center gap-2 transition-all uppercase tracking-widest shrink-0 border border-slate-700 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Salvando...' : 'Salvar Progresso'}
        </button>

        <div className="h-8 w-px bg-slate-700 shrink-0 ml-auto"></div>
        
        <button onClick={handlePrint} className="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-full font-black text-[11px] flex items-center gap-2 transition-all shadow-[0_0_20px_#3B82F650] shrink-0 uppercase tracking-widest">
          <FileDown className="w-5 h-5" /> Exportar PDF
        </button>
      </div>

      {/* ÁREA DA PROPOSTA (Formato A4) */}
      <div className="w-full max-w-[210mm] mx-auto mt-10 print:mt-0 shadow-2xl print:shadow-none bg-slate-950 overflow-hidden text-slate-200" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
        
        {/* === PÁGINA 1: CAPA === */}
        <div className="w-full h-[297mm] p-16 flex flex-col justify-center relative break-after-page border-b-8 border-amber-500 overflow-hidden">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-amber-500/10 blur-[150px] pointer-events-none rounded-full -translate-y-1/4 translate-x-1/3"></div>
          
          <div className="mb-20 relative z-10">
            <h2 className="text-2xl font-black tracking-[0.4em] text-amber-500 uppercase mb-2">Olimpo Soluções</h2>
            <p className="text-sm text-slate-400 font-medium uppercase tracking-widest">Consultoria e Engenharia Digital</p>
          </div>

          <h1 className="text-6xl font-black text-white leading-tight mb-8 relative z-10" suppressContentEditableWarning contentEditable>
            Eleve seu Negócio ao <br/>Panteão Digital
          </h1>
          <p className="text-xl text-slate-400 max-w-lg mb-16 relative z-10 leading-relaxed" suppressContentEditableWarning contentEditable>
            Apresentamos o novo padrão web: A arquitetura definitiva para transformar visitantes orgânicos em clientes matriculados e fiéis.
          </p>
          
          <div className="mt-auto border-l-4 border-amber-500 pl-6 relative z-10">
            <p className="text-sm text-slate-500 uppercase tracking-widest mb-1 font-bold">Proposta de Ascensão para</p>
            <p className="text-4xl font-black text-white" suppressContentEditableWarning contentEditable>{lead.displayName.text}</p>
          </div>
        </div>

        {/* === PÁGINA 2: O CAOS === */}
        <div className="w-full h-[297mm] p-16 flex flex-col relative break-after-page bg-[#0B0F19] border-b-8 border-red-500 overflow-hidden">
          <div className="mb-8 shrink-0">
            <h3 className="text-sm font-black text-red-500 uppercase tracking-[0.3em] mb-2 flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> O Caos Atual</h3>
            <h2 className="text-4xl font-black text-white mb-4" suppressContentEditableWarning contentEditable>A "velha era" está afastando seus clientes</h2>
            <p className="text-md text-slate-400 leading-relaxed" suppressContentEditableWarning contentEditable>
              Sem um ambiente digital próprio e otimizado, sua empresa perde credibilidade instantânea. Clientes modernos não confiam em negócios difíceis de encontrar no Google ou que dependem exclusivamente do Instagram.
            </p>
          </div>

          <div className="mb-8 shrink-0">
            <EditableImage 
              value={imgCaos} onChange={setImgCaos} alt="O Caos" 
              isGenerating={isGeneratingAI} isLocked={lockedCaos} onToggleLock={() => setLockedCaos(!lockedCaos)} 
            />
          </div>

          <div className="grid grid-cols-2 gap-6 mt-auto shrink-0">
            <div className="p-5 bg-red-950/30 border border-red-900/50 rounded-2xl">
              <h4 className="text-red-400 font-bold mb-2 text-lg">Lentidão que Custa Caro</h4>
              <p className="text-sm text-slate-400 leading-relaxed" suppressContentEditableWarning contentEditable>Páginas que demoram para carregar frustram o usuário. Cada segundo de espera resulta em potenciais clientes abandonando a página antes de conhecer seu trabalho.</p>
            </div>
            <div className="p-5 bg-red-950/30 border border-red-900/50 rounded-2xl">
              <h4 className="text-red-400 font-bold mb-2 text-lg">Aparência Amadora</h4>
              <p className="text-sm text-slate-400 leading-relaxed" suppressContentEditableWarning contentEditable>Layouts quebrados no celular e design ultrapassado transmitem a mensagem de que o seu serviço também parou no tempo. A primeira impressão é letal.</p>
            </div>
          </div>
        </div>

        {/* === PÁGINA 3: A SOLUÇÃO (HEFESTO) === */}
        <div className="w-full h-[297mm] p-16 flex flex-col relative break-after-page bg-slate-900 border-b-8 border-emerald-500 overflow-hidden">
          <div className="mb-8 shrink-0">
            <h3 className="text-sm font-black text-emerald-500 uppercase tracking-[0.3em] mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4"/> A Solução Divina</h3>
            <h2 className="text-4xl font-black text-white" suppressContentEditableWarning contentEditable>Como Apolo, trazemos a luz da excelência para o seu negócio</h2>
          </div>

          <div className="mb-8 shrink-0">
            <EditableImage 
              value={imgHefesto} onChange={setImgHefesto} alt="A Força de Hefesto" 
              isGenerating={isGeneratingAI} isLocked={lockedHefesto} onToggleLock={() => setLockedHefesto(!lockedHefesto)} 
            />
          </div>

          <div className="mt-auto bg-slate-950/50 p-8 rounded-3xl border border-slate-800 shrink-0">
            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
              A Força de Hefesto
            </h3>
            <p className="text-slate-400 mb-6 italic" suppressContentEditableWarning contentEditable>Diferenciais técnicos e precisos que constroem resultados impossíveis:</p>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <h4 className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-1">Design de Conversão</h4>
                <p className="text-xs text-slate-400 leading-relaxed" suppressContentEditableWarning contentEditable>Cada pixel, cor e botão é estrategicamente posicionado com um único objetivo: guiar o visitante até o botão de contato e fechar a venda.</p>
              </div>
              <div>
                <h4 className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-1">Mobile-First Impecável</h4>
                <p className="text-xs text-slate-400 leading-relaxed" suppressContentEditableWarning contentEditable>Sua empresa na palma da mão do cliente. Uma experiência fluida e moderna, priorizando os smartphones (origem de 90% dos acessos).</p>
              </div>
              <div>
                <h4 className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-1">Velocidade de Hermes</h4>
                <p className="text-xs text-slate-400 leading-relaxed" suppressContentEditableWarning contentEditable>Sistemas desenvolvidos com tecnologia de ponta para carregamento em milissegundos. Rápido, leve e impossível de ser ignorado.</p>
              </div>
              <div>
                <h4 className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-1">Arquitetura Limpa & SEO</h4>
                <p className="text-xs text-slate-400 leading-relaxed" suppressContentEditableWarning contentEditable>Código forjado para o algoritmo do Google. Preparamos o terreno para que sua marca domine as buscas locais da sua região.</p>
              </div>
            </div>
          </div>
        </div>

        {/* === PÁGINA 4: OS PLANOS DE ASCENSÃO === */}
        <div className="w-full h-[297mm] p-16 flex flex-col relative break-after-page bg-[#0B0F19] border-b-8 border-amber-500 overflow-hidden">
          <h3 className="text-sm font-black text-amber-500 uppercase tracking-[0.3em] mb-2 text-center shrink-0">Planos de Investimento</h3>
          <h2 className="text-4xl font-black text-white mb-12 text-center shrink-0" suppressContentEditableWarning contentEditable>Escolha como deseja reinar</h2>

          <div className="grid grid-cols-1 gap-8 mt-auto shrink-0">
            {/* O TRONO DE ZEUS (Compra) */}
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2rem] relative">
              <div className="absolute top-0 right-0 py-2 px-4 bg-slate-800 rounded-bl-2xl rounded-tr-[2rem] text-[10px] font-black uppercase text-slate-400 tracking-widest">Plano A</div>
              <h3 className="text-3xl font-black text-white mb-2 flex items-center gap-3"><Settings className="w-7 h-7 text-slate-400" /> O Trono de Zeus</h3>
              <p className="text-sm text-slate-400 mb-6" suppressContentEditableWarning contentEditable>
                "Como Zeus governa o Olimpo, você governará seu domínio digital." O cliente adquire o código-fonte e hospeda na sua própria infraestrutura de TI.
              </p>
              
              <ul className="space-y-3 text-sm text-slate-300 mb-8 font-medium" suppressContentEditableWarning contentEditable>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div> Posse completa e vitalícia do ativo digital e código-fonte.</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div> Independência total de fornecedores após a entrega do projeto.</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div> Ideal para empresas que já possuem uma equipe de servidores.</li>
              </ul>
              
              <div className="border-t border-slate-800 pt-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Pagamento Único (Compra do Ativo)</p>
                <div className="flex items-baseline gap-1 text-3xl font-black text-white">
                  R$ <input type="text" value={priceZeus} onChange={e => setPriceZeus(e.target.value)} className="bg-transparent border-none outline-none w-48 text-white focus:bg-slate-800 rounded px-2 -ml-2" />
                </div>
              </div>
            </div>

            {/* A ASA DE HERMES (SaaS) */}
            <div className="p-8 bg-gradient-to-br from-amber-900/20 to-slate-900 border-2 border-amber-500/50 rounded-[2rem] relative shadow-[0_0_30px_#F59E0B15]">
              <div className="absolute top-0 right-0 py-2 px-4 bg-amber-500 text-slate-900 rounded-bl-2xl rounded-tr-[2rem] text-[10px] font-black uppercase tracking-widest shadow-lg">Plano B • Recomendado</div>
              <h3 className="text-3xl font-black text-amber-500 mb-2 flex items-center gap-3"><Zap className="w-7 h-7" /> A Asa de Hermes</h3>
              <p className="text-sm text-amber-100/70 mb-6" suppressContentEditableWarning contentEditable>
                Nós cuidamos da burocracia e da tecnologia, você foca em atender seus novos clientes. Baixo custo inicial e tranquilidade operacional garantida.
              </p>
              
              <ul className="space-y-3 text-sm text-slate-200 mb-8 font-medium" suppressContentEditableWarning contentEditable>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div> Criação Premium + Hospedagem de alta performance inclusa.</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div> Previsibilidade financeira: Baixo investimento inicial.</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div> Seu site atualizado, no ar e seguro sem dores de cabeça.</li>
              </ul>
              
              <div className="border-t border-amber-500/20 pt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Setup (Criação do Site)</p>
                  <div className="flex items-baseline gap-1 text-2xl font-black text-white">
                    R$ <input type="text" value={priceHermesSetup} onChange={e => setPriceHermesSetup(e.target.value)} className="bg-transparent border-none outline-none w-32 text-white focus:bg-amber-900/50 rounded px-1 -ml-1" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Licença & Servidor Dedicado</p>
                  <div className="flex items-baseline gap-1 text-2xl font-black text-amber-400">
                    R$ <input type="text" value={priceHermesMonthly} onChange={e => setPriceHermesMonthly(e.target.value)} className="bg-transparent border-none outline-none w-24 text-amber-400 focus:bg-amber-900/50 rounded px-1 -ml-1" />
                    <span className="text-sm text-amber-500/50 font-medium">/mês</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === PÁGINA 5: ATENA, QUEM SOMOS E FECHAMENTO === */}
        <div className="w-full h-[297mm] p-16 flex flex-col relative bg-slate-950 border-b-8 border-primary overflow-hidden">
          
          <div className="mb-10 p-8 bg-blue-950/20 border border-blue-900/30 rounded-3xl shrink-0">
            <h3 className="text-2xl font-black text-blue-400 mb-2 flex items-center gap-2"><Server className="w-5 h-5"/> O Escudo de Atena</h3>
            <p className="text-sm text-slate-400 mb-6 italic" suppressContentEditableWarning contentEditable>"A sabedoria ensina que um site sem manutenção é como uma fortaleza sem guardas." Este pacote opcional blinda seu ativo digital.</p>
            <ul className="space-y-2 text-sm text-slate-300 mb-6" suppressContentEditableWarning contentEditable>
              <li>• <strong>Proteção constante:</strong> Atualizações rigorosas de sistema e barreira contra invasões.</li>
              <li>• <strong>Vigilância 24/7:</strong> Monitoramento de estabilidade. Se o site cair, nossa equipe sabe antes de você.</li>
              <li>• <strong>Dinamicidade:</strong> Pequenas alterações de texto e fotos mensais inclusas, para o site nunca ficar defasado.</li>
            </ul>
            <div className="flex items-center gap-2 text-sm bg-slate-900/50 p-3 rounded-xl border border-slate-800">
              <span className="font-bold text-blue-400 uppercase tracking-widest text-[10px]">Valor Mensal da Manutenção:</span>
              <span className="font-black text-white">R$ <input type="text" value={priceAthena} onChange={e => setPriceAthena(e.target.value)} className="bg-transparent border-none outline-none w-20 text-white focus:bg-blue-900/50 rounded px-1" /></span>
              <span className="text-[10px] text-slate-500 uppercase">(Opcional no Plano Zeus. Já 100% incluso no Plano Hermes)</span>
            </div>
          </div>

          <div className="mb-8 shrink-0">
            <h3 className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-4 flex items-center gap-2"><Globe className="w-4 h-4"/> Sobre Nós</h3>
            <div className="grid grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-sm text-slate-300 leading-relaxed mb-4" suppressContentEditableWarning contentEditable>
                  A <strong>Olimpo Soluções</strong> é formada por arquitetos digitais focados em trazer o poder da alta conversão para empresas terrenas. Nossa missão é conectar a sabedoria milenar do bom design com a tecnologia de vanguarda.
                </p>
                <p className="text-sm text-slate-300 leading-relaxed font-bold" suppressContentEditableWarning contentEditable>
                  Entregamos 100% de Código Proprietário, suporte divino e infinitas possibilidades de escalabilidade para que a sua empresa cresça sem barreiras tecnológicas.
                </p>
              </div>
              <EditableImage 
                value={imgOlimpo} onChange={setImgOlimpo} alt="Olimpo Temple" 
                isGenerating={isGeneratingAI} isLocked={lockedOlimpo} onToggleLock={() => setLockedOlimpo(!lockedOlimpo)} 
              />
            </div>
          </div>

          <div className="mt-auto text-center shrink-0">
            <h3 className="text-sm font-black text-amber-500 uppercase tracking-[0.3em] mb-4">O Oráculo Dita o Futuro</h3>
            <h2 className="text-3xl font-black text-white mb-4" suppressContentEditableWarning contentEditable>"O futuro pertence àqueles que ousam ascender ao Olimpo Digital."</h2>
            <p className="text-sm text-slate-400 mb-8" suppressContentEditableWarning contentEditable>O poder de converter mais visitantes em clientes está ao seu alcance. Vamos iniciar esta jornada?</p>
            
            <div className="inline-block px-10 py-4 bg-primary text-white font-black uppercase tracking-widest rounded-full text-sm shadow-[0_0_20px_#3B82F640]">
              Aprovar Proposta e Iniciar Projeto
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}