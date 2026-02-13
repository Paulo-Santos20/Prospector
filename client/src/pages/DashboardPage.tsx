import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, MapPin, Loader2, Sparkles, AlertCircle, 
  Filter, Globe, ShieldAlert, Smartphone 
} from 'lucide-react';

// CORREÇÃO: Importando 'type Lead' para evitar o erro de exportação
import { searchLeads, type Lead } from '../features/search/services/searchService';
import { LeadCard } from '../features/leads/components/LeadCard';

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Estado dos Filtros: 'all' | 'no_website' | 'insecure' | 'not_responsive'
  const [activeFilter, setActiveFilter] = useState<'all' | 'no_website' | 'insecure' | 'not_responsive'>('all');

  const nicheParam = searchParams.get('niche') || '';
  const locationParam = searchParams.get('location') || '';

  const [nicheInput, setNicheInput] = useState(nicheParam);
  const [locationInput, setLocationInput] = useState(locationParam);

  useEffect(() => {
    setNicheInput(nicheParam);
    setLocationInput(locationParam);
  }, [nicheParam, locationParam]);

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['leads', nicheParam, locationParam],
    queryFn: () => searchLeads(nicheParam, locationParam),
    enabled: !!nicheParam && !!locationParam,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // Lógica de Filtragem reativa
  const filteredLeads = useMemo(() => {
    if (!data?.leads) return [];
    
    switch (activeFilter) {
      case 'no_website':
        return data.leads.filter(l => l.analysis.status === 'NO_WEBSITE');
      case 'insecure':
        return data.leads.filter(l => l.analysis.status !== 'NO_WEBSITE' && !l.analysis.isSecure);
      case 'not_responsive':
        return data.leads.filter(l => l.analysis.status !== 'NO_WEBSITE' && !l.analysis.isResponsive);
      default:
        return data.leads;
    }
  }, [data, activeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicheInput || !locationInput) return;
    setSearchParams({ niche: nicheInput, location: locationInput });
    setActiveFilter('all'); // Reseta o filtro ao fazer nova busca
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 pb-20">
      <header className="border-b border-slate-800 bg-surface/50 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-white shadow-lg">P</div>
            <span className="font-bold text-xl tracking-tight">Prospector</span>
          </div>
          <div className="text-xs font-mono text-slate-500 border border-slate-700 px-2 py-1 rounded">BETA v1.0</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        
        {/* Área de Busca */}
        <div className="bg-surface border border-slate-700 rounded-xl p-6 shadow-2xl mb-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
           <h1 className="text-2xl font-bold mb-2 flex items-center gap-2 text-white">
             <Sparkles className="w-5 h-5 text-amber-400" /> Minerador de Oportunidades
           </h1>
           
           <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 relative z-10">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Nicho (ex: Pizzaria, Dentista)"
                  className="w-full bg-background border border-slate-600 rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary outline-none transition text-white"
                  value={nicheInput}
                  onChange={(e) => setNicheInput(e.target.value)}
                />
              </div>
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Localização (ex: Recife, SP)"
                  className="w-full bg-background border border-slate-600 rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary outline-none transition text-white"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                />
              </div>
              <button disabled={isFetching} type="submit" className="bg-primary hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition min-w-[160px] flex justify-center items-center">
                {isFetching ? <Loader2 className="animate-spin w-5 h-5" /> : 'Prospectar'}
              </button>
           </form>
        </div>

        {/* BARRA DE FILTROS (Aparece apenas quando há dados) */}
        {data && data.leads.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-8 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 px-3 text-slate-500 border-r border-slate-700 mr-2 hidden md:flex">
              <Filter className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Filtrar:</span>
            </div>
            
            <FilterButton 
              active={activeFilter === 'all'} 
              onClick={() => setActiveFilter('all')}
              icon={<Globe className="w-4 h-4" />}
              label="Todos"
              count={data.leads.length}
            />
            <FilterButton 
              active={activeFilter === 'no_website'} 
              onClick={() => setActiveFilter('no_website')}
              icon={<AlertCircle className="w-4 h-4" />}
              label="Sem Site"
              count={data.leads.filter(l => l.analysis.status === 'NO_WEBSITE').length}
              variant="danger"
            />
            <FilterButton 
              active={activeFilter === 'insecure'} 
              onClick={() => setActiveFilter('insecure')}
              icon={<ShieldAlert className="w-4 h-4" />}
              label="Inseguros"
              count={data.leads.filter(l => l.analysis.status !== 'NO_WEBSITE' && !l.analysis.isSecure).length}
              variant="warning"
            />
            <FilterButton 
              active={activeFilter === 'not_responsive'} 
              onClick={() => setActiveFilter('not_responsive')}
              icon={<Smartphone className="w-4 h-4" />}
              label="Não Mobile"
              count={data.leads.filter(l => l.analysis.status !== 'NO_WEBSITE' && !l.analysis.isResponsive).length}
              variant="warning"
            />
          </div>
        )}

        {/* Grid de Resultados */}
        <div className="space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">Erro ao conectar com o servidor. Verifique o backend.</p>
            </div>
          )}

          {isLoading && !data && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
               <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
               <p>Escaneando oportunidades...</p>
            </div>
          )}

          {data && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
               {filteredLeads.map((lead) => (
                 <LeadCard key={lead.id} lead={lead} />
               ))}
            </div>
          )}

          {filteredLeads.length === 0 && data && !isLoading && (
            <div className="text-center py-20 text-slate-500 bg-surface/20 border border-dashed border-slate-800 rounded-xl">
              <p>Nenhum resultado para este filtro específico.</p>
            </div>
          )}

          {!data && !isLoading && !error && (
            <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-surface/30">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Insira o nicho e a cidade para minerar leads</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Sub-componente interno para os botões de filtro
function FilterButton({ active, onClick, icon, label, count, variant = 'primary' }: any) {
  const baseStyles = "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border";
  const variants: any = {
    primary: active ? "bg-primary border-primary text-white shadow-lg shadow-blue-500/20" : "bg-surface border-slate-700 text-slate-400 hover:border-slate-500",
    danger: active ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-500/20" : "bg-surface border-slate-700 text-slate-400 hover:border-red-500/50",
    warning: active ? "bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-500/20" : "bg-surface border-slate-700 text-slate-400 hover:border-amber-500/50",
  };

  return (
    <button onClick={onClick} className={`${baseStyles} ${variants[variant]}`}>
      {icon}
      {label}
      <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[9px] ${active ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-500'}`}>
        {count}
      </span>
    </button>
  );
}