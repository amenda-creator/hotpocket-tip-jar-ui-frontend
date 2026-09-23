import ContractService from './contract-service';
import type {
  GetOwnerSuccess,
  GetTotalsSuccess,
  ListTipsSuccess,
  TipInput,
  TipSuccess,
  GetClusterUnlSuccess,
  GetContractVersionSuccess,
  UpdateClusterConfigInput,
  UpdateClusterConfigSuccess,
  UpdateClusterDetailsInput,
  UpdateClusterDetailsSuccess,
} from '../types';

export default class ApiService {
  private static instance: ApiService;
  private readonly contract: ContractService;

  private constructor() {
    this.contract = ContractService.getInstance();
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // ---------------------------------------------------------------------------
  // TipJar
  // ---------------------------------------------------------------------------

  async getOwner(): Promise<GetOwnerSuccess> {
    return this.contract.submitContractReadRequest<GetOwnerSuccess>({
      Service: 'TipJar',
      Action: 'GetOwner',
    });
  }

  async getTotals(): Promise<GetTotalsSuccess> {
    return this.contract.submitContractReadRequest<GetTotalsSuccess>({
      Service: 'TipJar',
      Action: 'GetTotals',
    });
  }

  async listTips(page: number, pageSize: number): Promise<ListTipsSuccess> {
    return this.contract.submitContractReadRequest<ListTipsSuccess>({
      Service: 'TipJar',
      Action: 'ListTips',
      data: { page, pageSize },
    });
  }

  async tip(input: TipInput): Promise<TipSuccess> {
    return this.contract.submitInputToContract<TipSuccess>({
      Service: 'TipJar',
      Action: 'Tip',
      data: input,
    });
  }

  // ---------------------------------------------------------------------------
  // Cluster
  // ---------------------------------------------------------------------------

  async getClusterUnl(): Promise<GetClusterUnlSuccess> {
    return this.contract.submitContractReadRequest<GetClusterUnlSuccess>({
      Service: 'Cluster',
      Action: 'GetClusterUnl',
    });
  }

  async getContractVersion(): Promise<GetContractVersionSuccess> {
    return this.contract.submitContractReadRequest<GetContractVersionSuccess>({
      Service: 'Cluster',
      Action: 'GetContractVersion',
    });
  }

  async updateClusterConfig(input: UpdateClusterConfigInput): Promise<UpdateClusterConfigSuccess> {
    return this.contract.submitInputToContract<UpdateClusterConfigSuccess>({
      Service: 'Cluster',
      Action: 'UpdateClusterConfig',
      data: input,
    });
  }

  async updateClusterDetails(input: UpdateClusterDetailsInput): Promise<UpdateClusterDetailsSuccess> {
    return this.contract.submitInputToContract<UpdateClusterDetailsSuccess>({
      Service: 'Cluster',
      Action: 'UpdateClusterDetails',
      data: input,
    });
  }
}
