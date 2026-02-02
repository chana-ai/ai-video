
  
  export interface DailyDetailFilters {
    date: string;
    apiId: string;
    pageNo: number;
    pageSize: number;
  }
  
  export interface DailyBillingDetailRecord {
    time?: string;
    changeType?: string;
    amount?: number;
    rechargeAmount?: number;
    bonusAmount?: number;
    apiId?: number | string;
    billingType?: string;
    projectId?: number;
    sceneId?: number;
    data?: unknown;
  }
  
  export interface DailyDetailState {
    records: DailyBillingDetailRecord[];
    pageNo: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }
  
  export interface DailyUsageParams {
    year: number;
    month: number;
  }
  
  export interface DailyUsageRecord {
    date?: string;
    totalConsumed?: number;
    rechargedAmount?: number;
    bonusAmount?: number;
  }
  
  export interface MonthlyUsageRecord {
    date?: string;
    year?: number;
    month?: number;
    day?: number;
    totalConsumed?: number;
    totalRecharged?: number;
    totalBounced?: number;
  }