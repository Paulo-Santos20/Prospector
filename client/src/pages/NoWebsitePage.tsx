import { useState, useMemo, type MouseEvent, type KeyboardEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Loader2, AlertCircle, 
  MapPin, Star, TrendingUp
} from 'lucide-react';
import {
  providerAttribution,
  DEFAULT_PROVIDER,
  type Lead,
} from '../features/search/services/searchService';
import { useLeadSearch } from '../features/search/hooks/useLeadSearch';
import { saveLeadToCRM } from '../features/crm/services/crmService';
import { AppHeader } from '../app/AppHeader';

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
    <div className="min-h-screen bg-background pb-20 text-slate-100">
      <AppHeader />

      <main className="mx-auto mt-5 max-w-7xl px-3 sm:mt-8 sm:px-4">
        <div className="relative mb-6 overflow-hidden rounded-3xl border border-slate-700 bg-surface p-4 shadow-2xl sm:mb-10 sm:rounded-[2.5rem] sm:p-6 lg:p-8">
          <h1 className="mb-2 flex items-center gap-2 text-xl font-black italic uppercase sm:text-2xl">
            <TrendingUp className="h-4 w-4 shrink-0 text-red-400 sm:h-5 sm:w-5" /> Empresas Sem Website
          </h1>
          <p className="mb-4 text-sm text-slate-400 sm:mb-6">Encontre negócios prontos para criar presença digital</p>
          
          <form onSubmit={handleSearch} className="relative z-10 flex flex-col gap-3 md:flex-row">
            <input 
              type="text"
              aria-label="Nicho"
              placeholder="Nicho (ex: Restaurantes)"
              value={nicheInput}
              onChange={(e) => setNicheInput(e.target.value)}
              className="w-full min-w-0 flex-1 rounded-2xl border border-slate-600 bg-background px-4 py-3.5 text-base outline-none transition focus:ring-2 focus:ring-red-500 sm:px-6 sm:py-4"
            />
            <input 
              type="text"
              aria-label="Localização"
              placeholder="Localização (ex: São Paulo)"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              className="w-full min-w-0 flex-1 rounded-2xl border border-slate-600 bg-background px-4 py-3.5 text-base outline-none transition focus:ring-2 focus:ring-red-500 sm:px-6 sm:py-4"
            />
            <button
              disabled={isFetching}
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-3.5 font-black italic uppercase tracking-tighter text-white transition hover:bg-red-700 disabled:opacity-50 sm:py-4 md:w-auto md:px-10"
            >
              {isFetching ? <Loader2 className="animate-spin" /> : 'Encontrar Sem Site'}
            </button>
          </form>
          <p className="mt-3 text-[10px] font-medium text-slate-500">
            {providerAttribution(DEFAULT_PROVIDER)}
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
          <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:gap-4">
            <span className="text-xs font-bold uppercase text-slate-500">Ordenar por:</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSortBy('rating')}
                aria-pressed={sortBy === 'rating'}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition sm:px-4 ${sortBy === 'rating' ? 'bg-red-600 text-white' : 'border border-slate-700 bg-surface text-slate-400'}`}
              >
                <Star className="mr-1 inline h-3 w-3" /> Nota
              </button>
              <button
                type="button"
                onClick={() => setSortBy('reviews')}
                aria-pressed={sortBy === 'reviews'}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition sm:px-4 ${sortBy === 'reviews' ? 'bg-red-600 text-white' : 'border border-slate-700 bg-surface text-slate-400'}`}
              >
                Reviews
              </button>
              <button
                type="button"
                onClick={() => setSortBy('price')}
                aria-pressed={sortBy === 'price'}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition sm:px-4 ${sortBy === 'price' ? 'bg-red-600 text-white' : 'border border-slate-700 bg-surface text-slate-400'}`}
              >
                Preço
              </button>
            </div>
            
            <span className="text-sm font-bold text-slate-400 sm:ml-auto">
              {noWebsiteLeads.length} oportunidades encontradas
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {noWebsiteLeads.map(lead => (
            <NoWebsiteCard key={lead.id} lead={lead} />
          ))}
        </div>

        {!isFetching && !isError && nicheParam && noWebsiteLeads.length === 0 && (
          <div className="py-16 text-center sm:py-20">
            <AlertCircle className="mx-auto mb-4 h-10 w-10 text-slate-600 sm:h-12 sm:w-12" />
            <p className="text-sm text-slate-400">Nenhuma empresa sem site encontrada nesta busca</p>
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
      <div className="relative flex h-full animate-pulse flex-col rounded-2xl border border-slate-700/50 bg-surface p-5 shadow-lg sm:p-6">
        <h3 className="truncate text-lg font-bold text-white/60">{lead.displayName.text}</h3>
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

  const openLead = () => navigate(`/lead/${lead.id}`, { state: { lead } });

  const handleSave = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    try {
      await saveLeadToCRM(lead);
      setIsSaved(true);
    } catch (error) {
      console.error(error);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLead();
    }
  };

  const getPriceLabel = (level: number) => {
    const labels = ['', '$', '$$', '$$$', '$$$$'];
    return labels[level] || '$';
  };

  return (
    <div 
      role="link"
      tabIndex={0}
      aria-label={`Abrir detalhes de ${lead.displayName.text}`}
      className="group relative flex h-full cursor-pointer flex-col rounded-2xl border border-slate-700 bg-surface p-5 shadow-lg transition-all hover:border-red-500 focus-visible:border-red-500 focus-visible:ring-2 focus-visible:ring-red-400 sm:p-6"
      onClick={openLead}
      onKeyDown={handleKeyDown}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-white">{lead.displayName.text}</h3>
          <p className="flex items-center truncate text-xs text-slate-500">
            <MapPin className="mr-1 h-3 w-3 shrink-0" /> {lead.formattedAddress.split(',')[0]}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          aria-label={isSaved ? 'Lead salvo no CRM' : 'Salvar lead no CRM'}
          className={`rounded-lg p-2.5 transition ${isSaved ? 'bg-amber-500/10 text-amber-400' : 'text-slate-500 hover:text-amber-400'}`}
        >
          <Star className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
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
