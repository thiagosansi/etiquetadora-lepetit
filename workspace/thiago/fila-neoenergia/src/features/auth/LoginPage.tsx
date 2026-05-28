import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/shared/lib/supabase';
import { useAuthActions } from '@/shared/stores/authStore';
import { TabletLayout } from '@/shared/components/TabletLayout';
import { LOGO_SRC } from '@/assets/logo';

const PIN_LENGTH = 4;

export function LoginPage() {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { login } = useAuthActions();

  const nameOk = name.trim().length >= 2;

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nameOk || pin.length < PIN_LENGTH) return;

    setLoading(true);
    setError('');

    try {
      const { data, error: rpcError } = await supabase.rpc('authenticate_operator', {
        p_pin: pin,
      });

      if (rpcError) throw rpcError;

      const result = data as { authenticated: boolean; operator?: { id: string; name: string } };
      if (!result?.authenticated || !result.operator) {
        setError('Senha inválida. Tente novamente.');
        setPin('');
        return;
      }

      // Use the name the attendant typed, not the DB name
      login({ ...result.operator, name: name.trim() });
      navigate('/');
    } catch {
      setError('Erro ao conectar. Verifique sua conexão.');
      setPin('');
    } finally {
      setLoading(false);
    }
  }

  function handlePinChange(value: string) {
    if (!nameOk) return;
    const digits = value.replace(/\D/g, '').slice(0, PIN_LENGTH);
    setPin(digits);
    setError('');
  }

  function handleDigit(n: number) {
    if (!nameOk || pin.length >= PIN_LENGTH || loading) return;
    handlePinChange(pin + n);
  }

  const dots = Array.from({ length: PIN_LENGTH }, (_, i) => i);

  return (
    <TabletLayout className="items-center justify-center">
      <div className="w-full max-w-sm px-6 py-12 flex flex-col items-center gap-8">
        {/* Logo / Event */}
        <div className="text-center flex flex-col items-center gap-3">
          <img src={LOGO_SRC} alt="NEOENERGIA" className="w-56 object-contain" />
          <div className="text-lg text-gray-500 font-medium">BAHIA FARM 2026</div>
          <div className="text-sm text-gray-400">Atendimento ao Cliente</div>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-6">
          {/* Name field */}
          <div className="w-full flex flex-col gap-1.5">
            <label htmlFor="name-input" className="text-sm font-medium text-gray-600">
              Seu nome
            </label>
            <input
              id="name-input"
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); setPin(''); }}
              placeholder="Digite seu nome"
              autoComplete="off"
              className="w-full h-14 px-4 text-lg border border-gray-300 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* PIN Display */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Senha</span>
            <div className="flex gap-4" aria-hidden="true">
              {dots.map((i) => (
                <div
                  key={i}
                  className={`w-5 h-5 rounded-full transition-all duration-150 ${
                    !nameOk
                      ? 'bg-gray-200'
                      : i < pin.length
                        ? 'bg-blue-600 scale-110'
                        : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Hidden input for PIN (keyboard fallback) */}
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={PIN_LENGTH}
            value={pin}
            onChange={(e) => handlePinChange(e.target.value)}
            className="opacity-0 absolute w-0 h-0"
            aria-label="Senha numérica"
            autoComplete="off"
            disabled={!nameOk}
          />

          {/* Error message */}
          {error && (
            <p role="alert" className="text-red-600 text-base font-medium text-center -mt-2">
              {error}
            </p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={!nameOk || pin.length < PIN_LENGTH || loading}
            className="w-full h-16 bg-blue-600 text-white text-xl font-bold rounded-2xl
                       active:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all duration-150 touch-manipulation"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>

        {/* Numpad */}
        <div className={`grid grid-cols-3 gap-3 w-full transition-opacity ${!nameOk ? 'opacity-30 pointer-events-none' : ''}`}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleDigit(n)}
              disabled={loading}
              className="h-16 text-2xl font-semibold bg-white rounded-2xl shadow-sm
                         border border-gray-200 active:bg-gray-100 transition-colors
                         touch-manipulation disabled:opacity-40"
            >
              {n}
            </button>
          ))}
          <div />
          <button
            type="button"
            onClick={() => handleDigit(0)}
            disabled={loading}
            className="h-16 text-2xl font-semibold bg-white rounded-2xl shadow-sm
                       border border-gray-200 active:bg-gray-100 transition-colors
                       touch-manipulation disabled:opacity-40"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => setPin((p) => p.slice(0, -1))}
            disabled={loading || pin.length === 0}
            className="h-16 text-2xl font-semibold bg-white rounded-2xl shadow-sm
                       border border-gray-200 active:bg-gray-100 transition-colors
                       touch-manipulation disabled:opacity-40"
            aria-label="Apagar"
          >
            ⌫
          </button>
        </div>
      </div>
    </TabletLayout>
  );
}
