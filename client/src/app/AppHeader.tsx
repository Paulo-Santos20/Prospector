import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AlertCircle, Globe, Layout, Menu, X } from 'lucide-react';
import { UserMenu } from './UserMenu';

type HeaderLink = {
  to: string;
  label: string;
  icon: ReactNode;
  accent: 'default' | 'danger' | 'primary';
  end?: boolean;
};

const links: HeaderLink[] = [
  { to: '/', label: 'Dashboard', icon: <Globe className="w-4 h-4" />, accent: 'default', end: true },
  { to: '/no-website', label: 'Sem Site', icon: <AlertCircle className="w-4 h-4" />, accent: 'danger' },
  { to: '/crm', label: 'Meu CRM', icon: <Layout className="w-4 h-4" />, accent: 'primary' },
];

const linkClasses = (active: boolean, accent: HeaderLink['accent']) => {
  const base =
    'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition-colors md:text-xs';

  if (accent === 'danger') {
    return `${base} ${
      active
        ? 'border-red-500/40 bg-red-600/20 text-red-300'
        : 'border-transparent text-slate-400 hover:border-red-500/30 hover:bg-red-600/10 hover:text-red-300'
    }`;
  }

  if (accent === 'primary') {
    return `${base} ${
      active
        ? 'border-primary/40 bg-primary/15 text-blue-300'
        : 'border-transparent text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-white'
    }`;
  }

  return `${base} ${
    active
      ? 'border-slate-700 bg-slate-800 text-white'
      : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-white'
  }`;
};

export const AppHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-4">
        <Link
          to="/"
          onClick={() => setMenuOpen(false)}
          className="flex min-w-0 items-center gap-2 rounded-lg"
          aria-label="Prospector AI - ir para o Dashboard"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary font-bold text-white shadow-lg">
            P
          </div>
          <span className="truncate text-lg font-bold tracking-tight sm:text-xl">Prospector AI</span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex" aria-label="Navegação principal">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => linkClasses(isActive, link.accent)}
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-slate-300 transition-colors hover:text-white md:hidden"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <UserMenu />
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Navegação principal"
          className="border-t border-slate-800 bg-surface px-3 py-3 md:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => linkClasses(isActive, link.accent)}
              >
                {link.icon}
                {link.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
};
