export enum PrizeType {
  EMPTY = 'EMPTY',
  POINT = 'POINT',
  CASH = 'CASH',
  VOUCHER = 'VOUCHER',
  PHYSICAL = 'PHYSICAL',
  FRAGMENT = 'FRAGMENT'
}

export enum Rarity {
  COMMON = 'bg-gray-500',
  UNCOMMON = 'bg-blue-500',
  RARE = 'bg-purple-600',
  LEGENDARY = 'bg-yellow-500'
}

export interface Prize {
  id: string;
  name: string;
  type: PrizeType;
  value: number; 
  probability: number; 
  image?: string;
  rarity: Rarity;
  description: string;
}

export interface User {
  id?: number; // Supabase ID (number based on DB definition)
  name: string;
  // class_name removed
  points: number; // Now mandatory and synced with DB
  fragment_500: number;
  fragment_free: number;
}

export interface DrawRecord {
  id: string;
  user_name: string;
  // user_class removed
  prize_name: string;
  prize_type: string;
  prize_value: number;
  is_redeemed: boolean;
  created_at: string;
}

// Supabase Database Types Helper
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number;
          name: string;
          points: number;
          fragment_500: number;
          fragment_free: number;
          created_at: string;
        };
        Insert: {
          name: string;
          points?: number;
          fragment_500?: number;
          fragment_free?: number;
        };
        Update: {
          points?: number;
          fragment_500?: number;
          fragment_free?: number;
        };
      };
      records: {
        Row: DrawRecord;
        Insert: Omit<DrawRecord, 'id' | 'created_at'>;
        Update: Partial<DrawRecord>;
      };
    };
  };
}
