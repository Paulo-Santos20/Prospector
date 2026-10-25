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
    <div className="min-h-screen bg-background text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-black text-white shadow-lg">
            P
          </div>
          <div>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter">Prospector AI</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.25em] font-bold">
              Inteligência de prospecção
            </p>
          </div>
        </div>

        <div className="bg-surface border border-slate-700 rounded-[2rem] p-8 shadow-2xl">
          {!configured ? (
            <div className="space-y-3 text-sm text-slate-300">
              <h2 className="text-lg font-black text-white">Configure o Firebase</h2>
              <p className="text-slate-400">
                Crie <code className="text-primary">client/.env</code> a partir de{' '}
                <code className="text-primary">client/.env.example</code> com as chaves do app web:
              </p>
              <pre className="bg-background border border-slate-700 rounded-xl p-4 text-[11px] text-slate-400 overflow-auto">
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
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full bg-background border border-slate-600 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-primary"
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
                      className="w-full bg-background border border-slate-600 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Mínimo de 6 caracteres"
                    />
                  </div>
                </label>

                {error && <p className="text-xs text-red-400">{error}</p>}
                {message && <p className="text-xs text-emerald-400">{message}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary hover:bg-blue-600 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-tight"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Entrar
                </button>
              </form>

              <div className="flex items-center justify-end mt-5 text-[11px] font-bold">
                <button onClick={() => void handleReset()} className="text-slate-500 hover:text-slate-300">
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
