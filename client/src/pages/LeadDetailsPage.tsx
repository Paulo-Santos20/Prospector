import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, Facebook, Instagram, AlertCircle, Sparkles,Star } from 'lucide-react';
import { type Lead } from '../features/search/services/searchService';
import { ProposalModal } from '../features/leads/components/ProposalModal';
import { saveLeadToCRM } from '../features/crm/services/crmService';
import { useState } from 'react';

export default function LeadDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const lead = location.state?.lead as Lead;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  if (!lead) return <div className="min-h-screen bg-background flex items-center justify-center text-slate-400 font-black">Sessão Expirada.</div>;

  const { analysis } = lead;
  const ds = (analysis as any)?.aiData?.designStrategy;
  const pColor = ds?.primaryColor || '#3B82F6';
  const sColor = ds?.secondaryColor || '#6366F1';

  return (
    <div className="min-h-screen bg-background text-slate-200 pb-20">
      <header className="border-b border-slate-800 bg-surface/80 backdrop-blur-md sticky top-0 z-50 px-4 h-20 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center text-slate-400 hover:text-white transition-all font-black uppercase text-[10px] tracking-[0.3em]">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-black tracking-[0.4em] text-slate-500 uppercase italic">Intelligence Report</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-surface border border-slate-700/50 rounded-[3rem] p-10 shadow-3xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-[500px] h-[500px] opacity-10 blur-[120px]" style={{ backgroundColor: pColor }}></div>
             <h1 className="text-6xl font-black text-white mb-4 tracking-tighter italic uppercase relative z-10">{lead.displayName.text}</h1>
             
             {/* DIAGNÓSTICO ESTRATÉGICO */}
             <div className="p-8 bg-red-500/5 border-l-8 border-red-500 rounded-r-[2rem] relative z-10 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-[12px] font-black text-red-500 uppercase tracking-[0.3em]">Perda de Faturamento Estimada</span>
                </div>
                <p className="text-xl text-slate-100 font-medium italic">
                  {analysis.status === 'NO_WEBSITE' 
                    ? "Empresa depende apenas de redes sociais. Risco alto de bloqueio de conta e falta de automação de vendas." 
                    : (analysis as any).aiData?.mainPainPoint}
                </p>
             </div>
          </div>

          <section className="bg-surface/40 border border-slate-800 rounded-[3rem] p-10">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-8">Manual Visual Sugerido</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="flex gap-6">
                  <div>
                    <div className="w-20 h-20 rounded-3xl border-4 border-white/10" style={{ backgroundColor: pColor }}></div>
                    <p className="text-xs font-mono mt-2 text-center">{pColor}</p>
                  </div>
                  <div>
                    <div className="w-14 h-14 rounded-2xl border-2 border-white/10" style={{ backgroundColor: sColor }}></div>
                    <p className="text-[10px] font-mono mt-2 text-center text-slate-500">{sColor}</p>
                  </div>
               </div>
               <div className="p-6 bg-background/40 rounded-[2rem] border border-slate-800">
                  <p className="text-sm text-slate-300 italic">"{ds?.designReasoning || 'Identidade construída para transmitir autoridade no nicho.'}"</p>
               </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <button 
            onClick={async () => { await saveLeadToCRM(lead); setIsSaved(true); }}
            disabled={isSaved}
            className={`w-full font-black py-4 rounded-2xl transition-all border flex items-center justify-center gap-2 ${isSaved ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-surface hover:text-amber-400 border-slate-700'}`}
          >
            <Star className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} /> {isSaved ? 'No CRM' : 'Favoritar (CRM)'}
          </button>

          <button onClick={() => setIsModalOpen(true)} className="w-full text-white font-black py-8 rounded-[2.5rem] shadow-2xl uppercase italic tracking-tighter text-xl" style={{ backgroundColor: pColor }}>
            Enviar Proposta
          </button>

          <div className="bg-surface border border-slate-700 rounded-[2.5rem] p-8">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-800 pb-2">Contatos Minerados</h3>
            <div className="space-y-4">
              <div className="flex gap-4"><Phone className="text-primary" /> <span className="text-sm font-bold">{lead.internationalPhoneNumber || 'Privado'}</span></div>
              {(analysis as any).emails?.map((e: string) => <div key={e} className="flex gap-4"><Mail className="text-primary" /> <span className="text-xs font-mono">{e}</span></div>)}
            </div>
            
            {/* LINKS SOCIAIS (INSTAGRAM ACHADO PELO SCRAPER) */}
            <div className="flex justify-center gap-4 mt-8 pt-6 border-t border-slate-800">
              {analysis.socialLinks?.map((s, i) => (
                <a key={i} href={s.url} target="_blank" className="p-4 bg-slate-800 rounded-2xl border border-slate-700 hover:border-primary transition-all">
                  {s.network === 'facebook' ? <Facebook className="text-blue-500" /> : <Instagram className="text-pink-500" />}
                </a>
              ))}
            </div>
          </div>
        </div>
      </main>
      <ProposalModal lead={lead} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}