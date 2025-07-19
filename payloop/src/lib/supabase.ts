import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types
export interface Database {
  public: {
    Tables: {
      landlords: {
        Row: {
          id: string;
          business_name: string;
          owner_name: string;
          phone: string;
          email: string;
          subscription_plan: 'trial' | 'starter' | 'growth' | 'enterprise';
          subscription_status: 'active' | 'suspended' | 'cancelled';
          trial_ends_at: string | null;
          subscription_ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_name: string;
          owner_name: string;
          phone: string;
          email: string;
          subscription_plan?: 'trial' | 'starter' | 'growth' | 'enterprise';
          subscription_status?: 'active' | 'suspended' | 'cancelled';
          trial_ends_at?: string | null;
          subscription_ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_name?: string;
          owner_name?: string;
          phone?: string;
          email?: string;
          subscription_plan?: 'trial' | 'starter' | 'growth' | 'enterprise';
          subscription_status?: 'active' | 'suspended' | 'cancelled';
          trial_ends_at?: string | null;
          subscription_ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      properties: {
        Row: {
          id: string;
          landlord_id: string;
          name: string;
          location: string;
          total_units: number;
          property_type: 'apartment' | 'house' | 'commercial';
          occupied_units: number;
          monthly_revenue: number;
          outstanding_payments: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          landlord_id: string;
          name: string;
          location: string;
          total_units: number;
          property_type: 'apartment' | 'house' | 'commercial';
          occupied_units?: number;
          monthly_revenue?: number;
          outstanding_payments?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          landlord_id?: string;
          name?: string;
          location?: string;
          total_units?: number;
          property_type?: 'apartment' | 'house' | 'commercial';
          occupied_units?: number;
          monthly_revenue?: number;
          outstanding_payments?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      tenants: {
        Row: {
          id: string;
          landlord_id: string;
          property_id: string;
          unit_number: string;
          name: string;
          phone: string;
          email: string | null;
          rent_amount: number;
          due_date: number;
          move_in_date: string;
          status: 'active' | 'inactive' | 'suspended' | 'defaulter';
          last_payment_date: string | null;
          outstanding_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          landlord_id: string;
          property_id: string;
          unit_number: string;
          name: string;
          phone: string;
          email?: string | null;
          rent_amount: number;
          due_date: number;
          move_in_date: string;
          status?: 'active' | 'inactive' | 'suspended' | 'defaulter';
          last_payment_date?: string | null;
          outstanding_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          landlord_id?: string;
          property_id?: string;
          unit_number?: string;
          name?: string;
          phone?: string;
          email?: string | null;
          rent_amount?: number;
          due_date?: number;
          move_in_date?: string;
          status?: 'active' | 'inactive' | 'suspended' | 'defaulter';
          last_payment_date?: string | null;
          outstanding_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          tenant_id: string;
          landlord_id: string;
          amount: number;
          payment_date: string;
          method: 'mpesa' | 'bank' | 'cash';
          reference: string | null;
          status: 'paid' | 'pending' | 'failed';
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          landlord_id: string;
          amount: number;
          payment_date?: string;
          method?: 'mpesa' | 'bank' | 'cash';
          reference?: string | null;
          status?: 'paid' | 'pending' | 'failed';
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          landlord_id?: string;
          amount?: number;
          payment_date?: string;
          method?: 'mpesa' | 'bank' | 'cash';
          reference?: string | null;
          status?: 'paid' | 'pending' | 'failed';
          created_at?: string;
        };
      };
      payment_confirmations: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          phone: string;
          plan_selected: 'starter' | 'growth' | 'enterprise';
          transaction_code: string;
          status: 'pending' | 'approved' | 'rejected';
          timestamp: string;
          approved_at: string | null;
          rejected_at: string | null;
          admin_notes: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          phone: string;
          plan_selected: 'starter' | 'growth' | 'enterprise';
          transaction_code: string;
          status?: 'pending' | 'approved' | 'rejected';
          timestamp?: string;
          approved_at?: string | null;
          rejected_at?: string | null;
          admin_notes?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          phone?: string;
          plan_selected?: 'starter' | 'growth' | 'enterprise';
          transaction_code?: string;
          status?: 'pending' | 'approved' | 'rejected';
          timestamp?: string;
          approved_at?: string | null;
          rejected_at?: string | null;
          admin_notes?: string | null;
        };
      };
      sms_logs: {
        Row: {
          id: string;
          tenant_id: string | null;
          landlord_id: string;
          recipient_phone: string;
          recipient_name: string;
          message: string;
          sms_type: string;
          status: string;
          message_id: string | null;
          cost: number;
          error_message: string | null;
          sent_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          landlord_id: string;
          recipient_phone: string;
          recipient_name: string;
          message: string;
          sms_type?: string;
          status?: string;
          message_id?: string | null;
          cost?: number;
          error_message?: string | null;
          sent_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          landlord_id?: string;
          recipient_phone?: string;
          recipient_name?: string;
          message?: string;
          sms_type?: string;
          status?: string;
          message_id?: string | null;
          cost?: number;
          error_message?: string | null;
          sent_at?: string;
        };
      };
    };
  };
}