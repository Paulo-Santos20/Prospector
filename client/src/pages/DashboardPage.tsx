import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, MapPin, Loader2, Sparkles, AlertCircle, 
  Filter, Globe, ShieldAlert, Smartphone, Users, Send, Target, TrendingUp 
} from 'lucide-react';

import { searchLeads } from '../features/search/services/searchService';
import { LeadCard } from '../features/leads/components/LeadCard';

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState<'all' | 'no_website' | 'insecure' | 'not_responsive'>('all');

  const nicheParam = searchParams.get('niche') || '';
  const locationParam = searchParams.get('location') || '';

  const [nicheInput, setNicheInput] = useState(nicheParam);
  const [locationInput, setLocationInput] = useState(locationParam);

  // Busca de Estatísticas Globais (Simuladas via API)
  const { data: stats } = useQuery({
    queryKey: ['global-stats'],
    queryFn: async () => {
      // Substitua pela sua rota real de estatísticas quando disponível
      const res = await axios.get('https://prospector-api-mngo.onrender.com/api/stats').catch(() => ({ 
        data: { totalLeads: 0, totalProposals: 0, rate: 12.5 } 
      }));
      return res.data;
    },
    refetchInterval: 30000,
  });

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['leads', nicheParam, locationParam],
    queryFn: () => searchLeads(nicheParam, locationParam),
    enabled: !!nicheParam && !!locationParam,
    staleTime: 1000 * 60 * 5,
  });

  const filteredLeads = useMemo(() => {
    if (!data?.leads) return [];
    return data.leads.filter(l => {
      if (!l.analysis) return activeFilter === 'all';
      switch (activeFilter) {
        case 'no_website': return l.analysis.status === 'NO_WEBSITE' || !l.websiteUri;
        case 'insecure': return l.analysis.status !== 'NO_WEBSITE' && l.websiteUri && !l.analysis.isSecure;
        case 'not_responsive': return l.analysis.status !== 'NO_WEBSITE' && l.websiteUri && !l.analysis.isResponsive;
        default: return true;
      }
    });
  }, [data, activeFilter]);

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
            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 uppercase">Sistema Online</span>
            <div className="text-xs font-mono text-slate-500">v1.2</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        
        {/* 4. DASHBOARD DE CONVERSÃO (GAMIFICAÇÃO) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard icon={<Users />} label="Leads Minerados" value={stats?.totalLeads || 0} color="text-blue-400" />
          <StatCard icon={<Send />} label="Propostas Enviadas" value={stats?.totalProposals || 0} color="text-emerald-400" />
          <StatCard icon={<Target />} label="Taxa de Resposta" value={`${stats?.rate || 0}%`} color="text-amber-400" />
        </div>

        {/* Banner de Progresso */}
        <div className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 p-6 rounded-[2rem] mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Nível de Prospecção
            </h2>
            <p className="text-xs text-slate-400">Você está a 5 propostas de bater sua meta diária e subir de nível!</p>
          </div>
          <div className="w-full md:w-64 h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
             <div className="h-full bg-primary rounded-full shadow-[0_0_15px_#3B82F6]" style={{ width: '65%' }}></div>
          </div>
        </div>

        {/* Busca */}
        <div className="bg-surface border border-slate-700 rounded-[2.5rem] p-8 shadow-2xl mb-10 relative overflow-hidden">
           <h1 className="text-2xl font-black mb-6 flex items-center gap-2 italic uppercase">
             <Sparkles className="w-5 h-5 text-amber-400" /> Nova Mineração
           </h1>
           <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <input 
                type="text" placeholder="Nicho (ex: Pizzaria)" value={nicheInput}
                onChange={(e) => setNicheInput(e.target.value)}
                className="flex-1 bg-background border border-slate-600 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-primary transition"
              />
              <input 
                type="text" placeholder="Localização (ex: Olinda)" value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                className="flex-1 bg-background border border-slate-600 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-primary transition"
              />
              <button disabled={isFetching} type="submit" className="bg-primary hover:bg-blue-600 text-white font-black py-4 px-10 rounded-2xl transition disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-tighter italic">
                {isFetching ? <Loader2 className="animate-spin" /> : 'Prospectar'}
              </button>
           </form>
        </div>

        {/* Filtros */}
        {data?.leads && (
          <div className="flex flex-wrap gap-3 mb-8">
            <FilterButton active={activeFilter === 'all'} onClick={() => setActiveFilter('all')} icon={<Globe />} label="Todos" count={data.leads.length} />
            <FilterButton active={activeFilter === 'no_website'} onClick={() => setActiveFilter('no_website')} icon={<AlertCircle />} label="Sem Site" variant="danger" count={data.leads.filter(l => l.analysis?.status === 'NO_WEBSITE' || !l.websiteUri).length} />
            <FilterButton active={activeFilter === 'insecure'} onClick={() => setActiveFilter('insecure')} icon={<ShieldAlert />} label="Inseguros" variant="warning" count={data.leads.filter(l => l.analysis?.status !== 'NO_WEBSITE' && l.websiteUri && !l.analysis?.isSecure).length} />
          </div>
        )}

        {/* Grid de Leads */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map(lead => <LeadCard key={lead.id} lead={lead} />)}
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
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

function FilterButton({ active, onClick, icon, label, count, variant = 'primary' }: any) {
  const styles: any = {
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