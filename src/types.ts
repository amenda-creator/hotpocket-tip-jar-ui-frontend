// ---------------------------------------------------------------------------
// HotPocket message protocol (matches contract controller)
// ---------------------------------------------------------------------------

export interface ContractMessage {
  Service: string;
  Action: string;
  data?: unknown;
}

export interface ContractErrorObject {
  code?: number;
  message?: string;
}

export type ContractError = string | ContractErrorObject;

export interface ContractResponse<T = unknown> {
  success?: T;
  error?: ContractError;
  promiseId?: string;
}

// ---------------------------------------------------------------------------
// TipJar domain (mirrors DB schema + service return shapes)
// ---------------------------------------------------------------------------

export interface TipRow {
  Id: number;
  TipperPubKey: string;
  Amount: string;
  Currency: string;
  Memo: string | null;
  CreatedOn: string | null;
  Forwarded: number;
  ForwardTxHash: string;
}

export interface OwnerTotals {
  ownerAddress: string;
  totalCredits: string;
}

export interface GetOwnerSuccess {
  ownerAddress: string;
}

export interface GetTotalsSuccess {
  owner: OwnerTotals;
  tipCount: number;
  totalAmount: string;
}

export interface ListTipsSuccess {
  page: number;
  pageSize: number;
  tips: TipRow[];
}

export interface TipInput {
  amount: string;
  currency?: string;
  memo?: string;
}

export interface TipSuccess {
  tipId: number;
  ownerAddress: string;
  credited: string;
  forwardAttempted: boolean;
  forwardResult?: unknown;
}

// ---------------------------------------------------------------------------
// Cluster domain (mirrors ClusterManagement.Service)
// ---------------------------------------------------------------------------

export interface GetClusterUnlSuccess {
  unl: string[];
}

export interface GetContractVersionSuccess {
  version: number;
}

export interface UpdateClusterConfigInput {
  action: 'add' | 'remove';
  publicKey: string;
}

export interface UpdateClusterConfigSuccess {
  success: unknown;
}

export interface ClusterDetailItem {
  domain?: string;
  peer_port?: number;
  pubkey?: string;
}

export interface UpdateClusterDetailsInput {
  clusterDetails: ClusterDetailItem[];
}

export interface UpdateClusterDetailsSuccess {
  peers: string[];
}
