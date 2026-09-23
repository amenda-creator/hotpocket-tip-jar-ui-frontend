import { useEffect, useState } from 'react';
import ContractService from './services/contract-service';
import AppRoutes from './routes/routes';
import Snackbar from './Components/Shared/Snackbar';
import Loading from './Components/Shared/Loading';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await ContractService.getInstance().init();
        setReady(true);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to initialize the contract client.');
      }
    };
    void init();
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md rounded-xl bg-white p-6 text-center shadow-lg">
          <h1 className="text-xl font-bold text-rose-600">Initialization failed</h1>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <p className="mt-3 text-xs text-gray-500">
            Tip: set <span className="font-mono">VITE_MOCK_MODE=true</span> to run without servers.
          </p>
        </div>
      </div>
    );
  }

  if (!ready) return <Loading text="Connecting to contract..." />;

  return (
    <>
      <AppRoutes />
      <Snackbar />
    </>
  );
}
