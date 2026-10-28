// Mirrors supabase/migrations. Regenerate after schema changes with:
//   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          plan: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          plan?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          plan?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      businesses: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          business_type: string;
          tone: string;
          owner_name: string | null;
          contact_details: string | null;
          do_rules: string | null;
          dont_rules: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          business_type: string;
          tone: string;
          owner_name?: string | null;
          contact_details?: string | null;
          do_rules?: string | null;
          dont_rules?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          business_type?: string;
          tone?: string;
          owner_name?: string | null;
          contact_details?: string | null;
          do_rules?: string | null;
          dont_rules?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          business_id: string;
          source: string;
          external_id: string | null;
          reviewer_name: string | null;
          rating: number | null;
          content: string;
          sentiment: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_id: string;
          source?: string;
          external_id?: string | null;
          reviewer_name?: string | null;
          rating?: number | null;
          content: string;
          sentiment?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_id?: string;
          source?: string;
          external_id?: string | null;
          reviewer_name?: string | null;
          rating?: number | null;
          content?: string;
          sentiment?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      replies: {
        Row: {
          id: string;
          review_id: string;
          user_id: string;
          variant: string;
          content: string;
          is_selected: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          user_id: string;
          variant: string;
          content: string;
          is_selected?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          review_id?: string;
          user_id?: string;
          variant?: string;
          content?: string;
          is_selected?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "replies_review_id_fkey";
            columns: ["review_id"];
            isOneToOne: false;
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          },
        ];
      };
      usage_counters: {
        Row: {
          user_id: string;
          period_start: string;
          generations: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          period_start: string;
          generations?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          period_start?: string;
          generations?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      demo_usage: {
        Row: {
          ip_hash: string;
          created_at: string;
        };
        Insert: {
          ip_hash: string;
          created_at?: string;
        };
        Update: {
          ip_hash?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      record_generation: {
        Args: {
          p_business_id: string;
          p_content: string;
          p_reviewer_name: string | null;
          p_rating: number | null;
          p_sentiment: string | null;
          p_replies: Json;
        };
        Returns: string;
      };
      consume_reply_credit: {
        Args: { p_user_id: string; p_limit: number | null };
        Returns: number | null;
      };
      refund_reply_credit: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      claim_demo_slot: {
        Args: { p_ip_hash: string; p_daily_limit: number };
        Returns: string;
      };
      release_demo_slot: {
        Args: { p_ip_hash: string };
        Returns: undefined;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
