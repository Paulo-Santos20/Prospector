import { Globe, MapPin, ShieldAlert, Smartphone, ExternalLink, Star } from "lucide-react";
import { type Lead } from "../features/search/services/searchService";
import { Badge } from "./ui/Badge";
import { useNavigate } from "react-router-dom";
import { saveLeadToCRM } from "../features/crm/services/crmService";
import { useState } from "react";

interface LeadCardProps { lead: Lead; }

export const LeadCard = ({ lead }: LeadCardProps) => {
  const navigate = useNavigate();
  const { analysis } = lead;
  const [isSaved, setIsSaved] = useState(false);
  
  const getStatusColor = () => analysis.status === 'NO_WEBSITE' ? 'danger' : 'success';

  return (
    <div onClick={() => navigate(`/lead/${lead.id}`, { state: { lead } })} className="bg-surface border border-slate-700 rounded-lg p-5 hover:border-primary cursor-pointer transition-all hover:scale-[1.02] group shadow-lg h-full flex flex-col relative">
      <div className="absolute top-4 right-4 flex gap-2">
        <button onClick={async (e) => { e.stopPropagation(); await saveLeadToCRM(lead); setIsSaved(true); }} className={`p-2 rounded-lg ${isSaved ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400'}`}><Star className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} /></button>
        <div className="p-2 bg-primary/20 text-primary rounded-lg opacity-0 group-hover:opacity-100"><ExternalLink className="w-4 h-4" /></div>
      </div>

      <h3 className="text-lg font-semibold text-white mb-1">{lead.displayName.text}</h3>
      <div className="flex items-center text-slate-400 text-sm mb-4"><MapPin className="w-3 h-3 mr-1" /> <span className="truncate">{lead.formattedAddress}</span></div>
      
      <div className="mb-4"><Badge variant={getStatusColor()}>{analysis.status === 'NO_WEBSITE' ? 'SEM SITE (Oportunidade)' : 'Site Ativo'}</Badge></div>

      <div className="space-y-2 mb-4 bg-background/50 p-3 rounded-md flex-grow">
        {analysis.status === 'NO_WEBSITE' ? (
           <p className="text-xs text-red-400 flex items-center italic"><Globe className="w-3 h-3 mr-2" /> Venda pendente: Empresa sem domínio</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300">
             <div className={`flex items-center ${!analysis.isSecure ? 'text-red-400' : 'text-emerald-400'}`}><ShieldAlert className="w-3 h-3 mr-1" /> {analysis.isSecure ? 'SSL' : 'Inseguro'}</div>
             <div className={`flex items-center ${!analysis.isResponsive ? 'text-red-400' : 'text-emerald-400'}`}><Smartphone className="w-3 h-3 mr-1" /> {analysis.isResponsive ? 'Mobile' : 'Desktop Only'}</div>
          </div>
        )}
      </div>
      <div className="border-t border-slate-700 pt-3 mt-auto text-center"><span className="text-xs font-semibold text-primary">Análise & Branding &rarr;</span></div>
    </div>
  );
};