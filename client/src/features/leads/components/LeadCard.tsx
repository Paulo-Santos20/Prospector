import { Globe, MapPin, Smartphone, ShieldAlert, Star, Loader2 } from "lucide-react";
import { type Lead } from "../../search/services/searchService";
import { Badge } from "../../../components/ui/Badge";
import { useNavigate } from "react-router-dom";
import { saveLeadToCRM } from "../../crm/services/crmService";
import { useState, type KeyboardEvent } from "react";

export const LeadCard = ({ lead }: { lead: Lead }) => {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const { analysis } = lead;

  const openLead = () => navigate(`/lead/${lead.id}`, { state: { lead } });

  const handleSave = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    try {
      await saveLeadToCRM(lead);
      setIsSaved(true);
    } catch (error) {
      console.error(error);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLead();
    }
  };

  // ESTADO DE CARREGAMENTO (Efeito Streaming)
  if (analysis.status === 'ANALYZING') {
    return (
      <div className="relative flex h-full animate-pulse flex-col rounded-2xl border border-slate-700/50 bg-surface p-5 shadow-lg sm:p-6">
        <h3 className="mb-1 truncate pr-8 text-lg font-bold text-white/60">{lead.displayName.text}</h3>
        <p className="text-xs text-slate-500 flex items-center mb-4 truncate">
          <MapPin className="w-3 h-3 mr-1 shrink-0" /> {lead.formattedAddress.split(',')[0]}
        </p>

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
    <div
      role="link"
      tabIndex={0}
      aria-label={`Abrir detalhes de ${lead.displayName.text}`}
      onClick={openLead}
      onKeyDown={handleKeyDown}
      className="group relative flex h-full cursor-pointer flex-col rounded-2xl border border-slate-700 bg-surface p-5 shadow-lg transition-all hover:border-primary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary sm:p-6"
    >
      <button
        type="button"
        onClick={handleSave}
        aria-label={isSaved ? 'Lead salvo no CRM' : 'Salvar lead no CRM'}
        className={`absolute right-3 top-3 z-10 rounded-lg p-2.5 ${isSaved ? 'bg-amber-500/10 text-amber-400' : 'text-slate-500 hover:text-amber-400'}`}
      >
        <Star className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
      </button>

      <h3 className="mb-1 truncate pr-10 text-lg font-bold text-white">{lead.displayName.text}</h3>
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