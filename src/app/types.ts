export interface DailyReport {
  id: string;
  date: string;
  shiftNumber: string;
  systemTotal: number;
  systemBreakdown: {
    cash: number;
    electronic: number;
    deliveryApps: number;
    currentAccount: number;
    other: number;
  };
  realTotal: number;
  realBreakdown: {
    cash: number;
    electronic: number;
    deliveryApps: number;
    currentAccount: number;
    other: number;
  };
  expenses: number;
  difference: number;
  status: 'BALANCED' | 'SHORTAGE' | 'SURPLUS';
  warnings: string[];
}
