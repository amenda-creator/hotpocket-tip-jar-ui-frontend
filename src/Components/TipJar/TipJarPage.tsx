import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { HandCoins, RefreshCw, ClipboardCopy, Check, History, Wallet, ArrowRight } from 'lucide-react';
import ApiService from '../../services/api-service';
import Loading from '../Shared/Loading';
import { showSnackbar } from '../../features/snackbar/snackbarSlice';
import type { ListTipsSuccess, TipRow, TipSuccess } from '../../types';

function shortKey(s: string, head = 10, tail = 6): string {
  if (!s) return '';
  if (s.length <= head + tail + 3) return s;
  return `${s.slice(0, head)}...${s.slice(-tail)}`;
}

export default function TipJarPage() {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [ownerAddress, setOwnerAddress] = useState<string>('');
  const [tipCount, setTipCount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<string>('0');

  const [amount, setAmount] = useState<string>('');
  const [memo, setMemo] = useState<string>('');
  const [sending, setSending] = useState(false);

  const [tipsResp, setTipsResp] = useState<ListTipsSuccess | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [reloadingTips, setReloadingTips] = useState(false);

  const [copied, setCopied] = useState(false);

  const tips: TipRow[] = useMemo(() => tipsResp?.tips ?? [], [tipsResp]);

  const loadHeader = async (): Promise<void> => {
    const api = ApiService.getInstance();
    const [owner, totals] = await Promise.all([api.getOwner(), api.getTotals()]);
    setOwnerAddress(owner.ownerAddress);
    setTipCount(totals.tipCount);
    setTotalAmount(totals.totalAmount);
  };

  const loadTips = async (p: number, ps: number): Promise<void> => {
    setReloadingTips(true);
    try {
      const res = await ApiService.getInstance().listTips(p, ps);
      setTipsResp(res);
    } finally {
      setReloadingTips(false);
    }
  };

  const reloadAll = async (): Promise<void> => {
    setLoading(true);
    try {
      await loadHeader();
      await loadTips(page, pageSize);
    } catch (e: unknown) {
      dispatch(
        showSnackbar({
          message: e instanceof Error ? e.message : 'Failed to load TipJar data.',
          severity: 'error',
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reloadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading) return;
    void loadTips(page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const copyOwner = async (): Promise<void> => {
    if (!ownerAddress) return;
    try {
      await navigator.clipboard.writeText(ownerAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 900);
      dispatch(showSnackbar({ message: 'Owner address copied.', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to copy.', severity: 'error' }));
    }
  };

  const onSendTip = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    const tipAmount = amount.trim();
    if (!tipAmount) {
      dispatch(showSnackbar({ message: 'Enter a tip amount.', severity: 'info' }));
      return;
    }

    setSending(true);
    try {
      const res: TipSuccess = await ApiService.getInstance().tip({
        amount: tipAmount,
        currency: 'XRP',
        memo: memo.trim() ? memo.trim() : undefined,
      });

      dispatch(
        showSnackbar({
          message: `Tip sent (id #${res.tipId}). Credited: ${res.credited} XRP`,
          severity: 'success',
        }),
      );

      setAmount('');
      setMemo('');

      await loadHeader();
      await loadTips(1, pageSize);
      setPage(1);
    } catch (err: unknown) {
      dispatch(
        showSnackbar({
          message: err instanceof Error ? err.message : 'Tip failed.',
          severity: 'error',
        }),
      );
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Loading text="Loading Tip Jar..." />;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      {/* Left: Tip card */}
      <div className="lg:col-span-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Send a Tip</h1>
              <p className="mt-1 text-sm text-gray-500">
                Tips are recorded on the contract. Optional XRPL forwarding may be enabled by the cluster.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void reloadAll()}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {/* Owner address */}
          <div className="mb-6 rounded-2xl bg-indigo-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  <Wallet className="h-4 w-4" />
                  Contract Owner
                </div>
                <div className="mt-1 font-mono text-sm text-gray-900">{ownerAddress || '—'}</div>
              </div>
              <button
                type="button"
                onClick={() => void copyOwner()}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50"
              >
                {copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Totals */}
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tip Count</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">{tipCount}</div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total Amount</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">{totalAmount}</div>
              <div className="text-xs text-gray-400">XRP (as recorded)</div>
            </div>
          </div>

          {/* Tip form */}
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => void onSendTip(e)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Tip amount (XRP)</label>
              <input
                value={amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                inputMode="decimal"
                placeholder="e.g. 1 or 0.25"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <p className="mt-1 text-xs text-gray-500">Positive number, up to 6 decimals (validated by the contract).</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Memo (optional)</label>
              <input
                value={memo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMemo(e.target.value)}
                placeholder="Say thanks..."
                maxLength={256}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <HandCoins className="h-4 w-4" />
              {sending ? 'Sending...' : 'Send Tip'}
              {!sending && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </div>

      {/* Right: Tip history */}
      <div className="lg:col-span-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <History className="h-5 w-5 text-indigo-600" />
                Recent Tips
              </h2>
              <p className="mt-1 text-sm text-gray-500">Latest tips recorded in the contract database.</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPageSize(Number(e.target.value))}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-50"
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>

              <button
                type="button"
                onClick={() => void loadTips(page, pageSize)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className={reloadingTips ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                Reload
              </button>
            </div>
          </div>

          {tips.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
              <p className="text-sm font-semibold text-gray-800">No tips yet</p>
              <p className="mt-1 text-sm text-gray-500">Be the first to send a tip.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-100">
              <div className="grid grid-cols-12 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <div className="col-span-2">ID</div>
                <div className="col-span-3">Tipper</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-3">Memo</div>
                <div className="col-span-2">Forwarded</div>
              </div>
              <div className="divide-y divide-gray-100">
                {tips.map((t: TipRow) => (
                  <div key={t.Id} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                    <div className="col-span-2 font-semibold text-gray-900">#{t.Id}</div>
                    <div className="col-span-3 font-mono text-xs text-gray-600" title={t.TipperPubKey}>
                      {shortKey(t.TipperPubKey)}
                    </div>
                    <div className="col-span-2 font-semibold text-gray-900">
                      {t.Amount} <span className="text-xs font-medium text-gray-500">{t.Currency}</span>
                    </div>
                    <div className="col-span-3 truncate text-gray-600" title={t.Memo ?? ''}>
                      {t.Memo ?? '—'}
                    </div>
                    <div className="col-span-2">
                      {t.Forwarded ? (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                          No
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Page <span className="font-semibold text-gray-900">{page}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p: number) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p: number) => p + 1)}
                disabled={(tipsResp?.tips ?? []).length < pageSize}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
