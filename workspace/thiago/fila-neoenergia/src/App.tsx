import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { LoginPage } from '@/features/auth/LoginPage';
import { AuthGuard } from '@/features/auth/AuthGuard';
import { OperatorPanel } from '@/features/queue/OperatorPanel';
import { RegistrationPage } from '@/features/registration/RegistrationPage';
import { useGetOrCreateQueue } from '@/features/queue/hooks/useQueueData';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function RegistrationPageWrapper() {
  const { data: queue } = useGetOrCreateQueue();
  if (!queue) return <div className="flex-1 flex items-center justify-center text-gray-400">Carregando...</div>;
  return <RegistrationPage queueId={queue.id} />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <AuthGuard>
            <OperatorPanel />
          </AuthGuard>
        }
      />
      <Route
        path="/register"
        element={
          <AuthGuard>
            <RegistrationPageWrapper />
          </AuthGuard>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            style: { fontSize: '1rem' },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
