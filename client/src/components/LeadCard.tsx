import { Globe, MapPin, ShieldAlert, Smartphone, ExternalLink, Star } from "lucide-react";
import { type Lead } from "../features/search/services/searchService";
import { Badge } from "./ui/Badge";
import { useNavigate } from "react-router-dom";
import { saveLeadToCRM } from "../features/crm/services/crmService";
import { useState } from "react";

interface LeadCardProps {
  lead: Lead;
}

export const LeadCard = ({ lead }: LeadCardProps) => {
  const navigate = useNavigate();
  const { analysis } = lead;
  const [isSaved, setIsSaved] = useState(false);
  
  const getStatusColor = () => {
    if (analysis.status === 'NO_WEBSITE') return 'danger';
    if (analysis.status === 'HIGH_OPPORTUNITY' || analysis.status === 'MODERATE') return 'warning';
    return 'success';
  };

  const handleCardClick = () => {
    navigate(`/lead/${lead.id}`, { state: { lead } });
  };

  // Função para Favoritar (Evita que o card seja clicado junto)
  const handleSaveToCRM = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    try {
      await saveLeadToCRM(lead);
      setIsSaved(true);
    } catch (error) {
      console.error("Erro ao salvar lead", error);
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-surface border border-slate-700 rounded-lg p-5 hover:border-primary cursor-pointer transition-all hover:scale-[1.02] group shadow-lg h-full flex flex-col relative"
    >
      <div className="absolute top-4 right-4 flex gap-2">
        <button 
          onClick={handleSaveToCRM}
          className={`p-2 rounded-lg transition-all ${isSaved ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400 hover:text-amber-400 hover:bg-slate-700'}`}
          title="Salvar no Kanban"
        >
          <Star className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>
        <div className="p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary/20 text-primary rounded-lg">
          <ExternalLink className="w-4 h-4" />
        </div>
      </div>

      <div className="flex justify-between items-start mb-4 pr-16">
        <div>
          <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors line-clamp-1">
            {lead.displayName.text}
          </h3>
          <div className="flex items-center text-slate-400 text-sm mt-1">
            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate max-w-[180px]">{lead.formattedAddress}</span>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <Badge variant={getStatusColor()}>{analysis.status === 'NO_WEBSITE' ? 'Sem Site' : 'Site Analisado'}</Badge>
      </div>

      <div className="space-y-2 mb-4 bg-background/50 p-3 rounded-md flex-grow">
        {analysis.status === 'NO_WEBSITE' ? (
           <p className="text-sm text-red-400 flex items-center font-medium">
             <Globe className="w-4 h-4 mr-2" /> Sem Presença Web
           </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
             <div className={`flex items-center ${!analysis.isSecure ? 'text-red-400 font-bold' : 'text-emerald-400'}`}>
                <ShieldAlert className="w-3 h-3 mr-1" /> HTTPS
             </div>
             <div className={`flex items-center ${!analysis.isResponsive ? 'text-red-400 font-bold' : 'text-emerald-400'}`}>
                <Smartphone className="w-3 h-3 mr-1" /> Mobile
             </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-700 pt-3 mt-auto text-center">
        <span className="text-xs font-semibold text-primary">Ver Consultoria e Contatos &rarr;</span>
      </div>
    </div>
  );
};