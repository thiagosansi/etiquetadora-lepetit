import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/shared/lib/supabase';
import { formatPhoneE164 } from '@/shared/lib/utils';
import { TabletLayout } from '@/shared/components/TabletLayout';
import type { RegistrationFormData } from '@/shared/types';

const schema = z.object({
  customer_name: z
    .string()
    .min(3, 'Nome deve ter ao menos 3 caracteres')
    .max(100, 'Nome muito longo'),
  phone: z
    .string()
    .regex(/^\d{10,11}$/, 'Telefone inválido — use DDD + número (ex: 71999887766)')
    .transform((v) => formatPhoneE164(v)),
  scheduled_time: z.string().min(1, 'Horário é obrigatório'),
});

type FormValues = z.infer<typeof schema>;

interface RegistrationPageProps {
  queueId: string;
}

export function RegistrationPage({ queueId }: RegistrationPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const { data: entry, error } = await supabase.rpc('register_customer', {
        p_queue_id: queueId,
        p_name: data.customer_name,
        p_phone: data.phone,
        p_scheduled_time: data.scheduled_time,
      });

      if (error) throw error;
      return entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', queueId] });
      toast.success('Cliente cadastrado na fila!');
      reset();
      navigate('/');
    },
    onError: (err: Error) => {
      toast.error(`Erro ao cadastrar: ${err.message}`);
    },
  });

  return (
    <TabletLayout>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-4 shadow-sm">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="h-12 px-4 text-gray-600 font-medium rounded-xl active:bg-gray-100 transition-colors touch-manipulation flex items-center gap-2"
        >
          ← Voltar
        </button>
        <h1 className="text-xl font-bold text-gray-900">Cadastrar Cliente</h1>
      </header>

      {/* Form */}
      <main className="flex-1 p-6">
        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data as FormValues))}
          className="max-w-lg mx-auto flex flex-col gap-6"
          noValidate
        >
          {/* Name */}
          <div className="flex flex-col gap-2">
            <label htmlFor="customer_name" className="text-base font-semibold text-gray-700">
              Nome completo <span className="text-red-500">*</span>
            </label>
            <input
              id="customer_name"
              type="text"
              autoComplete="name"
              autoFocus
              {...register('customer_name')}
              className="h-14 px-4 text-lg border-2 border-gray-200 rounded-xl
                         focus:border-blue-500 focus:outline-none transition-colors
                         disabled:opacity-50"
              placeholder="Ex: João Silva"
              disabled={mutation.isPending}
            />
            {errors.customer_name && (
              <p role="alert" className="text-red-600 text-sm">
                {errors.customer_name.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-2">
            <label htmlFor="phone" className="text-base font-semibold text-gray-700">
              Telefone (WhatsApp/SMS) <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              {...register('phone')}
              className="h-14 px-4 text-lg border-2 border-gray-200 rounded-xl
                         focus:border-blue-500 focus:outline-none transition-colors
                         disabled:opacity-50"
              placeholder="71999887766"
              disabled={mutation.isPending}
            />
            {errors.phone && (
              <p role="alert" className="text-red-600 text-sm">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Time */}
          <div className="flex flex-col gap-2">
            <label htmlFor="scheduled_time" className="text-base font-semibold text-gray-700">
              Horário <span className="text-red-500">*</span>
            </label>
            <input
              id="scheduled_time"
              type="time"
              {...register('scheduled_time')}
              className="h-14 px-4 text-lg border-2 border-gray-200 rounded-xl
                         focus:border-blue-500 focus:outline-none transition-colors
                         disabled:opacity-50"
              disabled={mutation.isPending}
            />
            {errors.scheduled_time && (
              <p role="alert" className="text-red-600 text-sm">
                {errors.scheduled_time.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="h-16 bg-blue-600 text-white text-xl font-bold rounded-2xl
                         active:bg-blue-700 disabled:opacity-40 transition-colors
                         touch-manipulation"
            >
              {mutation.isPending ? 'Cadastrando...' : 'Confirmar Cadastro'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              disabled={mutation.isPending}
              className="h-14 bg-gray-100 text-gray-700 text-lg font-medium rounded-xl
                         active:bg-gray-200 disabled:opacity-40 transition-colors
                         touch-manipulation"
            >
              Cancelar
            </button>
          </div>
        </form>
      </main>
    </TabletLayout>
  );
}
