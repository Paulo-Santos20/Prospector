import { Globe, MapPin, Phone, ShieldAlert, Smartphone, Calendar, Mail, ExternalLink } from "lucide-react";
import { type Lead } from "../../search/services/searchService";
import { Badge } from "../../../components/ui/Badge";
import { useNavigate } from "react-router-dom"; // Importar hook de navegação

interface LeadCardProps {
  lead: Lead;
}

export const LeadCard = ({ lead }: LeadCardProps) => {
  const navigate = useNavigate(); // Hook para navegar
  const { analysis } = lead;
  
  const getStatusColor = () => {
    if (analysis.status === 'NO_WEBSITE') return 'danger';
    if (analysis.status === 'HIGH_OPPORTUNITY' || analysis.status === 'MODERATE') return 'warning';
    return 'success';
  };

  const getStatusLabel = () => {
    if (analysis.status === 'NO_WEBSITE') return 'Sem Site';
    if (analysis.status === 'HIGH_OPPORTUNITY') return 'Site Crítico';
    if (analysis.status === 'MODERATE') return 'Site Antigo';
    return 'Site Moderno';
  };

  // Função que executa a navegação levando os dados junto (state)
  const handleCardClick = () => {
    navigate(`/lead/${lead.id}`, { state: { lead } });
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-surface border border-slate-700 rounded-lg p-5 hover:border-primary cursor-pointer transition-all hover:scale-[1.02] group shadow-lg h-full flex flex-col relative"
    >
      {/* Indicador visual de clique */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ExternalLink className="w-4 h-4 text-primary" />
      </div>

      {/* Cabeçalho */}
      <div className="flex justify-between items-start mb-4 pr-6">
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
        <Badge variant={getStatusColor()}>{getStatusLabel()}</Badge>
      </div>

      {/* Métricas Resumidas */}
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
        <span className="text-xs font-semibold text-primary">Ver Análise Completa &rarr;</span>
      </div>
    </div>
  );
};