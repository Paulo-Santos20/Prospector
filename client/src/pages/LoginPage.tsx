import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, LockKeyhole, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '../app/authContext';

export default function LoginPage() {
  const { user, configured, signIn, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, from, navigate]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      await signIn(email, password);
    } catch (err) {
      setError(readFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      setError('Informe seu e-mail para receber o link de recuperação.');
      return;
    }
    setError('');
    try {
      await resetPassword(email);
      setMessage('Link de recuperação enviado. Confira seu e-mail.');
    } catch (err) {
      setError(readFirebaseError(err));
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8 text-slate-100">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3 sm:mb-8">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary font-black text-white shadow-lg">
            P
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-black italic uppercase tracking-tighter sm:text-2xl">Prospector AI</h1>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 sm:text-[10px] sm:tracking-[0.25em]">
              Inteligência de prospecção
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-700 bg-surface p-5 shadow-2xl sm:rounded-[2rem] sm:p-8">
          {!configured ? (
            <div className="space-y-3 text-sm text-slate-300">
              <h2 className="text-lg font-black text-white">Configure o Firebase</h2>
              <p className="text-slate-400">
                Crie <code className="text-primary">client/.env</code> a partir de{' '}
                <code className="text-primary">client/.env.example</code> com as chaves do app web:
              </p>
              <pre className="overflow-x-auto rounded-xl border border-slate-700 bg-background p-4 text-[10px] text-slate-400 sm:text-[11px]">
{`VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...`}
              </pre>
              <p className="text-slate-500 text-xs">
                No console do Firebase, ative Email/Senha e Google em Authentication.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-black uppercase italic">Entrar</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    E-mail
                  </span>
                  <div className="relative mt-2">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-xl border border-slate-600 bg-background py-3 pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-primary"
                      placeholder="voce@agencia.com"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Senha
                  </span>
                  <div className="relative mt-2">
                    <LockKeyhole className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-xl border border-slate-600 bg-background py-3 pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-primary"
                      placeholder="Mínimo de 6 caracteres"
                    />
                  </div>
                </label>

                {error && (
                  <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    {error}
                  </p>
                )}
                {message && (
                  <p aria-live="polite" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-black uppercase tracking-tight text-white transition-all hover:bg-blue-600 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Entrar
                </button>
              </form>

              <div className="mt-5 flex items-center justify-end text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => void handleReset()}
                  className="rounded-lg px-2 py-2 text-slate-400 transition-colors hover:text-slate-200"
                >
                  Esqueci a senha
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const readFirebaseError = (error: unknown) => {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: string }).code)
      : '';

  const messages: Record<string, string> = {
    'auth/invalid-email': 'E-mail inválido.',
    'auth/user-not-found': 'Usuário não encontrado.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/popup-closed-by-user': 'Login com Google cancelado.',
    'auth/operation-not-allowed': 'Método de login desativado no Firebase.',
  };

  return messages[code] || 'Não foi possível concluir. Tente novamente.';
};
