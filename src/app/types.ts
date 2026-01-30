export interface MoneyBreakdown {
  cash: number;
  electronic: number;
  deliveryApps: number;
  currentAccount: number;
  other: number;
}

export interface DailyReport {
  id: string;
  date: string;
  shiftNumber: string;
  systemTotal: number;
  systemBreakdown: MoneyBreakdown;
  realTotal: number;
  realBreakdown: MoneyBreakdown;
  expenses: number;
  difference: number;
  // Agregamos 'REVIEW_REQUIRED' aquí:
  status: 'BALANCED' | 'SHORTAGE' | 'SURPLUS' | 'REVIEW_REQUIRED';
  warnings: string[];
}
