export interface Profile {
  id: string
  name: string
  currency: string
  created_at: string
}

export interface Person {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  person_id: string | null
  person?: Person
  merchant: string
  date: string
  total_amount: number
  currency: string
  notes: string
  receipt_url: string | null
  created_at: string
  items?: TransactionItem[]
}

export interface TransactionItem {
  id: string
  transaction_id: string
  category_id: string
  category?: Category
  description: string
  amount: number
  created_at: string
}

export interface OCRResult {
  merchant: string
  date: string
  total_amount: number
  items: {
    description: string
    amount: number
    category?: string
  }[]
}

export type PeriodType = 'daily' | 'monthly' | 'yearly'

export interface SpendingSummary {
  category_id: string
  category_name: string
  category_color: string
  category_icon: string
  total: number
  percentage: number
}

export interface PersonSpending {
  person_id: string
  person_name: string
  total: number
}
