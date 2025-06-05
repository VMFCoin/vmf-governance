import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simplified database type definitions
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          wallet_address: string;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      charities: {
        Row: {
          id: string;
          name: string;
          website: string;
          logo_url: string;
          mission: string;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          website: string;
          logo_url: string;
          mission: string;
          description: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          website?: string;
          logo_url?: string;
          mission?: string;
          description?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type CreateUserProfile =
  Database['public']['Tables']['user_profiles']['Insert'];
export type UpdateUserProfile =
  Database['public']['Tables']['user_profiles']['Update'];

export type DatabaseCharity = Database['public']['Tables']['charities']['Row'];
export type CreateCharity = Database['public']['Tables']['charities']['Insert'];
export type UpdateCharity = Database['public']['Tables']['charities']['Update'];
