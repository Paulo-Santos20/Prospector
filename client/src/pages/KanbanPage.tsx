import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCRMLeads,
  updateLeadStatus,
  type CRMLead,
  type CRMStatus,
} from '../features/crm/services/crmService';
import { Star, Send, Handshake, Trophy, MapPin, MessageSquare, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppHeader } from '../app/AppHeader';

const COLUMNS: Array<{ id: CRMStatus; title: string; icon: React.ReactNode; border: string }> = [
  { id: 'SAVED', title: 'Leads Salvos', icon: <Star className="w-4 h-4 text-amber-400" />, border: 'border-amber-500/30' },
  { id: 'CONTACTED', title: 'Contatado', icon: <MessageSquare className="w-4 h-4 text-cyan-400" />, border: 'border-cyan-500/30' },
  { id: 'PROPOSAL', title: 'Proposta Enviada', icon: <Send className="w-4 h-4 text-blue-400" />, border: 'border-blue-500/30' },
  { id: 'NEGOTIATION', title: 'Em Negociação', icon: <Handshake className="w-4 h-4 text-purple-400" />, border: 'border-purple-500/30' },
  { id: 'WON', title: 'Fechado (Ganho)', icon: <Trophy className="w-4 h-4 text-emerald-400" />, border: 'border-emerald-500/30' },
  { id: 'LOST', title: 'Perdido', icon: <XCircle className="w-4 h-4 text-red-400" />, border: 'border-red-500/30' },
];

export default function KanbanPage() {
  const queryClient = useQueryClient();

  const { data: leads = [] } = useQuery({
    queryKey: ['crm-leads'],
    queryFn: getCRMLeads,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CRMStatus }) => updateLeadStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      queryClient.invalidateQueries({ queryKey: ['global-stats'] });
    },
  });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('leadId', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: CRMStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) {
      updateStatusMutation.mutate({ id: leadId, status: newStatus });
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-slate-100 selection:bg-primary selection:text-white">
      <AppHeader />

      <main className="px-3 py-5 sm:px-4 sm:py-8 md:px-8">
        <div className="mx-auto max-w-[1600px]">
          <h1 className="mb-2 text-2xl font-black italic uppercase tracking-tighter sm:text-3xl">Meu Funil de Vendas</h1>
          <p className="mb-6 text-sm font-medium text-slate-400 sm:mb-8">
            Arraste os cards ou use o seletor para avançar a negociação.
          </p>

          <div className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-4 scrollbar-hide sm:gap-4 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 xl:grid-cols-6">
            {COLUMNS.map(col => {
              const columnLeads = leads.filter((lead) => lead.status === col.id);

              return (
                <div
                  key={col.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className={`flex h-[65vh] min-w-[82vw] snap-start flex-col rounded-3xl border bg-surface/50 p-4 shadow-xl sm:min-w-[320px] md:h-[70vh] md:min-w-0 ${col.border}`}
                >
                  <div className="mb-4 flex items-center gap-2 border-b border-slate-700/50 pb-4">
                    {col.icon}
                    <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-300">{col.title}</h2>
                    <span className="ml-auto rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-400">
                      {columnLeads.length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-thin">
                    {columnLeads.map((lead: CRMLead) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        className="group cursor-grab rounded-2xl border border-slate-700 bg-slate-800 p-4 shadow-lg transition-all hover:border-primary active:cursor-grabbing"
                      >
                        <Link
                          to={`/lead/${lead.leadId}`}
                          className="block rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
                        >
                          <h3 className="mb-1 text-sm font-bold text-white">
                            {lead.snapshot?.displayName?.text || 'Sem nome'}
                          </h3>
                          <div className="mb-3 flex items-center text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                            <MapPin className="mr-1 h-3 w-3 shrink-0" /> {lead.snapshot?.formattedAddress?.split(',')[0] || ''}
                          </div>
                        </Link>
                        {lead.notes && (
                          <p className="mb-2 line-clamp-2 border-l-2 border-primary pl-2 text-xs italic text-slate-300">
                            "{lead.notes}"
                          </p>
                        )}
                        <select
                          value={lead.status}
                          onChange={(e) => updateStatusMutation.mutate({ id: lead.id, status: e.target.value as CRMStatus })}
                          aria-label={`Mover ${lead.snapshot?.displayName?.text || 'lead'} para outra etapa`}
                          className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-900 px-2 py-2 text-[11px] font-bold text-slate-300 outline-none focus:ring-2 focus:ring-primary lg:hidden"
                        >
                          {COLUMNS.map((option) => (
                            <option key={option.id} value={option.id}>{option.title}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                    {columnLeads.length === 0 && (
                      <p className="rounded-xl border border-dashed border-slate-700 p-4 text-center text-[11px] text-slate-500">
                        Nenhum lead
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
