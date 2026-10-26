import { LogOut } from 'lucide-react';
import { useAuth } from './authContext';

export const UserMenu = () => {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-[180px] truncate text-[10px] font-bold text-slate-500 lg:block">
        {user.email}
      </span>
      <button
        type="button"
        onClick={() => void logout()}
        className="rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-slate-400 transition-all hover:border-red-500/40 hover:text-red-400"
        title="Sair"
        aria-label="Sair da conta"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
};
