// Data structure for the extracted report
export interface MoneyBreakdown {
    cash: number;
    electronic: number; // Cards, QR, Transfers (Physical store)
    deliveryApps: number; // Rappi, PedidosYa, etc.
    currentAccount: number; // Ventas en cuenta corriente
    other: number;
  }
  
  export interface DailyReport {
    id: string;
    date: string;
    shiftNumber: string; // Numero de cierre
    
    // Predeterminada (System Data)
    systemTotal: number;
    systemBreakdown: MoneyBreakdown;
  
    // Arqueo Real (Physical Count)
    realTotal: number;
    realBreakdown: MoneyBreakdown;
    
    expenses: number; // Gastos pagados en el dia
    
    // Calculated
    difference: number; // Real - System
    status: 'BALANCED' | 'SHORTAGE' | 'SURPLUS' | 'REVIEW_REQUIRED';
    
    warnings: string[]; // List of validation issues
    notes?: string;
  }
  
  export interface DashboardMetrics {
    totalSales: number;
    totalCash: number;
    totalElectronic: number;
    totalExpenses: number;
    netBalance: number;
  }
