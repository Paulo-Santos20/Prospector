import { useState, useMemo, type MouseEvent } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  Loader2, AlertCircle, 
  Globe, MapPin, Star, 
  TrendingUp, Search, Layout
} from 'lucide-react';
import {
  providerAttribution,
  DEFAULT_PROVIDER,
  type Lead,
} from '../features/search/services/searchService';
import { useLeadSearch } from '../features/search/hooks/useLeadSearch';
import { saveLeadToCRM } from '../features/crm/services/crmService';

export default function NoWebsitePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [nicheInput, setNicheInput] = useState(searchParams.get('niche') || '');
  const [locationInput, setLocationInput] = useState(searchParams.get('location') || '');
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'price'>('rating');

  const nicheParam = searchParams.get('niche') || '';
  const locationParam = searchParams.get('location') || '';

  const { data, isFetching, isError, error, refetch } = useLeadSearch(
    nicheParam,
    locationParam
  );

  const noWebsiteLeads = useMemo(() => {
    if (!data?.leads) return [];
    return data.leads
      .filter(l => l.analysis?.status === 'NO_WEBSITE' || !l.websiteUri)
      .sort((a, b) => {
        switch (sortBy) {
          case 'rating': return (b.rating || 0) - (a.rating || 0);
          case 'reviews': return (b.userRatingCount || 0) - (a.userRatingCount || 0);
          case 'price': return (b.priceLevel || 0) - (a.priceLevel || 0);
          default: return 0;
        }
      });
  }, [data, sortBy]);

  const totalLeads = data?.leads.length ?? 0;
  const analyzingLeads =
    data?.leads.filter((lead) => lead.analysis?.status === 'ANALYZING').length ?? 0;
  const analyzedLeads = totalLeads - analyzingLeads;
  const progress = totalLeads ? Math.round((analyzedLeads / totalLeads) * 100) : 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicheInput || !locationInput) return;
    setSearchParams({ niche: nicheInput, location: locationInput });
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 pb-20">
      <header className="border-b border-slate-800 bg-surface/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">
              <Globe className="w-4 h-4" />
            </div>
            <span className="font-bold text-xl tracking-tight">Sem Site</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all border border-slate-700 hover:border-primary">
              <Search className="w-4 h-4" /> Buscar Leads
            </Link>
            <Link to="/crm" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all border border-slate-700 hover:border-primary">
              <Layout className="w-4 h-4" /> CRM
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        <div className="bg-surface border border-slate-700 rounded-[2.5rem] p-8 shadow-2xl mb-10 relative overflow-hidden">
          <h1 className="text-2xl font-black mb-2 flex items-center gap-2 italic uppercase">
            <TrendingUp className="w-5 h-5 text-red-400" /> Empresas Sem Website
          </h1>
          <p className="text-sm text-slate-400 mb-6">Encontre negócios prontos para criar presença digital</p>
          
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 relative z-10">
            <input 
              type="text" placeholder="Nicho (ex: Restaurantes)" value={nicheInput}
              onChange={(e) => setNicheInput(e.target.value)}
              className="flex-1 bg-background border border-slate-600 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-red-500 transition"
            />
            <input 
              type="text" placeholder="Localização (ex: São Paulo)" value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              className="flex-1 bg-background border border-slate-600 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-red-500 transition"
            />
            <button disabled={isFetching} type="submit" className="bg-red-600 hover:bg-red-700 text-white font-black py-4 px-10 rounded-2xl transition disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-tighter italic">
              {isFetching ? <Loader2 className="animate-spin" /> : 'Encontrar Sem Site'}
            </button>
          </form>
          <p className="mt-3 text-[10px] text-slate-500 font-medium">
            {providerAttribution(DEFAULT_PROVIDER)}
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
                <Loader2 className="w-3 h-3 animate-spin text-red-400" /> Analisando com IA
              </span>
              <span className="text-red-400">{analyzedLeads}/{totalLeads}</span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {data?.leads && (
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <span className="text-xs font-bold text-slate-500 uppercase">Ordenar por:</span>
            <button 
              onClick={() => setSortBy('rating')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${sortBy === 'rating' ? 'bg-red-600 text-white' : 'bg-surface text-slate-400 border border-slate-700'}`}
            >
              <Star className="w-3 h-3 inline mr-1" /> Nota
            </button>
            <button 
              onClick={() => setSortBy('reviews')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${sortBy === 'reviews' ? 'bg-red-600 text-white' : 'bg-surface text-slate-400 border border-slate-700'}`}
            >
              Reviews
            </button>
            <button 
              onClick={() => setSortBy('price')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${sortBy === 'price' ? 'bg-red-600 text-white' : 'bg-surface text-slate-400 border border-slate-700'}`}
            >
              Preço
            </button>
            
            <span className="ml-auto text-sm font-bold text-slate-400">
              {noWebsiteLeads.length} oportunidades encontradas
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {noWebsiteLeads.map(lead => (
            <NoWebsiteCard key={lead.id} lead={lead} />
          ))}
        </div>

        {!isFetching && !isError && nicheParam && noWebsiteLeads.length === 0 && (
          <div className="text-center py-20">
            <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Nenhuma empresa sem site encontrada nesta busca</p>
          </div>
        )}
      </main>
    </div>
  );
}

function NoWebsiteCard({ lead }: { lead: Lead }) {
  const [isSaved, setIsSaved] = useState(false);
  const navigate = useNavigate();
  const { analysis } = lead;

  if (analysis.status === 'ANALYZING') {
    return (
      <div className="bg-surface border border-slate-700/50 rounded-2xl p-6 shadow-lg h-full flex flex-col relative animate-pulse">
        <h3 className="text-lg font-bold text-white/60 truncate">{lead.displayName.text}</h3>
        <p className="text-xs text-slate-500 flex items-center truncate mb-6">
          <MapPin className="w-3 h-3 mr-1 shrink-0" /> {lead.formattedAddress.split(',')[0]}
        </p>
        <div className="bg-slate-800/30 p-4 rounded-xl flex-grow mb-4 flex flex-col items-center justify-center gap-3 border border-slate-700/50">
          <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
          <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest text-center">
            IA avaliando presença digital...
          </span>
        </div>
      </div>
    );
  }

  const handleSave = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    try {
      await saveLeadToCRM(lead);
      setIsSaved(true);
    } catch (error) {
      console.error(error);
    }
  };

  const getPriceLabel = (level: number) => {
    const labels = ['', '$', '$$', '$$$', '$$$$'];
    return labels[level] || '$';
  };

  return (
    <div 
      className="bg-surface border border-slate-700 rounded-2xl p-6 hover:border-red-500 transition-all shadow-lg h-full flex flex-col relative group cursor-pointer"
      onClick={() => navigate('/lead/' + lead.id, { state: { lead } })}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white truncate">{lead.displayName.text}</h3>
          <p className="text-xs text-slate-500 flex items-center truncate">
            <MapPin className="w-3 h-3 mr-1 shrink-0" /> {lead.formattedAddress.split(',')[0]}
          </p>
        </div>
        <button onClick={handleSave} className={`p-2 rounded-lg transition ${isSaved ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-amber-400'}`}>
          <Star className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-1 rounded-lg uppercase">Sem Site</span>
        {lead.rating && lead.rating > 0 && (
          <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center">
            <Star className="w-3 h-3 mr-1 fill-current" /> {lead.rating.toFixed(1)}
          </span>
        )}
        {lead.userRatingCount && lead.userRatingCount > 0 && (
          <span className="bg-slate-700 text-slate-300 text-[10px] font-bold px-2 py-1 rounded-lg">
            {lead.userRatingCount} reviews
          </span>
        )}
        {lead.priceLevel && lead.priceLevel > 0 && (
          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-lg">
            {getPriceLabel(lead.priceLevel)}
          </span>
        )}
      </div>

      <div className="bg-background/50 p-4 rounded-xl flex-grow mb-4">
        <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Oportunidade</p>
        <p className="text-sm text-slate-300">
          {analysis?.aiData?.mainPainPoint || 'Empresa sem presença digital própria'}
        </p>
        
        {analysis?.aiData?.specificIssues && analysis.aiData.specificIssues.length > 0 && (
          <div className="mt-3 space-y-1">
            {analysis.aiData.specificIssues.slice(0, 2).map((issue, i) => (
              <p key={i} className="text-[10px] text-slate-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-400" /> {issue.description}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500">
        <span className="font-bold uppercase">Score: {analysis?.opportunityScore || 70}%</span>
        <span className="text-red-400 font-bold group-hover:translate-x-1 transition-transform">
          Ver Detalhes →
        </span>
      </div>
    </div>
  );
}
