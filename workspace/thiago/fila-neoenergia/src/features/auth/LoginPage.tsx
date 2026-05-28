import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/shared/lib/supabase';
import { useAuthActions } from '@/shared/stores/authStore';
import { TabletLayout } from '@/shared/components/TabletLayout';
import { LOGO_SRC } from '@/assets/logo';

const PIN_LENGTH = 4;

export function LoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { login } = useAuthActions();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length < PIN_LENGTH) return;

    setLoading(true);
    setError('');

    try {
      const { data, error: rpcError } = await supabase.rpc('authenticate_operator', {
        p_pin: pin,
      });

      if (rpcError) throw rpcError;

      const result = data as { authenticated: boolean; operator?: { id: string; name: string } };
      if (!result?.authenticated || !result.operator) {
        setError('PIN inválido. Tente novamente.');
        setPin('');
        inputRef.current?.focus();
        return;
      }

      login(result.operator);
      navigate('/');
    } catch {
      setError('Erro ao conectar. Verifique sua conexão.');
      setPin('');
    } finally {
      setLoading(false);
    }
  }

  function handlePinChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, PIN_LENGTH);
    setPin(digits);
    setError('');
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

        {/* PIN Display */}
        <div className="flex gap-4" aria-hidden="true">
          {dots.map((i) => (
            <div
              key={i}
              className={`w-5 h-5 rounded-full transition-all duration-150 ${
                i < pin.length ? 'bg-blue-600 scale-110' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Hidden input for PIN */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-4">
          <label className="sr-only" htmlFor="pin-input">
            Digite seu PIN de operador
          </label>
          <input
            id="pin-input"
            ref={inputRef}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={PIN_LENGTH}
            value={pin}
            onChange={(e) => handlePinChange(e.target.value)}
            className="opacity-0 absolute w-0 h-0"
            autoComplete="off"
            aria-label="PIN de operador"
          />

          {/* Error message */}
          {error && (
            <p role="alert" className="text-red-600 text-base font-medium text-center">
              {error}
            </p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={pin.length < PIN_LENGTH || loading}
            className="w-full h-16 bg-blue-600 text-white text-xl font-bold rounded-2xl
                       active:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all duration-150 touch-manipulation"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>

        {/* Numpad (for tablets without physical keyboard) */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handlePinChange(pin + n)}
              disabled={loading}
              className="h-16 text-2xl font-semibold bg-white rounded-2xl shadow-sm
                         border border-gray-200 active:bg-gray-100 transition-colors
                         touch-manipulation disabled:opacity-40"
            >
              {n}
            </button>
          ))}
          {/* Empty cell */}
          <div />
          <button
            type="button"
            onClick={() => handlePinChange(pin + '0')}
            disabled={loading}
            className="h-16 text-2xl font-semibold bg-white rounded-2xl shadow-sm
                       border border-gray-200 active:bg-gray-100 transition-colors
                       touch-manipulation disabled:opacity-40"
          >
            0
          </button>
          {/* Backspace */}
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
