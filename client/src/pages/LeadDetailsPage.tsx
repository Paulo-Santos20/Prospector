import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Phone, Mail, Share2, Facebook, Instagram,
  ExternalLink, AlertCircle, Sparkles, Palette, Type, Star,
  UtensilsCrossed, Save, MessageSquare, Loader2, Globe, FileDown
} from 'lucide-react';
import { type Lead, fetchLeadSocials, enrichLead } from '../features/search/services/searchService';
import { ProposalModal } from '../features/leads/components/ProposalModal';
import { saveLeadToCRM, updateLeadNotes } from '../features/crm/services/crmService';
import { useState, useEffect } from 'react';

export default function LeadDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [lead] = useState<Lead | null>(location.state?.lead || null);
  const [loadingLead] = useState(!location.state?.lead);

  const rating = lead?.rating;
  const userRatingCount = lead?.userRatingCount;

  // Estados para Modal, CRM e Notas
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [notes, setNotes] = useState(lead?.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Estados para busca sob demanda e enriquecimento
  const [socialLinks, setSocialLinks] = useState(lead?.analysis?.socialLinks || []);
  const [emails, setEmails] = useState<string[]>(lead?.analysis?.emails || []);
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichedData, setEnrichedData] = useState(lead?.analysis?.aiData);

  const analysis = lead?.analysis;
  const analysisData = enrichedData || analysis?.aiData;

  // Helper functions
  const formatFollowers = (count: number): string => {
    if (count === 0) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  const MetricCard = ({ icon, value, label, subtext }: { icon: string; value: string; label: string; subtext?: string }) => (
    <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700/50">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400 uppercase tracking-wider">{label}</div>
      {subtext && <div className="text-[10px] text-slate-500 mt-1">{subtext}</div>}
    </div>
  );

// Efeito para buscar redes, emails e enriquecer ao entrar na página
  useEffect(() => {
    if (!lead) return;

    let isMounted = true;

    const loadExtras = async () => {
      setLoadingExtras(true);
      try {
        const [socialData] = await Promise.all([
          fetchLeadSocials(lead.id, lead.displayName.text, lead.formattedAddress)
        ]);

        if (isMounted) {
          if (socialData.socialLinks) setSocialLinks(socialData.socialLinks);
          if (socialData.emails) setEmails(socialData.emails);
        }
      } catch (error) {
        console.error("Erro ao carregar dados extras", error);
      } finally {
        if (isMounted) setLoadingExtras(false);
      }
    };

    const enrichLeadData = async () => {
      setIsEnriching(true);
      try {
        const result = await enrichLead(lead.id);
        if (isMounted && result.aiData) {
          setEnrichedData(result.aiData);
        }
      } catch (error) {
        console.error("Erro ao enriquecer lead", error);
      } finally {
        if (isMounted) setIsEnriching(false);
      }
    };

    loadExtras();
    enrichLeadData();

    return () => { isMounted = false; };
  }, [lead?.id]);

  if (loadingLead) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin mb-4" />
      <span className="font-black uppercase tracking-widest">Carregando Lead...</span>
    </div>
  );

  if (!lead) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-slate-400">
      <span className="font-black uppercase tracking-widest mb-4">Lead Não Encontrado</span>
      <button
        onClick={() => navigate('/')}
        className="text-primary hover:underline"
      >
        Voltar ao Dashboard
      </button>
    </div>
  );

  const handleSaveToCRM = async () => {
    try {
      await saveLeadToCRM(lead);
      setIsSaved(true);
    } catch (error) {
      console.error("Erro ao salvar no CRM", error);
    }
  };

  const ds = analysisData as any;
  const pColor = '#3B82F6';
  const sColor = '#6366F1';

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

  // Função que chama a janela de impressão nativa do navegador para salvar como PDF
  const handlePrintPDF = () => {
    window.print();
  };

  const getSocialIcon = (network: string) => {
    switch (network.toLowerCase()) {
      case 'facebook': return <Facebook className="w-5 h-5 text-[#1877F2]" />;
      case 'instagram': return <Instagram className="w-5 h-5 text-[#E4405F]" />;
      case 'ifood': return <UtensilsCrossed className="w-5 h-5 text-[#EA1D2C]" />;
      default: return <Share2 className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    // Adicionado 'print:bg-white print:text-black' para garantir que o PDF saia legível e limpo se necessário
    <div className="min-h-screen bg-background text-slate-200 pb-20 font-sans selection:bg-primary selection:text-white print:bg-white">

      {/* HEADER - Escondido na hora da impressão (print:hidden) */}
      <header className="border-b border-slate-800 bg-surface/80 backdrop-blur-md sticky top-0 z-50 px-4 h-20 flex items-center justify-between print:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center text-slate-400 hover:text-white transition-all font-black uppercase text-[10px] tracking-[0.3em] group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Voltar
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-black tracking-[0.4em] text-slate-500 uppercase italic">Intelligence Report v2.0</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-12 print:mt-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 print:block">

          <div className="lg:col-span-2 space-y-10">
            {/* HERO CARD */}
            <div className="bg-surface border border-slate-700/50 rounded-[3rem] p-10 shadow-3xl relative overflow-hidden group print:border-slate-300 print:shadow-none print:bg-slate-50">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] opacity-10 blur-[120px] pointer-events-none print:hidden" style={{ backgroundColor: pColor }}></div>

              <h1 className="text-6xl font-black text-white mb-4 tracking-tighter leading-none italic uppercase relative z-10 print:text-slate-900">
                {lead.displayName.text}
              </h1>

              <div className="flex items-center text-slate-400 mb-10 text-sm font-medium opacity-70 print:text-slate-600">
                <MapPin className="w-4 h-4 mr-2" style={{ color: pColor }} /> {lead.formattedAddress}
              </div>

              {isEnriching ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span className="text-[12px] font-black text-amber-400 uppercase tracking-[0.3em]">Enriquecendo dados...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-500/20 rounded-lg"><AlertCircle className="w-5 h-5 text-red-500" /></div>
                  <span className="text-[12px] font-black text-red-500 uppercase tracking-[0.3em]">Diagnóstico de Conversão</span>
                  {analysisData?.urgency && (
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                      analysisData.urgency === 'high' ? 'bg-red-500/30 text-red-400' :
                      analysisData.urgency === 'medium' ? 'bg-amber-500/30 text-amber-400' :
                      'bg-green-500/30 text-green-400'
                    }`}>
                      {analysisData.urgency === 'high' ? 'Urgente' : analysisData.urgency === 'medium' ? 'Médio' : 'Baixo'}
                    </span>
                  )}
                  {analysisData?.conversionOpportunity && (
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                      analysisData.conversionOpportunity === 'A' ? 'bg-purple-500/30 text-purple-400' :
                      analysisData.conversionOpportunity === 'B' ? 'bg-blue-500/30 text-blue-400' :
                      'bg-slate-500/30 text-slate-400'
                    }`}>
                      Opp. {analysisData.conversionOpportunity}
                    </span>
                  )}
                </div>
              )}
              {/* KEY METRICS */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <MetricCard
                  icon="★"
                  value={analysisData?.keyMetrics?.rating?.toFixed(1) || rating?.toFixed(1) || 'N/A'}
                  label="Avaliação"
                  subtext={analysisData?.keyMetrics?.rating ? `${rating}/5` : undefined}
                />
                <MetricCard
                  icon="📝"
                  value={analysisData?.keyMetrics?.reviewCount?.toLocaleString() || userRatingCount?.toLocaleString() || '0'}
                  label="Avaliações"
                />
                <MetricCard
                  icon="👥"
                  value={formatFollowers(analysisData?.keyMetrics?.totalFollowers || 0)}
                  label="Seguidores"
                />
              </div>

              {/* MAIN PAIN POINT */}
              <p className="text-lg text-slate-100 font-semibold leading-relaxed">
                {analysisData?.mainPainPoint || 'Análise em progresso...'}
              </p>

              {/* SPECIFIC ISSUES */}
              {analysisData?.specificIssues && analysisData.specificIssues.length > 0 && (
                <div className="space-y-2 mt-4">
                  {analysisData.specificIssues.map((issue: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className={`text-[10px] px-2 py-1 rounded uppercase font-bold ${
                        issue.impact === 'high' ? 'bg-red-500/30 text-red-400' :
                        issue.impact === 'medium' ? 'bg-yellow-500/30 text-yellow-400' :
                        'bg-slate-600/30 text-slate-400'
                      }`}>
                        {issue.type.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-slate-300">{issue.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* HISTÓRICO DE CONTATO (Oculto no PDF para manter sigilo) */}
            <section className="bg-surface/40 border border-slate-800 rounded-[3rem] p-10 shadow-xl print:hidden">
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Histórico de Contato</h2>
              </div>
              <div className="relative">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Registre as interações (ex: Liguei e falei com o proprietário, retorno agendado para terça)..."
                  className="w-full bg-background border border-slate-700 rounded-2xl p-6 text-slate-300 outline-none focus:ring-2 focus:ring-primary min-h-[150px] transition-all resize-none shadow-inner"
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

            {/* BRANDING IA */}
            <section className="bg-surface/40 border border-slate-800 rounded-[3rem] p-10 shadow-xl print:border-slate-300 print:shadow-none print:mt-10">
              <div className="flex items-center gap-4 mb-12 border-b border-slate-800 pb-8 print:border-slate-300">
                <div className="p-4 bg-primary/10 rounded-2xl" style={{ backgroundColor: `${pColor}15` }}>
                  <Palette className="w-8 h-8" style={{ color: pColor }} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none print:text-slate-900">Manual Visual Sugerido</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">Design Advisory Report</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-10">
                  <div className="flex items-end gap-6">
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Base</p>
                      <div className="w-20 h-20 rounded-[2rem] shadow-2xl border-4 border-white/10 print:border-slate-300 print:shadow-none" style={{ backgroundColor: pColor }}></div>
                      <p className="text-xs font-mono text-white text-center uppercase print:text-slate-700">{pColor}</p>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Destaque</p>
                      <div className="w-14 h-14 rounded-[1.5rem] shadow-xl border-2 border-white/10 print:border-slate-300 print:shadow-none" style={{ backgroundColor: sColor }}></div>
                      <p className="text-[10px] font-mono text-slate-400 text-center uppercase">{sColor}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-background/50 rounded-2xl border border-slate-700/50 print:border-slate-300 print:bg-slate-50">
                      <div className="flex items-center gap-2 mb-2 text-slate-500"><Type className="w-3 h-3" /> <span className="text-[9px] font-black uppercase">Títulos</span></div>
                      <p className="text-sm font-black text-white truncate print:text-slate-900">{ds?.typography?.heading || 'Montserrat'}</p>
                    </div>
                    <div className="p-5 bg-background/50 rounded-2xl border border-slate-700/50 print:border-slate-300 print:bg-slate-50">
                      <div className="flex items-center gap-2 mb-2 text-slate-500"><Type className="w-3 h-3" /> <span className="text-[9px] font-black uppercase">Corpo</span></div>
                      <p className="text-sm font-black text-white truncate print:text-slate-900">{ds?.typography?.body || 'Inter'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-background/40 rounded-[2rem] border border-slate-800 print:border-slate-300 print:bg-slate-50">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Estilo: <span className="text-white ml-2 italic uppercase print:text-slate-900">{ds?.style || 'Contemporâneo'}</span></p>
                    <p className="text-sm text-slate-300 italic font-medium leading-relaxed mb-6 print:text-slate-700">
                      "{ds?.designReasoning || 'Escolha visual focada em elevar o valor percebido da marca no ambiente digital.'}"
                    </p>
                    <a href={ds?.referenceSite || 'https://www.behance.net'} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full p-4 bg-white/5 rounded-xl text-[10px] font-black uppercase border border-white/5 hover:bg-white/10 transition-all text-primary print:border-slate-300">
                        <ExternalLink className="w-3 h-3" /> Ver Referência de Estilo
                      </a>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* SIDEBAR DE AÇÕES E CONTATOS */}
          <div className="space-y-6 print:mt-10">

            {/* GRUPO DE BOTÕES - Ocultos na Impressão */}
            <div className="space-y-4 print:hidden">
              <button
                onClick={handlePrintPDF}
                className="w-full font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 border shadow-lg bg-emerald-600/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-600/20 active:scale-95"
              >
                <FileDown className="w-5 h-5" /> Baixar Relatório (PDF)
              </button>

              <button
                onClick={handleSaveToCRM}
                disabled={isSaved}
                className={`w-full font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 border shadow-lg ${isSaved ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-surface hover:text-amber-400 border-slate-700 active:scale-95'
                  }`}
              >
                <Star className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                {isSaved ? 'Lead no CRM' : 'Favoritar (CRM)'}
              </button>

              <button onClick={() => navigate(`/proposal/${lead.id}`, { state: { lead } })} className="w-full text-white font-black py-8 rounded-[2.5rem] shadow-2xl transition-all flex flex-col items-center justify-center gap-1 hover:scale-[1.02] active:scale-95 uppercase italic tracking-tighter text-xl" style={{ backgroundColor: pColor }}>
                Elaborar Proposta (PDF)
                <span className="text-[10px] opacity-80 not-italic tracking-widest uppercase font-bold mt-1">Metodologia Olimpo</span>
              </button>

              <button onClick={() => setIsModalOpen(true)} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-[1.5rem] transition-all flex items-center justify-center gap-2 text-sm">
                <MessageSquare className="w-4 h-4" /> Gerar Script Rápido (WhatsApp)
              </button>
            </div>

            <div className="bg-surface border border-slate-700 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden print:border-slate-300 print:shadow-none print:break-inside-avoid">
              {loadingExtras && (
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-800 print:hidden">
                  <div className="h-full bg-primary animate-pulse w-1/2"></div>
                </div>
              )}

              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8 border-b border-slate-800 pb-3 print:border-slate-300">Business Intelligence</h3>

              <div className="space-y-6">

                {/* TELEFONE */}
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary print:bg-slate-100"><Phone className="w-5 h-5" /></div>
                  <span className="text-sm font-bold print:text-slate-900">{lead.internationalPhoneNumber || 'Não informado'}</span>
                </div>

                {/* E-MAILS */}
                {(emails.length > 0 || loadingExtras) && (
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary print:bg-slate-100"><Mail className="w-5 h-5" /></div>
                    <div className="space-y-2 w-full">
                      {loadingExtras && emails.length === 0 ? (
                        <span className="text-xs italic text-slate-500 block mt-2 print:hidden">Buscando e-mails...</span>
                      ) : (
                        emails.map((e: string, idx: number) => (
                          <span key={idx} className="block text-xs font-mono text-blue-300 select-all font-bold border-b border-slate-800 pb-2 last:border-0 print:text-slate-700 print:border-slate-200">{e}</span>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* NOVO: SITE OFICIAL (Se Existir) */}
                {lead.websiteUri && (
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary print:bg-slate-100"><Globe className="w-5 h-5" /></div>
                    <div className="space-y-1 w-full overflow-hidden">
                      <span className="block text-[10px] text-slate-500 font-black uppercase tracking-widest">Domínio Atual</span>
                      <a href={lead.websiteUri} target="_blank" rel="noreferrer" className="block text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors truncate font-bold print:text-blue-600">
                        {lead.websiteUri}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* LISTAGEM DE REDES SOCIAIS E MARKETPLACES */}
              <div className="flex justify-center flex-wrap gap-4 mt-10 pt-6 border-t border-slate-800 print:border-slate-300">
                {loadingExtras && socialLinks.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 animate-pulse w-full print:hidden">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    <span className="text-[8px] font-black uppercase text-slate-500">Rastreando Redes...</span>
                  </div>
                ) : socialLinks && socialLinks.length > 0 ? (
                  socialLinks.map((s: any, i: number) => (
                    <a key={i} href={s.url} target="_blank" rel="noreferrer" className="p-4 bg-slate-900 border border-slate-700 rounded-2xl hover:border-primary transition-all flex flex-col items-center gap-2 group print:border-slate-300 print:bg-slate-50">
                      {getSocialIcon(s.network)}
                      <span className="text-[8px] uppercase font-bold text-slate-500 group-hover:text-white transition-colors print:text-slate-800">{s.network}</span>
                    </a>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-600 italic print:text-slate-500">Redes Sociais não mapeadas</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL (Oculto na impressão) */}
      <div className="print:hidden">
        <ProposalModal lead={lead} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </div>
  );
}