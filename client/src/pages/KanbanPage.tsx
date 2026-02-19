import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCRMLeads, updateLeadStatus } from '../features/crm/services/crmService';
import { Star, Send, Handshake, Trophy, MapPin } from 'lucide-react';

const COLUMNS = [
  { id: 'SAVED', title: 'Leads Salvos', icon: <Star className="w-4 h-4 text-amber-400" />, border: 'border-amber-500/30' },
  { id: 'PROPOSAL', title: 'Proposta Enviada', icon: <Send className="w-4 h-4 text-blue-400" />, border: 'border-blue-500/30' },
  { id: 'NEGOTIATION', title: 'Em Negociação', icon: <Handshake className="w-4 h-4 text-purple-400" />, border: 'border-purple-500/30' },
  { id: 'CLOSED', title: 'Fechado (Ganho)', icon: <Trophy className="w-4 h-4 text-emerald-400" />, border: 'border-emerald-500/30' },
];

export default function KanbanPage() {
  const queryClient = useQueryClient();

  const { data: leads = [] } = useQuery({
    queryKey: ['crm-leads'],
    queryFn: getCRMLeads,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => updateLeadStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-leads'] }),
  });

  // Funções Nativas de Drag and Drop HTML5
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('leadId', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessário para permitir o Drop
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) {
      updateStatusMutation.mutate({ id: leadId, status: newStatus });
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-black italic uppercase mb-2 tracking-tighter">Meu Funil de Vendas</h1>
        <p className="text-sm text-slate-400 mb-8 font-medium">Arraste os cards para a direita para avançar a negociação.</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {COLUMNS.map(col => (
            <div 
              key={col.id} 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`bg-surface/50 border ${col.border} rounded-3xl p-4 flex flex-col h-[70vh] shadow-xl`}
            >
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-700/50">
                {col.icon}
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-300">{col.title}</h2>
                <span className="ml-auto text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-lg">
                  {leads.filter((l: any) => l.crmStatus === col.id).length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide pr-1">
                {leads.filter((l: any) => l.crmStatus === col.id).map((lead: any) => (
                  <div 
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    className="bg-slate-800 border border-slate-700 p-4 rounded-2xl cursor-grab active:cursor-grabbing hover:border-primary transition-all shadow-lg group"
                  >
                    <h3 className="text-sm font-bold text-white mb-1">{lead.displayName.text}</h3>
                    <div className="flex items-center text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-3">
                      <MapPin className="w-3 h-3 mr-1" /> {lead.formattedAddress.split(',')[0]}
                    </div>
                    {lead.notes && (
                       <p className="text-xs text-slate-300 italic border-l-2 border-primary pl-2 mb-2 line-clamp-2">
                         "{lead.notes}"
                       </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}