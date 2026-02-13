import { Globe, MapPin, Phone, ShieldAlert, Smartphone, Calendar, Mail } from "lucide-react";
import { Lead } from "../../search/services/searchService";
import { Badge } from "../../../components/ui/Badge";

interface LeadCardProps {
  lead: Lead;
}

export const LeadCard = ({ lead }: LeadCardProps) => {
  const { analysis } = lead;
  
  // Lógica para decidir a cor do card
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

  return (
    <div className="bg-surface border border-slate-700 rounded-lg p-5 hover:border-primary transition-colors group shadow-lg">
      {/* Cabeçalho */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
            {lead.displayName.text}
          </h3>
          <div className="flex items-center text-slate-400 text-sm mt-1">
            <MapPin className="w-3 h-3 mr-1" />
            <span className="truncate max-w-[200px]">{lead.formattedAddress}</span>
          </div>
        </div>
        <Badge variant={getStatusColor()}>{getStatusLabel()}</Badge>
      </div>

      {/* Métricas de Oportunidade */}
      <div className="space-y-2 mb-4 bg-background/50 p-3 rounded-md">
        {analysis.status === 'NO_WEBSITE' ? (
           <p className="text-sm text-red-400 flex items-center font-medium">
             <Globe className="w-4 h-4 mr-2" /> Oportunidade: Sem Presença Web
           </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
             <div className={`flex items-center ${!analysis.isSecure ? 'text-red-400 font-bold' : 'text-emerald-400'}`}>
                <ShieldAlert className="w-3 h-3 mr-1" /> 
                {analysis.isSecure ? 'HTTPS Seguro' : 'Não Seguro'}
             </div>
             <div className={`flex items-center ${!analysis.isResponsive ? 'text-red-400 font-bold' : 'text-emerald-400'}`}>
                <Smartphone className="w-3 h-3 mr-1" />
                {analysis.isResponsive ? 'Mobile' : 'Não Responsivo'}
             </div>
             {analysis.copyrightYear && (
               <div className={`flex items-center ${analysis.copyrightYear < 2023 ? 'text-amber-400' : 'text-slate-400'}`}>
                 <Calendar className="w-3 h-3 mr-1" />
                 Copyright: {analysis.copyrightYear}
               </div>
             )}
          </div>
        )}
      </div>

      {/* Contatos Encontrados (Scraping) */}
      <div className="border-t border-slate-700 pt-3 mt-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wider">Dados Encontrados</p>
        <div className="space-y-1">
           {lead.internationalPhoneNumber && (
             <div className="flex items-center text-sm text-slate-300">
               <Phone className="w-3 h-3 mr-2 text-primary" /> {lead.internationalPhoneNumber}
             </div>
           )}
           {analysis.emails && analysis.emails.length > 0 && (
             <div className="flex items-center text-sm text-slate-300">
               <Mail className="w-3 h-3 mr-2 text-primary" /> {analysis.emails[0]}
             </div>
           )}
           {(!lead.internationalPhoneNumber && (!analysis.emails || analysis.emails.length === 0)) && (
             <span className="text-xs text-slate-600 italic">Nenhum contato direto encontrado</span>
           )}
        </div>
        
        {/* Links Sociais e Site */}
        <div className="flex gap-2 mt-4">
            {lead.websiteUri && (
              <a href={lead.websiteUri} target="_blank" rel="noreferrer" 
                 className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded text-white transition flex items-center">
                 <Globe className="w-3 h-3 mr-1" /> Visitar Site
              </a>
            )}
        </div>
      </div>
    </div>
  );
};