import type { ContractMessage, ContractResponse, TipRow } from '../types';

const HotPocket = (window as any).HotPocket;

interface PendingPromise {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

function isPlaceholderUrl(u: string): boolean {
  const s = u.toLowerCase();
  return (
    s.includes('example') ||
    s.includes('your-server') ||
    s.includes('placeholder') ||
    s.includes('changeme')
  );
}

function normalizeErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err);
  } catch {
    return 'Unknown error';
  }
}

export default class ContractService {
  private static instance: ContractService;

  private client: any = null;
  private keyPair: unknown = null;
  private connected = false;
  private mockMode = false;
  private readonly promiseMap = new Map<string, PendingPromise>();

  private readonly servers: string[] = (import.meta.env.VITE_CONTRACT_URLS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // --- Mock state (TipJar) ---
  private mockOwnerAddress = 'rOwnerAddressExample123456789';
  private mockTips: TipRow[] = [];
  private mockNextTipId = 1;

  private constructor() {}

  static getInstance(): ContractService {
    if (!ContractService.instance) {
      ContractService.instance = new ContractService();
    }
    return ContractService.instance;
  }

  async init(): Promise<boolean> {
    // Decide mock mode first (must not touch HotPocket globals if mocking).
    const envMock = import.meta.env.VITE_MOCK_MODE === 'true';
    const noServers = this.servers.length === 0;
    const placeholder = this.servers.some((s) => isPlaceholderUrl(s));
    const missingHotPocket = !HotPocket;

    if (envMock || noServers || placeholder || missingHotPocket) {
      this.mockMode = true;
      console.warn(
        '[TipJar] Running in MOCK MODE. To connect to a real contract set VITE_MOCK_MODE=false and configure VITE_CONTRACT_URLS with valid wss:// URLs.',
      );
      return true;
    }

    if (!this.keyPair) this.keyPair = await HotPocket.generateKeys();
    if (!this.client) {
      this.client = await HotPocket.createClient(this.servers, this.keyPair);
    }

    if (!this.client || typeof this.client.connect !== 'function') {
      throw new Error(
        'Failed to initialize HotPocket client. Check VITE_CONTRACT_URLS or set VITE_MOCK_MODE=true for offline development.',
      );
    }

    this.registerEvents();

    if (!this.connected) {
      const ok = await this.client.connect();
      if (!ok) {
        throw new Error(
          'HotPocket connection failed. Verify your contract nodes are reachable via wss://, or set VITE_MOCK_MODE=true.',
        );
      }
      this.connected = true;
    }

    return true;
  }

  private registerEvents(): void {
    this.client.on(HotPocket.events.disconnect, () => {
      this.connected = false;
      window.location.reload();
    });

    this.client.on(HotPocket.events.connectionChange, (server: string, action: string) => {
      console.log(`HotPocket ${action}: ${server}`);
    });

    this.client.on(HotPocket.events.contractOutput, (r: { outputs: unknown[] }) => {
      r.outputs.forEach((output: unknown) => {
        const parsed = this.deserialize<ContractResponse>(output);
        const pId = parsed.promiseId;
        if (!pId) return;
        const pending = this.promiseMap.get(pId);
        if (!pending) return;

        if (parsed.error) pending.reject(parsed.error);
        else pending.resolve(parsed.success);

        this.promiseMap.delete(pId);
      });
    });

    this.client.on(HotPocket.events.healthEvent, (ev: unknown) => console.log(ev));
  }

  async submitContractReadRequest<T = unknown>(message: ContractMessage): Promise<T> {
    if (this.mockMode) return this.mockResponse<T>(message);

    const output = await this.client.submitContractReadRequest(this.serialize(message));
    const parsed = this.deserialize<ContractResponse<T>>(output);

    if (parsed.error) {
      throw new Error(this.formatContractError(parsed.error));
    }

    return (parsed.success ?? null) as T;
  }

  async submitInputToContract<T = unknown>(message: ContractMessage): Promise<T> {
    if (this.mockMode) return this.mockResponse<T>(message);

    const promiseId = this.getUniqueId();

    const result = new Promise<T>((resolve, reject) => {
      this.promiseMap.set(promiseId, { resolve: resolve as (value: any) => void, reject });
    });

    const input = await this.client.submitContractInput(this.serialize({ promiseId, ...message }));
    const status = await input.submissionStatus;

    if (status.status !== 'accepted') {
      this.promiseMap.delete(promiseId);
      throw new Error(`Ledger rejection: ${status.reason ?? 'Unknown reason'}`);
    }

    return result;
  }

  private serialize(payload: unknown): string {
    return JSON.stringify(payload);
  }

  private deserialize<T>(output: unknown): T {
    if (typeof output === 'string') {
      try {
        return JSON.parse(output) as T;
      } catch {
        return output as T;
      }
    }
    return output as T;
  }

  private getUniqueId(): string {
    const bytes = new Uint8Array(10);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes).join('');
  }

  private formatContractError(err: unknown): string {
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object') {
      const msg = (err as { message?: unknown }).message;
      if (typeof msg === 'string' && msg.trim()) return msg;
      return normalizeErrorMessage(err);
    }
    return 'Unknown contract error';
  }

  // ---------------------------------------------------------------------------
  // Mock responses for offline dev
  // ---------------------------------------------------------------------------

  private async mockResponse<T>(message: ContractMessage): Promise<T> {
    await new Promise((r) => setTimeout(r, 160));
    console.log('[MOCK] Contract call received:', message);

    if (message.Service === 'TipJar' && message.Action === 'GetOwner') {
      return { ownerAddress: this.mockOwnerAddress } as unknown as T;
    }

    if (message.Service === 'TipJar' && message.Action === 'GetTotals') {
      const tipCount = this.mockTips.length;
      const totalAmountNum = this.mockTips.reduce((sum: number, t: TipRow) => sum + Number(t.Amount || '0'), 0);
      return {
        owner: { ownerAddress: this.mockOwnerAddress, totalCredits: totalAmountNum.toFixed(6) },
        tipCount,
        totalAmount: totalAmountNum.toFixed(6),
      } as unknown as T;
    }

    if (message.Service === 'TipJar' && message.Action === 'ListTips') {
      const d = (message.data ?? {}) as { page?: number | string; pageSize?: number | string };
      const page = Math.max(1, Number(d.page ?? 1) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(d.pageSize ?? 20) || 20));
      const offset = (page - 1) * pageSize;
      const tips = [...this.mockTips].sort((a: TipRow, b: TipRow) => b.Id - a.Id).slice(offset, offset + pageSize);
      return { page, pageSize, tips } as unknown as T;
    }

    if (message.Service === 'TipJar' && message.Action === 'Tip') {
      const d = (message.data ?? {}) as { amount?: unknown; currency?: unknown; memo?: unknown };
      const amount = String(d.amount ?? '').trim();
      const currency = String(d.currency ?? 'XRP').trim() || 'XRP';
      const memo = d.memo ? String(d.memo).slice(0, 256) : '';

      if (!/^\d+(\.\d{1,6})?$/.test(amount) || Number(amount) <= 0) {
        throw new Error('Invalid amount. Expected a positive number (up to 6 decimals).');
      }

      const tipId = this.mockNextTipId++;
      const row: TipRow = {
        Id: tipId,
        TipperPubKey: 'mock-user-pubkey',
        Amount: amount,
        Currency: currency,
        Memo: memo || null,
        CreatedOn: new Date().toISOString(),
        Forwarded: 0,
        ForwardTxHash: '',
      };

      this.mockTips.push(row);

      return {
        tipId,
        ownerAddress: this.mockOwnerAddress,
        credited: amount,
        forwardAttempted: false,
      } as unknown as T;
    }

    if (message.Service === 'Cluster' && message.Action === 'GetClusterUnl') {
      return { unl: ['mock-node-pubkey-1', 'mock-node-pubkey-2'] } as unknown as T;
    }

    if (message.Service === 'Cluster' && message.Action === 'GetContractVersion') {
      return { version: 1 } as unknown as T;
    }

    if (message.Service === 'Cluster' && message.Action === 'UpdateClusterConfig') {
      return { success: true } as unknown as T;
    }

    if (message.Service === 'Cluster' && message.Action === 'UpdateClusterDetails') {
      return { peers: ['node-a.example.com:22860', 'node-b.example.com:22860'] } as unknown as T;
    }

    throw new Error(`Mock handler missing for ${message.Service}.${message.Action}`);
  }
}
