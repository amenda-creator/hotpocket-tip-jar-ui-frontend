import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Network, RefreshCw, ShieldPlus, ShieldMinus, FileJson } from 'lucide-react';
import ApiService from '../../services/api-service';
import Loading from '../Shared/Loading';
import { showSnackbar } from '../../features/snackbar/snackbarSlice';
import type { ClusterDetailItem } from '../../types';

export default function ClusterPage() {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [unl, setUnl] = useState<string[]>([]);
  const [version, setVersion] = useState<number | null>(null);

  const [pubKey, setPubKey] = useState<string>('');
  const [updatingUnl, setUpdatingUnl] = useState(false);

  const [clusterDetailsRaw, setClusterDetailsRaw] = useState<string>(
    JSON.stringify(
      [
        { domain: 'node-a.example.com', peer_port: 22860, pubkey: 'pubkey-a' },
        { domain: 'node-b.example.com', peer_port: 22860, pubkey: 'pubkey-b' },
      ],
      null,
      2,
    ),
  );
  const [updatingPeers, setUpdatingPeers] = useState(false);

  const parsedClusterDetails: ClusterDetailItem[] | null = useMemo(() => {
    try {
      const obj = JSON.parse(clusterDetailsRaw) as unknown;
      if (!Array.isArray(obj)) return null;
      return obj as ClusterDetailItem[];
    } catch {
      return null;
    }
  }, [clusterDetailsRaw]);

  const load = async (): Promise<void> => {
    setLoading(true);
    try {
      const api = ApiService.getInstance();
      const [unlRes, verRes] = await Promise.all([api.getClusterUnl(), api.getContractVersion()]);
      setUnl(unlRes.unl ?? []);
      setVersion(verRes.version);
    } catch (e: unknown) {
      dispatch(
        showSnackbar({
          message: e instanceof Error ? e.message : 'Failed to load cluster info.',
          severity: 'error',
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addToUnl = async (): Promise<void> => {
    const k = pubKey.trim();
    if (!k) {
      dispatch(showSnackbar({ message: 'Enter a public key.', severity: 'info' }));
      return;
    }
    setUpdatingUnl(true);
    try {
      await ApiService.getInstance().updateClusterConfig({ action: 'add', publicKey: k });
      dispatch(showSnackbar({ message: 'UNL updated (add).', severity: 'success' }));
      setPubKey('');
      await load();
    } catch (e: unknown) {
      dispatch(showSnackbar({ message: e instanceof Error ? e.message : 'Update failed.', severity: 'error' }));
    } finally {
      setUpdatingUnl(false);
    }
  };

  const removeFromUnl = async (): Promise<void> => {
    const k = pubKey.trim();
    if (!k) {
      dispatch(showSnackbar({ message: 'Enter a public key.', severity: 'info' }));
      return;
    }
    setUpdatingUnl(true);
    try {
      await ApiService.getInstance().updateClusterConfig({ action: 'remove', publicKey: k });
      dispatch(showSnackbar({ message: 'UNL updated (remove).', severity: 'success' }));
      setPubKey('');
      await load();
    } catch (e: unknown) {
      dispatch(showSnackbar({ message: e instanceof Error ? e.message : 'Update failed.', severity: 'error' }));
    } finally {
      setUpdatingUnl(false);
    }
  };

  const updatePeers = async (): Promise<void> => {
    if (!parsedClusterDetails || parsedClusterDetails.length === 0) {
      dispatch(showSnackbar({ message: 'clusterDetails must be valid JSON array.', severity: 'error' }));
      return;
    }

    setUpdatingPeers(true);
    try {
      const res = await ApiService.getInstance().updateClusterDetails({ clusterDetails: parsedClusterDetails });
      dispatch(showSnackbar({ message: `Peers updated (${res.peers.length}).`, severity: 'success' }));
    } catch (e: unknown) {
      dispatch(showSnackbar({ message: e instanceof Error ? e.message : 'Update failed.', severity: 'error' }));
    } finally {
      setUpdatingPeers(false);
    }
  };

  if (loading) return <Loading text="Loading cluster..." />;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <Network className="h-6 w-6 text-indigo-600" />
              Cluster
            </h1>
            <p className="mt-1 text-sm text-gray-500">Basic cluster inspection and configuration.</p>
          </div>

          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Contract Version</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{version ?? '—'}</div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">UNL Nodes</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{unl.length}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <div className="text-sm font-semibold text-gray-800">Current UNL</div>
          {unl.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No nodes returned.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {(unl ?? []).map((k: string) => (
                <li key={k} className="rounded-xl bg-white px-3 py-2 font-mono text-xs text-gray-700">
                  {k}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6">
          <div className="mb-2 text-sm font-semibold text-gray-800">Update UNL</div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={pubKey}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPubKey(e.target.value)}
              placeholder="Node public key"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void addToUnl()}
                disabled={updatingUnl}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShieldPlus className="h-4 w-4" />
                Add
              </button>
              <button
                type="button"
                onClick={() => void removeFromUnl()}
                disabled={updatingUnl}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShieldMinus className="h-4 w-4" />
                Remove
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">These actions call the contract's Cluster.UpdateClusterConfig.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-gray-900">
          <FileJson className="h-5 w-5 text-indigo-600" />
          Update Cluster Peers
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Sends <span className="font-mono text-xs">clusterDetails</span> array to Cluster.UpdateClusterDetails.
        </p>

        <textarea
          value={clusterDetailsRaw}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setClusterDetailsRaw(e.target.value)}
          rows={14}
          className="w-full rounded-2xl border border-gray-200 bg-white p-4 font-mono text-xs text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            JSON status:{' '}
            {parsedClusterDetails ? (
              <span className="font-semibold text-emerald-700">valid</span>
            ) : (
              <span className="font-semibold text-rose-700">invalid</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => void updatePeers()}
            disabled={updatingPeers || !parsedClusterDetails}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updatingPeers ? 'Updating...' : 'Update Peers'}
          </button>
        </div>
      </div>
    </div>
  );
}
