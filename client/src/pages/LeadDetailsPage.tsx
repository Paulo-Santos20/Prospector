import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Phone, Mail, Share2, Facebook, Instagram, 
  ExternalLink, AlertCircle, Sparkles, Palette, Type, Star, 
  UtensilsCrossed, Save, MessageSquare 
} from 'lucide-react';
import { type Lead } from '../features/search/services/searchService';
import { ProposalModal } from '../features/leads/components/ProposalModal';
import { saveLeadToCRM, updateLeadNotes } from '../features/crm/services/crmService';
import { useState } from 'react';

export default function LeadDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Recupera o lead do estado da rota
  const lead = location.state?.lead as Lead;
  
  // Estados para Modal, CRM e Notas
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [notes, setNotes] = useState((lead as any)?.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Fallback para sessão expirada
  if (!lead) return (
    <div className="min-h-screen bg-background flex items-center justify-center text-slate-400 font-black uppercase tracking-widest">
      Sessão Expirada ou Lead Inválido
    </div>
  );

  const { analysis } = lead;
  const analysisData: any = analysis;
  const ds = analysisData?.aiData?.designStrategy;
  
  // Definição de cores baseada na estratégia da IA
  const pColor = ds?.primaryColor || '#3B82F6';
  const sColor = ds?.secondaryColor || '#6366F1';

  // Função para salvar no CRM
  const handleSaveToCRM = async () => {
    try {
      await saveLeadToCRM(lead);
      setIsSaved(true);
    } catch (error) {
      console.error("Erro ao salvar no CRM", error);
    }
  };

  // Função para salvar anotações de contato
  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await updateLeadNotes(lead.id, notes);
      alert("Histórico atualizado no CRM!");
    } catch (error) {
      console.error("Erro ao salvar notas", error);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Helper de ícones para redes sociais e marketplaces
  const getSocialIcon = (network: string) => {
    switch (network.toLowerCase()) {
      case 'facebook': return <Facebook className="w-5 h-5 text-[#1877F2]" />;
      case 'instagram': return <Instagram className="w-5 h-5 text-[#E4405F]" />;
      case 'ifood': return <UtensilsCrossed className="w-5 h-5 text-[#EA1D2C]" />;
      default: return <Share2 className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-200 pb-20 font-sans selection:bg-primary selection:text-white">
      {/* HEADER */}
      <header className="border-b border-slate-800 bg-surface/80 backdrop-blur-md sticky top-0 z-50 px-4 h-20 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center text-slate-400 hover:text-white transition-all font-black uppercase text-[10px] tracking-[0.3em] group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Voltar
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-black tracking-[0.4em] text-slate-500 uppercase italic">Intelligence Report v2.0</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          <div className="lg:col-span-2 space-y-10">
            {/* HERO CARD & DIAGNÓSTICO */}
            <div className="bg-surface border border-slate-700/50 rounded-[3rem] p-10 shadow-3xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-[500px] h-[500px] opacity-10 blur-[120px] pointer-events-none" style={{ backgroundColor: pColor }}></div>
               
               <h1 className="text-6xl font-black text-white mb-4 tracking-tighter leading-none italic uppercase relative z-10">
                 {lead.displayName.text}
               </h1>
               
               <div className="flex items-center text-slate-400 mb-10 text-sm font-medium opacity-70">
                 <MapPin className="w-4 h-4 mr-2" style={{ color: pColor }} /> {lead.formattedAddress}
               </div>

               <div className="p-8 bg-red-500/5 border-l-8 border-red-500 rounded-r-[2rem] relative z-10 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-500/20 rounded-lg"><AlertCircle className="w-5 h-5 text-red-500" /></div>
                    <span className="text-[12px] font-black text-red-500 uppercase tracking-[0.3em]">Diagnóstico de Conversão</span>
                  </div>
                  <p className="text-xl text-slate-100 font-medium italic leading-relaxed">
                    {analysis.status === 'NO_WEBSITE' 
                      ? "Ausência de site profissional. A empresa depende de plataformas de terceiros, resultando em menor autoridade e margens reduzidas." 
                      : `"${analysisData?.aiData?.mainPainPoint || 'O site atual apresenta falhas estruturais que impedem a conversão máxima de leads.'}"`}
                  </p>
               </div>
            </div>

            {/* SEÇÃO: HISTÓRICO DE CONTATO */}
            <section className="bg-surface/40 border border-slate-800 rounded-[3rem] p-10 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Histórico de Contato</h2>
              </div>
              <div className="relative">
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Registre as interações (ex: Liguei e falei com o proprietário, retorno agendado para terça)..."
                  className="w-full bg-background border border-slate-700 rounded-2xl p-6 text-slate-300 outline-none focus:ring-2 focus:ring-primary min-h-[150px] transition-all resize-none"
                />
                <button 
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="absolute bottom-4 right-4 bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg"
                >
                  {isSavingNotes ? 'Salvando...' : <><Save className="w-4 h-4" /> Salvar Nota</>}
                </button>
              </div>
            </section>

            {/* SEÇÃO: BRANDING & ESTRATÉGIA VISUAL */}
            <section className="bg-surface/40 border border-slate-800 rounded-[3rem] p-10 shadow-xl">
              <div className="flex items-center gap-4 mb-12 border-b border-slate-800 pb-8">
                <div className="p-4 bg-primary/10 rounded-2xl" style={{ backgroundColor: `${pColor}15` }}>
                  <Palette className="w-8 h-8" style={{ color: pColor }} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Manual Visual Sugerido</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">Design Advisory Report</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-10">
                  <div className="flex items-end gap-6">
                    <div className="space-y-3">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Primária</p>
                       <div className="w-20 h-20 rounded-[2rem] shadow-2xl border-4 border-white/10" style={{ backgroundColor: pColor }}></div>
                       <p className="text-xs font-mono text-white text-center">{pColor}</p>
                    </div>
                    <div className="space-y-3">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Secundária</p>
                       <div className="w-14 h-14 rounded-[1.5rem] shadow-xl border-2 border-white/10" style={{ backgroundColor: sColor }}></div>
                       <p className="text-[10px] font-mono text-slate-400 text-center">{sColor}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-5 bg-background/50 rounded-2xl border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-2 text-slate-500"><Type className="w-3 h-3" /> <span className="text-[9px] font-black uppercase">Títulos</span></div>
                        <p className="text-sm font-black text-white truncate">{ds?.typography?.heading || 'Montserrat'}</p>
                     </div>
                     <div className="p-5 bg-background/50 rounded-2xl border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-2 text-slate-500"><Type className="w-3 h-3" /> <span className="text-[9px] font-black uppercase">Corpo</span></div>
                        <p className="text-sm font-black text-white truncate">{ds?.typography?.body || 'Inter'}</p>
                     </div>
                  </div>
                </div>

                <div className="space-y-6">
                   <div className="p-6 bg-background/40 rounded-[2rem] border border-slate-800">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Estilo: <span className="text-white ml-2">{ds?.style || 'Contemporâneo'}</span></p>
                      <p className="text-sm text-slate-300 italic leading-relaxed mb-6">
                        "{ds?.designReasoning || 'Identidade visual focada em elevar o valor percebido da marca no ambiente digital.'}"
                      </p>
                      {ds?.referenceSite && (
                        <a href={ds.referenceSite} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full p-4 bg-white/5 rounded-xl text-[10px] font-black uppercase border border-white/5 hover:bg-white/10 transition-all text-primary">
                           <ExternalLink className="w-3 h-3" /> Ver Referência de Estilo
                        </a>
                      )}
                   </div>
                </div>
              </div>
            </section>
          </div>

          {/* SIDEBAR DE AÇÕES */}
          <div className="space-y-6">
            <button 
              onClick={handleSaveToCRM}
              disabled={isSaved}
              className={`w-full font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 border shadow-lg ${
                isSaved ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-surface hover:text-amber-400 border-slate-700 active:scale-95'
              }`}
            >
              <Star className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              {isSaved ? 'Lead no CRM' : 'Favoritar (CRM)'}
            </button>

            <button onClick={() => setIsModalOpen(true)} className="w-full text-white font-black py-8 rounded-[2.5rem] shadow-2xl transition-all flex flex-col items-center justify-center gap-1 active:scale-95 uppercase italic tracking-tighter text-xl" style={{ backgroundColor: pColor }}>
              Enviar Proposta
              <span className="text-[9px] opacity-60 not-italic tracking-widest uppercase font-bold">Baseada em Inteligência</span>
            </button>

            <div className="bg-surface border border-slate-700 rounded-[2.5rem] p-8 shadow-xl">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8 border-b border-slate-800 pb-3">Contatos e Redes</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary"><Phone className="w-5 h-5" /></div>
                  <span className="text-sm font-bold">{lead.internationalPhoneNumber || 'Não informado'}</span>
                </div>
                {analysisData?.emails?.length > 0 && (
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary"><Mail className="w-5 h-5" /></div>
                    <div className="space-y-1">
                      {analysisData.emails.map((e: string) => <span key={e} className="block text-xs font-mono text-blue-300 select-all">{e}</span>)}
                    </div>
                  </div>
                )}
              </div>
              
              {/* LISTAGEM DE REDES SOCIAIS E IFOOD */}
              <div className="flex justify-center flex-wrap gap-4 mt-10 pt-6 border-t border-slate-800">
                {analysis.socialLinks?.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noreferrer" className="p-4 bg-slate-900 border border-slate-700 rounded-2xl hover:border-primary transition-all flex flex-col items-center gap-2 group">
                    {getSocialIcon(s.network)}
                    <span className="text-[8px] uppercase font-bold text-slate-500 group-hover:text-white transition-colors">{s.network}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <ProposalModal lead={lead} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}