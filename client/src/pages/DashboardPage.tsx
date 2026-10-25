import { useState, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Loader2, Sparkles, AlertCircle, 
  Globe, ShieldAlert, Users, Send, Target, Layout
} from 'lucide-react';

import {
  getProviderStatus,
  providerAttribution,
  DEFAULT_PROVIDER,
} from '../features/search/services/searchService';
import { useLeadSearch } from '../features/search/hooks/useLeadSearch';
import { LeadCard } from '../features/leads/components/LeadCard';
import { UserMenu } from '../app/UserMenu';
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
    <div className="min-h-screen bg-background text-slate-100 pb-20">
      <header className="border-b border-slate-800 bg-surface/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-white shadow-lg">P</div>
            <span className="font-bold text-xl tracking-tight">Prospector AI</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/no-website" className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-bold px-4 py-2 rounded-xl transition-all border border-red-500/30 hover:border-red-500">
              <AlertCircle className="w-4 h-4" /> Sem Site
            </Link>
            <Link to="/crm" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all border border-slate-700 hover:border-primary shadow-lg">
              <Layout className="w-4 h-4 text-primary" /> Meu CRM
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard icon={<Users />} label="Leads no CRM" value={stats?.totalLeads || 0} color="text-blue-400" />
          <StatCard icon={<Send />} label="Propostas Enviadas" value={stats?.totalProposals || 0} color="text-emerald-400" />
          <StatCard icon={<Target />} label="Taxa de Fechamento" value={`${stats?.rate || 0}%`} color="text-amber-400" />
        </div>

        <div className="bg-surface border border-slate-700 rounded-[2.5rem] p-8 shadow-2xl mb-10 relative overflow-hidden">
           <h1 className="text-2xl font-black mb-6 flex items-center gap-2 italic uppercase">
             <Sparkles className="w-5 h-5 text-amber-400" /> Inteligência de Mineração
           </h1>
           <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 relative z-10 items-center">
               <div className="flex items-center gap-2">
                 <select 
                   value={provider} 
                   onChange={(e) => setProvider(e.target.value)}
                   className="bg-background border border-slate-600 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-primary transition text-sm"
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
                   className={`w-2.5 h-2.5 rounded-full ${
                     providerStatus?.providers?.[provider]?.configured !== false &&
                     providerStatus?.providers?.[provider]?.available !== false
                       ? 'bg-emerald-400'
                       : 'bg-red-400'
                   }`}
                 />
               </div>
               <input 
                type="text" placeholder="Nicho (ex: Clínicas de Estética)" value={nicheInput}
                onChange={(e) => setNicheInput(e.target.value)}
                className="flex-1 bg-background border border-slate-600 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-primary transition"
              />
              <input 
                type="text" placeholder="Localização (ex: Recife)" value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                className="flex-1 bg-background border border-slate-600 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-primary transition"
              />
              <button disabled={isFetching} type="submit" className="bg-primary hover:bg-blue-600 text-white font-black py-4 px-10 rounded-2xl transition disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-tighter italic">
                {isFetching ? <Loader2 className="animate-spin" /> : 'Prospectar IA'}
              </button>
           </form>
           <p className="mt-3 text-[10px] text-slate-500 font-medium">
             {providerAttribution(provider)}
           </p>
        </div>

        {isError && (
          <div className="mb-8 flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-2xl p-5 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="flex-1">
              <p>{error instanceof Error ? error.message : 'Não foi possível buscar leads.'}</p>
              {totalLeads > 0 && (
                <p className="mt-1 text-xs text-red-400">
                  {analyzedLeads} de {totalLeads} leads analisados. Resultados parciais mantidos.
                </p>
              )}
            </div>
            <button
              onClick={() => refetch()}
              className="shrink-0 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase"
            >
              {totalLeads > 0 ? 'Continuar' : 'Tentar novamente'}
            </button>
          </div>
        )}

        {isFetching && totalLeads > 0 && (
          <div className="mb-8 bg-surface border border-slate-700 rounded-2xl p-5">
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
          <div className="flex flex-wrap gap-3 mb-8">
            <FilterButton active={activeFilter === 'all'} onClick={() => setActiveFilter('all')} icon={<Globe />} label="Todos" count={data.leads.length} />
            <FilterButton active={activeFilter === 'no_website'} onClick={() => setActiveFilter('no_website')} icon={<AlertCircle />} label="Sem Site" variant="danger" count={data.leads.filter(l => l.analysis?.status === 'NO_WEBSITE' || !l.websiteUri).length} />
            <FilterButton active={activeFilter === 'insecure'} onClick={() => setActiveFilter('insecure')} icon={<ShieldAlert />} label="Inseguros" variant="warning" count={data.leads.filter(l => l.analysis?.status !== 'NO_WEBSITE' && l.websiteUri && l.analysis?.isSecure === false).length} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map(lead => <LeadCard key={lead.id} lead={lead} />)}
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className="bg-surface border border-slate-800 p-8 rounded-[2rem] shadow-xl relative group overflow-hidden">
      <div className={`absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-all group-hover:scale-110 ${color}`}>
        {icon && <div className="scale-[4]">{icon}</div>}
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{label}</p>
      <p className={`text-4xl font-black italic tracking-tighter ${color}`}>{value}</p>
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
    <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[11px] font-black uppercase transition-all border border-slate-700 ${styles[variant]}`}>
      {icon} {label} <span className="opacity-40 ml-2">{count}</span>
    </button>
  );
}
