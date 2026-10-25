/**
 * FYNUX OS — Database Schema Types (Matches supabase/migrations)
 */

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: "OWNER" | "SALES" | "DEVELOPER";
          status: "ACTIVE" | "INACTIVE";
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          role?: "OWNER" | "SALES" | "DEVELOPER";
          status?: "ACTIVE" | "INACTIVE";
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      companies: {
        Row: {
          id: string;
          name: string;
          industry: string | null;
          website: string | null;
          location: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          industry?: string | null;
          website?: string | null;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>;
      };
      contacts: {
        Row: {
          id: string;
          company_id: string | null;
          name: string;
          whatsapp_number: string;
          email: string | null;
          position: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          name: string;
          whatsapp_number: string;
          email?: string | null;
          position?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["contacts"]["Insert"]>;
      };
      prospects: {
        Row: {
          id: string;
          company_id: string | null;
          contact_id: string;
          research_notes: string;
          pain_points: string | null;
          potential_services: string | null;
          assigned_sales_id: string | null;
          stage: string;
          next_action: string;
          next_follow_up_date: string | null;
          follow_up_step: string | null;
          last_reach_at: string | null;
          failed_reason: string | null;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          contact_id: string;
          research_notes: string;
          pain_points?: string | null;
          potential_services?: string | null;
          assigned_sales_id?: string | null;
          stage?: string;
          next_action?: string;
          next_follow_up_date?: string | null;
          follow_up_step?: string | null;
          last_reach_at?: string | null;
          failed_reason?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["prospects"]["Insert"]>;
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          deal_id: string | null;
          company_id: string;
          contact_id: string;
          issued_by_user_id: string;
          subtotal: number;
          discount: number;
          total_amount: number;
          paid_amount: number;
          outstanding_balance: number;
          status: string;
          due_date: string;
          notes: string | null;
          pdf_storage_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_number: string;
          deal_id?: string | null;
          company_id: string;
          contact_id: string;
          issued_by_user_id: string;
          subtotal?: number;
          discount?: number;
          total_amount?: number;
          paid_amount?: number;
          outstanding_balance?: number;
          status?: string;
          due_date: string;
          notes?: string | null;
          pdf_storage_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]>;
      };
      payments: {
        Row: {
          id: string;
          invoice_id: string;
          amount: number;
          payment_method: string;
          status: string;
          gateway_order_id: string | null;
          gateway_reference: string | null;
          payment_proof_path: string | null;
          confirmed_by_user_id: string | null;
          confirmed_at: string | null;
          reversal_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          amount: number;
          payment_method: string;
          status?: string;
          gateway_order_id?: string | null;
          gateway_reference?: string | null;
          payment_proof_path?: string | null;
          confirmed_by_user_id?: string | null;
          confirmed_at?: string | null;
          reversal_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
      };
      projects: {
        Row: {
          id: string;
          deal_id: string | null;
          company_id: string;
          name: string;
          status: string;
          progress_percent: number;
          scope_description: string;
          start_date: string | null;
          target_deadline: string | null;
          completed_at: string | null;
          on_hold_reason: string | null;
          on_hold_date: string | null;
          cancelled_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          deal_id?: string | null;
          company_id: string;
          name: string;
          status?: string;
          progress_percent?: number;
          scope_description: string;
          start_date?: string | null;
          target_deadline?: string | null;
          completed_at?: string | null;
          on_hold_reason?: string | null;
          on_hold_date?: string | null;
          cancelled_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
      };
      tasks: {
        Row: {
          id: string;
          project_id: string | null;
          title: string;
          description: string | null;
          primary_pic_id: string;
          status: string;
          priority: string;
          deadline: string | null;
          blocked_reason: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          title: string;
          description?: string | null;
          primary_pic_id: string;
          status?: string;
          priority?: string;
          deadline?: string | null;
          blocked_reason?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
      };
    };
  };
}
