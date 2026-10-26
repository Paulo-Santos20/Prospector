import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Phone, Mail, Share2, Facebook, Instagram,
  ExternalLink, AlertCircle, Sparkles, Palette, Type, Star,
  UtensilsCrossed, Save, MessageSquare, Loader2, Globe, FileDown
} from 'lucide-react';
import { type Lead, enrichLead, fetchLeadById } from '../features/search/services/searchService';
import { ProposalModal } from '../features/leads/components/ProposalModal';
import { saveLeadToCRM, updateLeadNotes } from '../features/crm/services/crmService';
import { UserMenu } from '../app/UserMenu';
import { useState, useEffect } from 'react';

export default function LeadDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [lead, setLead] = useState<Lead | null>(location.state?.lead || null);
  const [loadingLead, setLoadingLead] = useState(!location.state?.lead);

  useEffect(() => {
    if (!lead && id) {
      setLoadingLead(true);
      fetchLeadById(id).then(data => {
        if (data) setLead(data);
        setLoadingLead(false);
      }).catch(() => setLoadingLead(false));
    }
  }, [lead, id]);

  const rating = lead?.rating;
  const userRatingCount = lead?.userRatingCount;

  // Estados para Modal, CRM e Notas
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesFeedback, setNotesFeedback] = useState('');

  // Dados de contato já vêm da análise do site; enriquecimento só gera o diagnóstico.
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichedData, setEnrichedData] = useState(lead?.analysis?.aiData);

  const analysis = lead?.analysis;
  const analysisData = enrichedData || analysis?.aiData;
  const socialLinks = analysis?.socialLinks || [];
  const emails = analysis?.emails || [];

  // Helper functions
  const formatFollowers = (count: number): string => {
    if (count === 0) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  const MetricCard = ({ icon, value, label, subtext }: { icon: string; value: string; label: string; subtext?: string }) => (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-2.5 text-center sm:p-4">
      <div className="mb-1 text-xl sm:text-2xl">{icon}</div>
      <div className="text-base font-bold text-white sm:text-xl">{value}</div>
      <div className="text-[9px] uppercase tracking-wide text-slate-400 sm:text-xs sm:tracking-wider">{label}</div>
      {subtext && <div className="mt-1 text-[9px] text-slate-500 sm:text-[10px]">{subtext}</div>}
    </div>
  );

  const leadId = lead?.id;

  useEffect(() => {
    if (!leadId || !lead || lead.analysis?.aiData) return;

    let isMounted = true;

    const enrichLeadData = async () => {
      setIsEnriching(true);
      try {
        const result = await enrichLead(leadId);
        if (isMounted && result.aiData) {
          setEnrichedData(result.aiData);
        }
      } catch (error) {
        console.error('Erro ao enriquecer lead', error);
      } finally {
        if (isMounted) setIsEnriching(false);
      }
    };

    enrichLeadData();

    return () => {
      isMounted = false;
    };
  }, [leadId, lead]);

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

  const design = analysisData?.designStrategy;
  const pColor = design?.primaryColor || '#3B82F6';
  const sColor = design?.secondaryColor || '#6366F1';

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    setNotesFeedback('');
    try {
      await updateLeadNotes(lead.id, notes);
      setNotesFeedback('Histórico atualizado no CRM.');
    } catch (error) {
      console.error("Erro ao salvar notas", error);
      setNotesFeedback('Não foi possível salvar o histórico.');
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

  const renderActions = (compact = false) => (
    <div className={compact ? 'grid grid-cols-2 gap-2 print:hidden lg:hidden' : 'hidden space-y-4 print:hidden lg:block'}>
      <button
        type="button"
        onClick={handlePrintPDF}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-600/10 font-black text-emerald-400 shadow-lg transition-all hover:bg-emerald-600/20 active:scale-95 ${compact ? 'col-span-1 py-3 text-xs' : 'py-4'}`}
      >
        <FileDown className="h-4 w-4 sm:h-5 sm:w-5" /> Baixar PDF
      </button>

      <button
        type="button"
        onClick={handleSaveToCRM}
        disabled={isSaved}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl border font-black shadow-lg transition-all ${isSaved ? 'border-amber-500/20 bg-amber-500/10 text-amber-400' : 'border-slate-700 bg-surface hover:text-amber-400 active:scale-95'} ${compact ? 'col-span-1 py-3 text-xs' : 'py-4'}`}
      >
        <Star className={`h-4 w-4 sm:h-5 sm:w-5 ${isSaved ? 'fill-current' : ''}`} />
        {isSaved ? 'Lead no CRM' : 'Favoritar (CRM)'}
      </button>

      <button
        type="button"
        onClick={() => navigate(`/proposal/${lead.id}`, { state: { lead } })}
        className={`flex w-full flex-col items-center justify-center gap-1 rounded-2xl font-black italic uppercase tracking-tighter text-white shadow-2xl transition-all hover:scale-[1.02] active:scale-95 ${compact ? 'col-span-2 py-4 text-sm' : 'py-8 text-xl'}`}
        style={{ backgroundColor: pColor }}
      >
        Elaborar Proposta (PDF)
        <span className={`font-bold uppercase not-italic tracking-widest opacity-80 ${compact ? 'text-[9px]' : 'mt-1 text-[10px]'}`}>Metodologia Olimpo</span>
      </button>

      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-800 text-sm font-black text-white transition-all hover:bg-slate-700 ${compact ? 'col-span-2 py-3 text-xs' : 'rounded-[1.5rem] py-4'}`}
      >
        <MessageSquare className="h-4 w-4" /> Gerar Script Rápido (WhatsApp)
      </button>
    </div>
  );

  return (
    // Adicionado 'print:bg-white print:text-black' para garantir que o PDF saia legível e limpo se necessário
    <div className="min-h-screen bg-background text-slate-200 pb-20 font-sans selection:bg-primary selection:text-white print:bg-white">

      {/* HEADER - Escondido na hora da impressão (print:hidden) */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-800 bg-surface/80 px-3 backdrop-blur-md print:hidden sm:h-20 sm:px-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="group flex items-center rounded-lg text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 transition-all hover:text-white sm:tracking-[0.3em]"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" /> Voltar
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span className="truncate text-[10px] font-black uppercase italic tracking-[0.3em] text-slate-500">Intelligence Report v2.0</span>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="mx-auto mt-6 max-w-6xl px-3 print:mt-0 sm:mt-10 sm:px-4">
        <div className="grid grid-cols-1 gap-6 print:block lg:grid-cols-3 lg:gap-10">

          <div className="space-y-6 lg:col-span-2 lg:space-y-10">
            {/* HERO CARD */}
            <div className="group relative overflow-hidden rounded-3xl border border-slate-700/50 bg-surface p-5 shadow-3xl print:border-slate-300 print:bg-slate-50 print:shadow-none sm:rounded-[3rem] sm:p-8 lg:p-10">
              <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] opacity-10 blur-[120px] print:hidden" style={{ backgroundColor: pColor }}></div>

              <h1 className="relative z-10 mb-3 break-words text-4xl font-black italic uppercase leading-none tracking-tighter text-white print:text-slate-900 sm:mb-4 sm:text-5xl lg:text-6xl">
                {lead.displayName.text}
              </h1>

              <div className="mb-6 flex items-start gap-2 text-xs font-medium text-slate-400 opacity-70 print:text-slate-600 sm:mb-10 sm:text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: pColor }} /> <span className="break-words">{lead.formattedAddress}</span>
              </div>

              {isEnriching ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 sm:text-[12px] sm:tracking-[0.3em]">Enriquecendo dados...</span>
                </div>
              ) : (
                <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="rounded-lg bg-red-500/20 p-2"><AlertCircle className="h-5 w-5 text-red-500" /></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 sm:text-[12px] sm:tracking-[0.3em]">Diagnóstico de Conversão</span>
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
              <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-4">
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
              <p className="text-base font-semibold leading-relaxed text-slate-100 sm:text-lg">
                {analysisData?.mainPainPoint || 'Análise em progresso...'}
              </p>

              {/* SPECIFIC ISSUES */}
              {analysisData?.specificIssues && analysisData.specificIssues.length > 0 && (
                <div className="mt-4 space-y-2">
                  {analysisData.specificIssues.map((issue, idx) => (
                    <div key={idx} className="flex items-start gap-2 sm:gap-3">
                      <span className={`shrink-0 rounded px-2 py-1 text-[10px] font-bold uppercase ${
                        issue.impact === 'high' ? 'bg-red-500/30 text-red-400' :
                        issue.impact === 'medium' ? 'bg-yellow-500/30 text-yellow-400' :
                        'bg-slate-600/30 text-slate-400'
                      }`}>
                        {issue.type.replace('_', ' ')}
                      </span>
                      <span className="break-words text-sm text-slate-300">{issue.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {renderActions(true)}

            {/* HISTÓRICO DE CONTATO (Oculto no PDF para manter sigilo) */}
            <section className="rounded-3xl border border-slate-800 bg-surface/40 p-5 shadow-xl print:hidden sm:rounded-[3rem] sm:p-8 lg:p-10">
              <div className="mb-5 flex items-center gap-3 sm:mb-6">
                <MessageSquare className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                <h2 className="text-xl font-black italic uppercase tracking-tighter text-white sm:text-2xl">Histórico de Contato</h2>
              </div>
              <div className="relative">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Registre as interações (ex: Liguei e falei com o proprietário, retorno agendado para terça)..."
                  aria-label="Histórico de contato"
                  className="min-h-[150px] w-full resize-none rounded-2xl border border-slate-700 bg-background p-4 pb-16 text-slate-300 shadow-inner outline-none transition-all focus:ring-2 focus:ring-primary sm:p-6 sm:pb-16"
                />
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="absolute bottom-3 right-3 flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg transition-all hover:bg-blue-600 active:scale-95 disabled:opacity-50 sm:bottom-4 sm:right-4 sm:px-6 sm:text-sm"
                >
                  {isSavingNotes ? 'Salvando...' : <><Save className="h-4 w-4" /> Salvar Nota</>}
                </button>
              </div>
              {notesFeedback && (
                <p aria-live="polite" className="mt-3 text-xs text-slate-400">
                  {notesFeedback}
                </p>
              )}
            </section>

            {/* BRANDING IA */}
            <section className="rounded-3xl border border-slate-800 bg-surface/40 p-5 shadow-xl print:mt-10 print:border-slate-300 print:shadow-none sm:rounded-[3rem] sm:p-8 lg:p-10">
              <div className="mb-8 flex items-center gap-3 border-b border-slate-800 pb-6 print:border-slate-300 sm:mb-12 sm:gap-4 sm:pb-8">
                <div className="shrink-0 rounded-2xl bg-primary/10 p-3 sm:p-4" style={{ backgroundColor: `${pColor}15` }}>
                  <Palette className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: pColor }} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-2xl font-black italic uppercase leading-none tracking-tighter text-white print:text-slate-900 sm:text-3xl">Manual Visual Sugerido</h2>
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 sm:text-[10px] sm:tracking-[0.3em]">Design Advisory Report</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
                <div className="space-y-8 sm:space-y-10">
                  <div className="flex items-end gap-4 sm:gap-6">
                    <div className="space-y-3">
                      <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Base</p>
                      <div className="h-16 w-16 rounded-[1.5rem] border-4 border-white/10 shadow-2xl print:border-slate-300 print:shadow-none sm:h-20 sm:w-20 sm:rounded-[2rem]" style={{ backgroundColor: pColor }}></div>
                      <p className="text-center font-mono text-xs uppercase text-white print:text-slate-700">{pColor}</p>
                    </div>
                    <div className="space-y-3">
                      <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Destaque</p>
                      <div className="h-12 w-12 rounded-[1.25rem] border-2 border-white/10 shadow-xl print:border-slate-300 print:shadow-none sm:h-14 sm:w-14 sm:rounded-[1.5rem]" style={{ backgroundColor: sColor }}></div>
                      <p className="text-center font-mono text-[10px] uppercase text-slate-400">{sColor}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <div className="p-5 bg-background/50 rounded-2xl border border-slate-700/50 print:border-slate-300 print:bg-slate-50">
                      <div className="flex items-center gap-2 mb-2 text-slate-500"><Type className="w-3 h-3" /> <span className="text-[9px] font-black uppercase">Títulos</span></div>
                      <p className="text-sm font-black text-white truncate print:text-slate-900">{design?.typography?.heading || 'Montserrat'}</p>
                    </div>
                    <div className="p-5 bg-background/50 rounded-2xl border border-slate-700/50 print:border-slate-300 print:bg-slate-50">
                      <div className="flex items-center gap-2 mb-2 text-slate-500"><Type className="w-3 h-3" /> <span className="text-[9px] font-black uppercase">Corpo</span></div>
                      <p className="text-sm font-black text-white truncate print:text-slate-900">{design?.typography?.body || 'Inter'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-background/40 rounded-[2rem] border border-slate-800 print:border-slate-300 print:bg-slate-50">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Estilo: <span className="text-white ml-2 italic uppercase print:text-slate-900">{design?.style || 'Contemporâneo'}</span></p>
                    <p className="text-sm text-slate-300 italic font-medium leading-relaxed mb-6 print:text-slate-700">
                      "{design?.designReasoning || 'Escolha visual focada em elevar o valor percebido da marca no ambiente digital.'}"
                    </p>
                    <a href={design?.referenceSite || 'https://www.behance.net'} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full p-4 bg-white/5 rounded-xl text-[10px] font-black uppercase border border-white/5 hover:bg-white/10 transition-all text-primary print:border-slate-300">
                        <ExternalLink className="w-3 h-3" /> Ver Referência de Estilo
                      </a>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* SIDEBAR DE AÇÕES E CONTATOS */}
          <div className="space-y-6 print:mt-10">

            {renderActions(false)}

            <div className="relative overflow-hidden rounded-3xl border border-slate-700 bg-surface p-5 shadow-xl print:break-inside-avoid print:border-slate-300 print:shadow-none sm:rounded-[2.5rem] sm:p-8">
              <h3 className="mb-6 border-b border-slate-800 pb-3 text-[10px] font-black uppercase tracking-widest text-slate-500 print:border-slate-300 sm:mb-8">Business Intelligence</h3>

              <div className="space-y-5 sm:space-y-6">

                {/* TELEFONE */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="shrink-0 rounded-xl bg-primary/10 p-3 text-primary print:bg-slate-100"><Phone className="h-5 w-5" /></div>
                  <span className="break-words pt-1 text-sm font-bold print:text-slate-900">{lead.internationalPhoneNumber || 'Não informado'}</span>
                </div>

                {/* E-MAILS */}
                {emails.length > 0 && (
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="shrink-0 rounded-xl bg-primary/10 p-3 text-primary print:bg-slate-100"><Mail className="h-5 w-5" /></div>
                    <div className="w-full min-w-0 space-y-2">
                      {emails.map((email, idx) => (
                        <span key={idx} className="block break-all border-b border-slate-800 pb-2 font-mono text-xs font-bold text-blue-300 last:border-0 print:border-slate-200 print:text-slate-700">{email}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* NOVO: SITE OFICIAL (Se Existir) */}
                {lead.websiteUri && (
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="shrink-0 rounded-xl bg-primary/10 p-3 text-primary print:bg-slate-100"><Globe className="h-5 w-5" /></div>
                    <div className="w-full min-w-0 space-y-1 overflow-hidden">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Domínio Atual</span>
                      <a href={lead.websiteUri} target="_blank" rel="noreferrer" className="block truncate font-mono text-xs font-bold text-blue-400 transition-colors hover:text-blue-300 print:text-blue-600">
                        {lead.websiteUri}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* LISTAGEM DE REDES SOCIAIS E MARKETPLACES */}
              <div className="mt-8 flex flex-wrap justify-center gap-3 border-t border-slate-800 pt-6 print:border-slate-300 sm:mt-10 sm:gap-4">
                {socialLinks.length > 0 ? (
                  socialLinks.map((social, i) => (
                    <a key={i} href={social.url} target="_blank" rel="noreferrer" className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 p-3 transition-all hover:border-primary print:border-slate-300 print:bg-slate-50 sm:p-4">
                      {getSocialIcon(social.network)}
                      <span className="text-[8px] font-bold uppercase text-slate-500 transition-colors group-hover:text-white print:text-slate-800">{social.network}</span>
                    </a>
                  ))
                ) : (
                  <span className="text-[10px] italic text-slate-600 print:text-slate-500">Redes Sociais não mapeadas</span>
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