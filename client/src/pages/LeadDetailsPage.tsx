import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Globe, MapPin, Phone, Star, ShieldAlert, 
  Smartphone, Calendar, Mail, Share2, Facebook, Instagram, 
  Linkedin, Twitter, Youtube, ExternalLink, AlertCircle, TrendingUp, Sparkles
} from 'lucide-react';
import { type Lead } from '../features/search/services/searchService';
import { Badge } from '../components/ui/Badge';
import { ProposalModal } from '../features/leads/components/ProposalModal';
import { useState } from 'react';

export default function LeadDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const lead = location.state?.lead as Lead;
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!lead) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-slate-400">
        <div className="text-center">
          <p className="mb-4 text-lg font-medium">Nenhum lead selecionado.</p>
          <button 
            onClick={() => navigate('/')} 
            className="bg-primary text-white px-8 py-3 rounded-xl hover:bg-blue-600 transition-all shadow-lg font-bold"
          >
            Voltar para a busca
          </button>
        </div>
      </div>
    );
  }

  const { analysis } = lead;

  const getSocialIcon = (network: string) => {
    switch (network) {
      case 'facebook': return <Facebook className="w-5 h-5 text-blue-500" />;
      case 'instagram': return <Instagram className="w-5 h-5 text-pink-500" />;
      case 'linkedin': return <Linkedin className="w-5 h-5 text-blue-700" />;
      case 'twitter': return <Twitter className="w-5 h-5 text-sky-500" />;
      case 'youtube': return <Youtube className="w-5 h-5 text-red-600" />;
      default: return <Share2 className="w-5 h-5 text-slate-400" />;
    }
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.displayName.text + ' ' + lead.formattedAddress)}`;

  // --- COMPONENTE DO TERMÔMETRO DE OPORTUNIDADE ---
  const renderThermometer = () => {
    const score = analysis.opportunityScore || 0;
    const getColor = () => {
      if (score > 80) return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]';
      if (score > 50) return 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]';
      return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]';
    };

    return (
      <div className="mt-8 bg-slate-900/80 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
        <div className="flex justify-between items-end mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Índice de Oportunidade</span>
          </div>
          <span className={`text-3xl font-black italic ${score > 50 ? 'text-white' : 'text-slate-500'}`}>
            {score}%
          </span>
        </div>
        
        <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden p-1 border border-slate-700 shadow-inner">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out ${getColor()}`} 
            style={{ width: `${score}%` }}
          />
        </div>
        
        <p className="mt-4 text-xs text-slate-400 leading-relaxed italic flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          {score > 80 
            ? "Oportunidade Crítica: Este negócio tem relevância no mercado, mas a infraestrutura digital é precária ou inexistente." 
            : "Este lead possui uma base digital razoável, mas existem pontos técnicos que podem ser otimizados para conversão."}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-slate-200 pb-20">
      {/* --- HEADER --- */}
      <header className="border-b border-slate-800 bg-surface/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-slate-400 hover:text-white transition-all font-bold group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> 
            Voltar
          </button>
          <span className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">Lead Profiler</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        {/* --- CABEÇALHO --- */}
        <div className="bg-surface border border-slate-700 rounded-3xl p-8 shadow-2xl mb-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <Globe className="w-48 h-48" />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
            <div className="flex-1">
              <h1 className="text-4xl font-black text-white mb-4 tracking-tighter leading-tight">
                {lead.displayName.text}
              </h1>
              <div className="flex items-center text-slate-400 mb-6 text-sm">
                <MapPin className="w-4 h-4 mr-2 text-primary shrink-0" /> {lead.formattedAddress}
              </div>
              
              <div className="flex flex-wrap gap-3">
                {lead.rating && (
                  <div className="flex items-center bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-xl border border-yellow-500/20 text-sm font-bold shadow-sm">
                    <Star className="w-4 h-4 mr-2 fill-current" />
                    <span>{lead.rating}</span>
                    <span className="opacity-40 ml-2 font-medium">({lead.userRatingCount} avaliações)</span>
                  </div>
                )}
                <a 
                  href={googleMapsUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl border border-emerald-500/20 text-sm font-bold hover:bg-emerald-500/20 transition-all active:scale-95 shadow-sm"
                >
                  <MapPin className="w-4 h-4 mr-2" /> Google Maps
                </a>
              </div>
            </div>

            <Badge 
              variant={analysis.status === 'NO_WEBSITE' ? 'danger' : analysis.status === 'MODERN_SITE' ? 'success' : 'warning'}
              className="text-xs px-6 py-3 shadow-2xl uppercase font-black tracking-widest border-2"
            >
              {analysis.status === 'NO_WEBSITE' ? 'Oportunidade Máxima' : analysis.status === 'MODERN_SITE' ? 'Site Operacional' : 'Necessita Melhoria'}
            </Badge>
          </div>

          {/* Renderiza o termômetro aqui */}
          {renderThermometer()}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* --- DIAGNÓSTICO TÉCNICO --- */}
          <div className="md:col-span-2 space-y-8">
            <section>
              <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg"><Globe className="w-5 h-5 text-primary" /></div>
                Diagnóstico Web
              </h2>
              
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 space-y-6">
                <div className="p-5 bg-background border border-slate-700/50 rounded-xl shadow-inner group">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">URL Cadastrada:</p>
                  {lead.websiteUri ? (
                    <a 
                      href={lead.websiteUri} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-primary font-mono text-base break-all flex items-center gap-3 hover:text-blue-400 transition-colors"
                    >
                      {lead.websiteUri} <ExternalLink className="w-4 h-4 flex-shrink-0" />
                    </a>
                  ) : (
                    <span className="text-red-400/80 text-sm font-mono flex items-center gap-2 italic">
                      <AlertCircle className="w-4 h-4 shrink-0" /> Sem website próprio detectado no Google.
                    </span>
                  )}
                </div>

                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-5 bg-surface/40 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${analysis.isSecure ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                        <ShieldAlert className={`w-6 h-6 ${analysis.isSecure ? 'text-emerald-400' : 'text-red-400'}`} />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">Segurança SSL</p>
                        <p className="text-xs text-slate-500 font-medium">{analysis.isSecure ? 'Certificado válido' : 'Protocolo desprotegido'}</p>
                      </div>
                    </div>
                    <Badge variant={analysis.isSecure ? 'success' : 'danger'} className="font-black px-4">{analysis.isSecure ? 'OK' : 'FALHA'}</Badge>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-surface/40 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${analysis.isResponsive ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                        <Smartphone className={`w-6 h-6 ${analysis.isResponsive ? 'text-emerald-400' : 'text-red-400'}`} />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">Responsividade</p>
                        <p className="text-xs text-slate-500 font-medium">{analysis.isResponsive ? 'Otimizado para Mobile' : 'Layout estático (Desktop only)'}</p>
                      </div>
                    </div>
                    <Badge variant={analysis.isResponsive ? 'success' : 'danger'} className="font-black px-4">{analysis.isResponsive ? 'OK' : 'FALHA'}</Badge>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* --- CANAIS DE CONTATO --- */}
          <div className="space-y-6">
            <div className="bg-surface border border-slate-700 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <h3 className="text-[10px] font-black text-slate-500 uppercase mb-6 tracking-[0.2em] border-b border-slate-800 pb-4">
                Dados de Prospecção
              </h3>
              <ul className="space-y-8">
                {lead.internationalPhoneNumber && (
                  <li className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase font-black mb-1">Contato Direto</span>
                      <span className="text-sm font-mono text-white select-all font-bold tracking-tight">{lead.internationalPhoneNumber}</span>
                    </div>
                  </li>
                )}

                <li className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden w-full">
                    <span className="block text-[10px] text-slate-500 uppercase font-black mb-1 flex items-center gap-2">
                      E-mails Encontrados
                      <span className="bg-primary/20 text-primary text-[8px] px-1 rounded-sm uppercase tracking-tighter">Verified</span>
                    </span>
                    
                    {analysis.emails && analysis.emails.length > 0 ? (
                      <div className="space-y-3 mt-2">
                        {analysis.emails.map(email => (
                          <span key={email} className="block text-sm font-mono text-blue-300 truncate select-all font-medium border-b border-slate-800 pb-1">
                            {email}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600 italic font-medium">Nenhum e-mail detectado.</span>
                    )}
                  </div>
                </li>
              </ul>
            </div>

            {analysis.socialLinks && analysis.socialLinks.length > 0 && (
              <div className="bg-surface border border-slate-700 rounded-3xl p-6 shadow-xl">
                <h3 className="text-[10px] font-black text-slate-500 uppercase mb-6 tracking-[0.2em] border-b border-slate-800 pb-4">Canais Sociais</h3>
                <div className="flex flex-wrap gap-4 justify-center">
                  {analysis.socialLinks.map((social, idx) => (
                    <a 
                      key={idx} 
                      href={social.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="p-4 bg-background border border-slate-600 rounded-2xl hover:border-primary hover:bg-slate-800 hover:-translate-y-1 transition-all shadow-lg active:scale-95"
                    >
                      {getSocialIcon(social.network)}
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-primary hover:bg-blue-600 text-white font-black py-6 rounded-2xl shadow-[0_10px_30px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center gap-3 active:scale-95 text-lg uppercase tracking-wider group"
            >
              Gerar Proposta
              <ExternalLink className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </div>
      </main>

      <ProposalModal 
        lead={lead} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}