import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Updated database type definitions to match your actual schema
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
          id: number; // int8 primary key
          charity_address: string | null; // varchar
          created_at: string; // timestamp
          name: string | null; // text
          description: string | null; // text
          website_url: string | null; // varchar
          logo_url: string | null; // varchar
          contact_email: string | null; // varchar
        };
        Insert: {
          id?: number;
          charity_address?: string | null;
          created_at?: string;
          name?: string | null;
          description?: string | null;
          website_url?: string | null;
          logo_url?: string | null;
          contact_email?: string | null;
        };
        Update: {
          id?: number;
          charity_address?: string | null;
          created_at?: string;
          name?: string | null;
          description?: string | null;
          website_url?: string | null;
          logo_url?: string | null;
          contact_email?: string | null;
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
