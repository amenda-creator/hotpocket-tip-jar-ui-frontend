import { useDispatch, useSelector } from 'react-redux';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import type { RootState } from '../../app/store';
import { hideSnackbar, type SnackbarSeverity } from '../../features/snackbar/snackbarSlice';

const ICONS: Record<SnackbarSeverity, typeof Info> = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
};

const COLORS: Record<SnackbarSeverity, string> = {
  success: 'bg-emerald-600',
  error: 'bg-rose-600',
  info: 'bg-indigo-600',
};

export default function Snackbar() {
  const dispatch = useDispatch();

  // Ensure severity is typed (not `any`) so it can be used to index typed Records.
  const open = useSelector((state: RootState) => state.snackbar.open);
  const message = useSelector((state: RootState) => state.snackbar.message);
  const severity = useSelector((state: RootState) => state.snackbar.severity) as SnackbarSeverity;

  if (!open) return null;

  const Icon = ICONS[severity];

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex max-w-[90vw] items-start gap-3 rounded-xl px-4 py-3 text-white shadow-lg ${COLORS[severity]}`}
      role="status"
      aria-live="polite"
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <span className="text-sm leading-relaxed">{message}</span>
      <button
        onClick={() => dispatch(hideSnackbar())}
        className="ml-1 rounded-md p-1 hover:bg-white/15"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
