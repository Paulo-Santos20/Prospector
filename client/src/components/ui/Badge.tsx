import { cn } from "../../lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'danger' | 'warning' | 'success' | 'default';
  className?: string;
}

export const Badge = ({ children, variant = 'default', className }: BadgeProps) => {
  const variants = {
    danger: "bg-red-500/10 text-red-400 border-red-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    default: "bg-slate-700 text-slate-300 border-slate-600",
  };

  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium border", variants[variant], className)}>
      {children}
    </span>
  );
};