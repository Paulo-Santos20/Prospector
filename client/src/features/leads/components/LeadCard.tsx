import { Globe, MapPin, Smartphone, ShieldAlert, Star, Loader2 } from "lucide-react";
import { type Lead } from "../../search/services/searchService";
import { Badge } from "../../../components/ui/Badge";
import { useNavigate } from "react-router-dom";
import { saveLeadToCRM } from "../../crm/services/crmService";
import { useState } from "react";

export const LeadCard = ({ lead }: { lead: Lead }) => {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const { analysis } = lead;

  const handleSave = async (e: any) => {
    e.stopPropagation();
    try { await saveLeadToCRM(lead); setIsSaved(true); } catch (e) { console.error(e); }
  };

  // ESTADO DE CARREGAMENTO (Efeito Streaming)
  if (analysis.status === 'ANALYZING') {
    return (
      <div className="bg-surface border border-slate-700/50 rounded-2xl p-6 shadow-lg h-full flex flex-col relative animate-pulse">
        <div className="h-6 bg-slate-700 rounded-md w-3/4 mb-2"></div>
        <div className="h-3 bg-slate-800 rounded-md w-1/2 mb-6"></div>
        
        <div className="mb-4"><div className="h-5 bg-slate-800 rounded w-20"></div></div>
        
        <div className="bg-slate-800/30 p-4 rounded-xl flex-grow mb-4 flex flex-col items-center justify-center gap-3 border border-slate-700/50">
           <Loader2 className="w-6 h-6 text-primary animate-spin" />
           <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest text-center">IA Avaliando Presença Digital...</span>
        </div>
      </div>
    );
  }

  // ESTADO FINALIZADO (Lead Analisado)
  return (
    <div onClick={() => navigate(`/lead/${lead.id}`, { state: { lead } })} className="bg-surface border border-slate-700 rounded-2xl p-6 hover:border-primary cursor-pointer transition-all shadow-lg h-full flex flex-col relative group">
      <button onClick={handleSave} className={`absolute top-4 right-4 p-2 rounded-lg z-10 ${isSaved ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500'}`}>
        <Star className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
      </button>

      <h3 className="text-lg font-bold text-white mb-1 pr-8 truncate">{lead.displayName.text}</h3>
      <p className="text-xs text-slate-500 flex items-center mb-4 truncate"><MapPin className="w-3 h-3 mr-1 shrink-0" /> {lead.formattedAddress.split(',')[0]}</p>
      
      <div className="mb-4"><Badge variant={analysis.status === 'NO_WEBSITE' ? 'danger' : 'success'}>{analysis.status === 'NO_WEBSITE' ? 'Sem Site' : 'Site Ativo'}</Badge></div>

      <div className="bg-background/50 p-4 rounded-xl flex-grow mb-4 flex flex-col justify-center">
        {analysis.status === 'NO_WEBSITE' ? (
          <p className="text-xs text-red-400 font-bold flex items-center"><Globe className="w-3 h-3 mr-2" /> Oportunidade: Criar Presença Digital</p>
        ) : (
          <div className="flex gap-4 text-[10px] text-slate-400 font-bold uppercase">
            <span className={analysis?.isSecure ? 'text-emerald-500' : 'text-red-500'}><ShieldAlert className="w-3 h-3 inline mr-1" /> SSL</span>
            <span className={analysis?.isResponsive ? 'text-emerald-500' : 'text-red-500'}><Smartphone className="w-3 h-3 inline mr-1" /> Mobile</span>
          </div>
        )}
      </div>
      <p className="text-[11px] font-black text-primary text-center group-hover:translate-x-1 transition-transform uppercase tracking-widest">Acessar Inteligência &rarr;</p>
    </div>
  );
};