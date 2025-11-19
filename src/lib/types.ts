export type FuelType = 'petrol' | 'diesel';

export interface Transaction {
  id: string;
  type: 'sale' | 'expense' | 'repayment' | 'stock';
  fuelType?: FuelType;
  quantity?: number;
  amount: number;
  isCredit: boolean;
  customerId?: string;
  customerName?: string;
  description?: string;
  timestamp: number;
}

export interface Customer {
  id: string;
  name: string;
  balance: number;
}
