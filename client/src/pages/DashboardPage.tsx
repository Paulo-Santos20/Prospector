import { useState, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { 
  Loader2, Sparkles, AlertCircle, 
  Globe, ShieldAlert, Users, Send, Target
} from 'lucide-react';

import {
  getProviderStatus,
  providerAttribution,
  DEFAULT_PROVIDER,
} from '../features/search/services/searchService';
import { useLeadSearch } from '../features/search/hooks/useLeadSearch';
import { LeadCard } from '../features/leads/components/LeadCard';
import { AppHeader } from '../app/AppHeader';
import { api } from '../lib/axios';

interface GlobalStats {
  totalLeads: number;
  totalProposals: number;
  rate: number;
}

type Filter = 'all' | 'no_website' | 'insecure' | 'not_responsive';

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState<Filter>('all');

  const nicheParam = searchParams.get('niche') || '';
  const locationParam = searchParams.get('location') || '';

  const [nicheInput, setNicheInput] = useState(nicheParam);
  const [locationInput, setLocationInput] = useState(locationParam);
  const [provider, setProvider] = useState(DEFAULT_PROVIDER);

  const { data: stats } = useQuery({
    queryKey: ['global-stats'],
    queryFn: async () => {
      const res = await api.get<GlobalStats>('/stats');
      return res.data;
    },
    refetchInterval: 30000,
    retry: false,
  });

  const { data: providerStatus } = useQuery({
    queryKey: ['provider-status'],
    queryFn: getProviderStatus,
    refetchInterval: 30000,
  });

  const { data, isFetching, isError, error, refetch } = useLeadSearch(
    nicheParam,
    locationParam,
    provider
  );

  const filteredLeads = useMemo(() => {
    if (!data?.leads) return [];
    return data.leads.filter(l => {
      if (!l.analysis) return activeFilter === 'all';
      switch (activeFilter) {
        case 'no_website': return l.analysis.status === 'NO_WEBSITE' || !l.websiteUri;
        case 'insecure': return l.analysis.status !== 'NO_WEBSITE' && !!l.websiteUri && l.analysis.isSecure === false;
        case 'not_responsive': return l.analysis.status !== 'NO_WEBSITE' && !!l.websiteUri && l.analysis.isResponsive === false;
        default: return true;
      }
    });
  }, [data, activeFilter]);

  const totalLeads = data?.leads.length ?? 0;
  const analyzingLeads =
    data?.leads.filter((lead) => lead.analysis?.status === 'ANALYZING').length ?? 0;
  const analyzedLeads = totalLeads - analyzingLeads;
  const progress = totalLeads ? Math.round((analyzedLeads / totalLeads) * 100) : 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicheInput || !locationInput) return;
    setSearchParams({ niche: nicheInput, location: locationInput });
    setActiveFilter('all'); 
  };

  return (
    <div className="min-h-screen bg-background pb-20 text-slate-100">
      <AppHeader />

      <main className="mx-auto mt-5 max-w-7xl px-3 sm:mt-8 sm:px-4">
        <div className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 sm:grid-cols-3 sm:gap-6">
          <StatCard icon={<Users />} label="Leads no CRM" value={stats?.totalLeads || 0} color="text-blue-400" />
          <StatCard icon={<Send />} label="Propostas Enviadas" value={stats?.totalProposals || 0} color="text-emerald-400" />
          <StatCard icon={<Target />} label="Taxa de Fechamento" value={`${stats?.rate || 0}%`} color="text-amber-400" />
        </div>

        <div className="relative mb-6 overflow-hidden rounded-3xl border border-slate-700 bg-surface p-4 shadow-2xl sm:mb-10 sm:rounded-[2.5rem] sm:p-6 lg:p-8">
           <h1 className="mb-4 flex items-center gap-2 text-xl font-black italic uppercase sm:mb-6 sm:text-2xl">
             <Sparkles className="h-4 w-4 shrink-0 text-amber-400 sm:h-5 sm:w-5" /> Inteligência de Mineração
           </h1>
           <form onSubmit={handleSearch} className="relative z-10 flex flex-col items-stretch gap-3 md:flex-row md:items-center md:gap-4">
               <div className="flex w-full items-center gap-2 md:w-auto">
                 <select 
                   value={provider} 
                   onChange={(e) => setProvider(e.target.value)}
                   aria-label="Provedor de busca"
                   className="w-full rounded-2xl border border-slate-600 bg-background px-4 py-3.5 text-base outline-none transition focus:ring-2 focus:ring-primary sm:px-6 sm:py-4 md:w-auto md:text-sm"
                 >
                   <option
                     value="geoapify"
                     disabled={providerStatus?.providers?.geoapify?.configured === false}
                   >
                     Geoapify (Grátis)
                   </option>
                   <option
                     value="tomtom"
                     disabled={providerStatus?.providers?.tomtom?.configured === false}
                   >
                     TomTom (Grátis)
                   </option>
                   <option value="overpass">Overpass (Fallback)</option>
                   <option
                     value="foursquare"
                     disabled={providerStatus?.providers?.foursquare?.configured === false}
                   >
                     Foursquare
                   </option>
                   <option value="google" disabled>Google Places (Billing)</option>
                 </select>
                 <span
                   title="Status do provedor"
                   className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                     providerStatus?.providers?.[provider]?.configured !== false &&
                     providerStatus?.providers?.[provider]?.available !== false
                       ? 'bg-emerald-400'
                       : 'bg-red-400'
                   }`}
                 />
               </div>
               <input 
                type="text"
                aria-label="Nicho"
                placeholder="Nicho (ex: Clínicas de Estética)"
                value={nicheInput}
                onChange={(e) => setNicheInput(e.target.value)}
                className="w-full min-w-0 flex-1 rounded-2xl border border-slate-600 bg-background px-4 py-3.5 text-base outline-none transition focus:ring-2 focus:ring-primary sm:px-6 sm:py-4"
              />
              <input 
                type="text"
                aria-label="Localização"
                placeholder="Localização (ex: Recife)"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                className="w-full min-w-0 flex-1 rounded-2xl border border-slate-600 bg-background px-4 py-3.5 text-base outline-none transition focus:ring-2 focus:ring-primary sm:px-6 sm:py-4"
              />
              <button
                disabled={isFetching}
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 font-black italic uppercase tracking-tighter text-white transition hover:bg-blue-600 disabled:opacity-50 sm:py-4 md:w-auto md:px-10"
              >
                {isFetching ? <Loader2 className="animate-spin" /> : 'Prospectar IA'}
              </button>
           </form>
           <p className="mt-3 text-[10px] font-medium text-slate-500">
             {providerAttribution(provider)}
           </p>
        </div>

        {isError && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 sm:mb-8 sm:flex-row sm:items-start sm:p-5">
            <div className="flex flex-1 items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div className="flex-1">
                <p>{error instanceof Error ? error.message : 'Não foi possível buscar leads.'}</p>
                {totalLeads > 0 && (
                  <p className="mt-1 text-xs text-red-400">
                    {analyzedLeads} de {totalLeads} leads analisados. Resultados parciais mantidos.
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => refetch()}
              className="shrink-0 rounded-xl bg-red-600 px-4 py-2.5 text-[10px] font-black uppercase text-white hover:bg-red-700 sm:py-2"
            >
              {totalLeads > 0 ? 'Continuar' : 'Tentar novamente'}
            </button>
          </div>
        )}

        {isFetching && totalLeads > 0 && (
          <div className="mb-6 rounded-2xl border border-slate-700 bg-surface p-4 sm:mb-8 sm:p-5">
            <div className="flex items-center justify-between mb-2 text-[10px] font-black uppercase tracking-widest">
              <span className="text-slate-400 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin text-primary" /> Analisando com IA
              </span>
              <span className="text-primary">{analyzedLeads}/{totalLeads}</span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {data?.leads && (
          <div className="mb-6 flex flex-wrap gap-2 sm:mb-8 sm:gap-3">
            <FilterButton active={activeFilter === 'all'} onClick={() => setActiveFilter('all')} icon={<Globe />} label="Todos" count={data.leads.length} />
            <FilterButton active={activeFilter === 'no_website'} onClick={() => setActiveFilter('no_website')} icon={<AlertCircle />} label="Sem Site" variant="danger" count={data.leads.filter(l => l.analysis?.status === 'NO_WEBSITE' || !l.websiteUri).length} />
            <FilterButton active={activeFilter === 'insecure'} onClick={() => setActiveFilter('insecure')} icon={<ShieldAlert />} label="Inseguros" variant="warning" count={data.leads.filter(l => l.analysis?.status !== 'NO_WEBSITE' && l.websiteUri && l.analysis?.isSecure === false).length} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {filteredLeads.map(lead => <LeadCard key={lead.id} lead={lead} />)}
        </div>

        {!isFetching && !isError && nicheParam && data?.leads && filteredLeads.length === 0 && (
          <div className="py-16 text-center text-slate-400">
            <AlertCircle className="mx-auto mb-4 h-10 w-10 text-slate-600" />
            <p className="text-sm">
              {data.leads.length === 0
                ? 'Nenhum lead encontrado para esta busca.'
                : 'Nenhum lead corresponde ao filtro selecionado.'}
            </p>
            {data.leads.length > 0 && activeFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className="mt-4 rounded-xl border border-slate-700 bg-surface px-4 py-2 text-xs font-bold text-slate-300 transition hover:border-primary hover:text-white"
              >
                Limpar filtro
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-surface p-5 shadow-xl sm:rounded-[2rem] sm:p-8">
      <div className={`absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-all group-hover:scale-110 ${color}`}>
        {icon && <div className="scale-[4]">{icon}</div>}
      </div>
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className={`text-3xl font-black italic tracking-tighter sm:text-4xl ${color}`}>{value}</p>
    </div>
  );
}

type FilterVariant = 'primary' | 'danger' | 'warning';

function FilterButton({ active, onClick, icon, label, count, variant = 'primary' }: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  count: number;
  variant?: FilterVariant;
}) {
  const styles: Record<FilterVariant, string> = {
    primary: active ? "bg-primary text-white" : "bg-surface text-slate-400",
    danger: active ? "bg-red-600 text-white" : "bg-surface text-slate-400 hover:border-red-500/50",
    warning: active ? "bg-amber-600 text-white" : "bg-surface text-slate-400 hover:border-amber-500/50",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2.5 text-[10px] font-black uppercase transition-all sm:px-6 sm:py-3 sm:text-[11px] ${styles[variant]}`}
    >
      {icon} {label} <span className="ml-1 opacity-40 sm:ml-2">{count}</span>
    </button>
  );
}
