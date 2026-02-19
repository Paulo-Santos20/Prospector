import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Globe, MapPin, Phone, Star, ShieldAlert, 
  Smartphone, Mail, Share2, Facebook, Instagram, 
  ExternalLink, AlertCircle, TrendingUp, Sparkles, Palette, Type 
} from 'lucide-react';
import { type Lead } from '../features/search/services/searchService';
import { Badge } from '../components/ui/Badge';
import { ProposalModal } from '../features/leads/components/ProposalModal';
import { useState } from 'react';

export default function LeadDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const lead = location.state?.lead as Lead;
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!lead) return (
    <div className="min-h-screen bg-background flex items-center justify-center text-slate-400">
      <div className="text-center space-y-4">
        <p className="text-xl font-bold italic tracking-tighter">Sessão Expirada ou Lead Inválido.</p>
        <button onClick={() => navigate('/')} className="bg-primary text-white px-8 py-3 rounded-xl font-black">VOLTAR</button>
      </div>
    </div>
  );

  const { analysis } = lead;
  const ds = analysis?.aiData?.designStrategy;
  const pColor = ds?.primaryColor || '#3B82F6';
  const sColor = ds?.secondaryColor || '#6366F1';

  return (
    <div className="min-h-screen bg-background text-slate-200 pb-20 font-sans selection:bg-primary selection:text-white">
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
            {/* HERO CARD & DIAGNÓSTICO DE DOR */}
            <div className="bg-surface border border-slate-700/50 rounded-[3rem] p-10 shadow-3xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-[500px] h-[500px] opacity-10 blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: pColor }}></div>
               
               <h1 className="text-6xl font-black text-white mb-4 tracking-tighter leading-none italic uppercase relative z-10">
                 {lead.displayName.text}
               </h1>
               
               <div className="flex items-center text-slate-400 mb-10 text-sm font-medium opacity-70">
                 <MapPin className="w-4 h-4 mr-2" style={{ color: pColor }} /> {lead.formattedAddress}
               </div>

               <div className="p-8 bg-red-500/5 border-l-8 border-red-500 rounded-r-[2rem] relative z-10 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-500/20 rounded-lg"><AlertCircle className="w-5 h-5 text-red-500" /></div>
                    <span className="text-[12px] font-black text-red-500 uppercase tracking-[0.3em]">Diagnóstico de Perda de Lucro</span>
                  </div>
                  <p className="text-xl text-slate-100 font-medium italic leading-relaxed">
                    {analysis?.aiData?.mainPainPoint ? `"${analysis.aiData.mainPainPoint}"` : "Analisando falhas de conversão no site atual..."}
                  </p>
               </div>
            </div>

            {/* BRANDING & DESIGN STRATEGY */}
            <section className="bg-surface/40 border border-slate-800 rounded-[3rem] p-10 shadow-xl">
              <div className="flex items-center gap-4 mb-12 border-b border-slate-800 pb-8">
                <div className="p-4 bg-primary/10 rounded-2xl" style={{ backgroundColor: `${pColor}15` }}>
                  <Palette className="w-8 h-8" style={{ color: pColor }} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Identidade Sugerida</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">Manual Visual Consultivo</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-10">
                  {/* PALETA DE CORES */}
                  <div className="flex items-end gap-6">
                    <div className="space-y-3">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Base</p>
                       <div className="w-24 h-24 rounded-[2.5rem] shadow-2xl border-4 border-white/10" style={{ backgroundColor: pColor }}></div>
                       <p className="text-xs font-mono font-black text-white text-center uppercase">{pColor}</p>
                    </div>
                    <div className="space-y-3">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Destaque</p>
                       <div className="w-16 h-16 rounded-[1.8rem] shadow-xl border-2 border-white/10" style={{ backgroundColor: sColor }}></div>
                       <p className="text-[10px] font-mono font-bold text-slate-400 text-center uppercase tracking-tighter">{sColor}</p>
                    </div>
                  </div>

                  {/* TIPOGRAFIA */}
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
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Conceito do Design:</p>
                      <p className="text-sm text-slate-300 italic font-medium leading-relaxed">
                        "{ds?.designReasoning || 'Cores e formas selecionadas para elevar a percepção de valor da marca.'}"
                      </p>
                      <div className="mt-6 pt-6 border-t border-slate-800">
                        <DetailRow label="Estilo de Design" value={ds?.style || 'Moderno/Imersivo'} />
                        {ds?.referenceSite && (
                          <a href={ds.referenceSite} target="_blank" className="mt-4 flex items-center justify-center gap-2 w-full p-4 bg-white/5 rounded-xl text-[10px] font-black uppercase border border-white/5 hover:bg-white/10 transition-all">
                             <ExternalLink className="w-3 h-3" /> Ver Referência de Estilo
                          </a>
                        )}
                      </div>
                   </div>
                </div>
              </div>
            </section>
          </div>

          {/* SIDEBAR DE CONTATO E AÇÃO */}
          <div className="space-y-8">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full text-white font-black py-8 rounded-[2.5rem] shadow-2xl transition-all flex flex-col items-center justify-center gap-2 active:scale-95 group"
              style={{ backgroundColor: pColor }}
            >
              <span className="text-2xl uppercase italic tracking-tighter flex items-center gap-3">
                Enviar Proposta <ExternalLink className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              </span>
              <span className="text-[10px] opacity-70 font-bold uppercase tracking-[0.3em]">Baseada no Novo Branding</span>
            </button>

            <div className="bg-surface border border-slate-700 rounded-[2.5rem] p-8 shadow-xl">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-10 border-b border-slate-800 pb-4">Business Intelligence</h3>
              <ul className="space-y-10">
                <ContactRow icon={<Phone />} label="Fone / WhatsApp" value={lead.internationalPhoneNumber || 'Privado'} />
                <ContactRow 
                  icon={<Mail />} 
                  label="E-mails Minerados" 
                  value={analysis?.emails || []} 
                  isList 
                />
              </ul>
            </div>

            {analysis?.socialLinks && analysis.socialLinks.length > 0 && (
               <div className="flex justify-center gap-4 p-4 bg-slate-900/40 rounded-[2rem] border border-slate-800">
                  {analysis.socialLinks.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" className="p-4 bg-surface border border-slate-700 rounded-2xl hover:border-primary transition-all">
                      {getSocialIcon(s.network)}
                    </a>
                  ))}
               </div>
            )}
          </div>
        </div>
      </main>

      <ProposalModal lead={lead} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

// COMPONENTES AUXILIARES
function DetailRow({ label, value }: any) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
      <span className="text-xs text-white font-black uppercase tracking-tighter">{value}</span>
    </div>
  );
}

function ContactRow({ icon, label, value, isList }: any) {
  return (
    <li className="flex gap-5">
      <div className="p-4 bg-primary/10 rounded-2xl text-primary h-fit">{icon}</div>
      <div className="overflow-hidden">
        <span className="block text-[10px] text-slate-500 font-black uppercase mb-2 tracking-widest">{label}</span>
        {isList && Array.isArray(value) ? (
          <div className="space-y-3">
            {value.length > 0 ? value.map((e: string) => (
              <span key={e} className="block text-xs font-mono text-blue-300 truncate select-all font-bold border-b border-slate-800 pb-1">{e}</span>
            )) : <span className="text-xs italic text-slate-600">Não localizado</span>}
          </div>
        ) : <span className="text-sm font-black text-white break-words uppercase tracking-tight">{value}</span>}
      </div>
    </li>
  );
}

function getSocialIcon(network: string) {
  switch (network.toLowerCase()) {
    case 'facebook': return <Facebook className="w-5 h-5 text-blue-500" />;
    case 'instagram': return <Instagram className="w-5 h-5 text-pink-500" />;
    default: return <Share2 className="w-5 h-5 text-slate-400" />;
  }
}