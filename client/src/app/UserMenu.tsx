import { LogOut } from 'lucide-react';
import { useAuth } from './authContext';

export const UserMenu = () => {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="hidden md:block text-[10px] font-bold text-slate-500 max-w-[180px] truncate">
        {user.email}
      </span>
      <button
        onClick={() => void logout()}
        className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/40 transition-all"
        title="Sair"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
};
