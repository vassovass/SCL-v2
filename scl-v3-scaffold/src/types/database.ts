// Database types for StepCountLeague
// Based on the Supabase migrations schema

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
      users: {
        Row: {
          id: string;
          display_name: string | null;
          units: "metric" | "imperial";
          is_superadmin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          units?: "metric" | "imperial";
          is_superadmin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          units?: "metric" | "imperial";
          is_superadmin?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      leagues: {
        Row: {
          id: string;
          name: string;
          stepweek_start: "monday" | "sunday";
          invite_code: string;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          stepweek_start?: "monday" | "sunday";
          invite_code: string;
          owner_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          stepweek_start?: "monday" | "sunday";
          invite_code?: string;
          owner_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leagues_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      memberships: {
        Row: {
          league_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          joined_at: string;
        };
        Insert: {
          league_id: string;
          user_id: string;
          role?: "owner" | "admin" | "member";
          joined_at?: string;
        };
        Update: {
          league_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "member";
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memberships_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "memberships_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      submissions: {
        Row: {
          id: string;
          league_id: string;
          user_id: string;
          for_date: string;
          steps: number;
          km: number | null;
          calories: number | null;
          proof_path: string | null;
          verified: boolean | null;
          ai_extracted_steps: number | null;
          tolerance_used: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          user_id: string;
          for_date: string;
          steps: number;
          km?: number | null;
          calories?: number | null;
          proof_path?: string | null;
          verified?: boolean | null;
          ai_extracted_steps?: number | null;
          tolerance_used?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          user_id?: string;
          for_date?: string;
          steps?: number;
          km?: number | null;
          calories?: number | null;
          proof_path?: string | null;
          verified?: boolean | null;
          ai_extracted_steps?: number | null;
          tolerance_used?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "submissions_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "submissions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      site_settings: {
        Row: {
          key: string;
          value: string;
          description: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          key: string;
          value: string;
          description?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          key?: string;
          value?: string;
          description?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          target_id: string | null;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          target_id?: string | null;
          details?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          target_id?: string | null;
          details?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      leaderboard_period: {
        Args: {
          _league_id: string;
          _dates: string[];
          _limit?: number;
          _offset?: number;
        };
        Returns: {
          rank: number;
          user_id: string;
          display_name: string | null;
          total_steps: number;
          total_km: number;
          total_calories: number;
          partial_days: number;
          missed_days: number;
          verified_days: number;
          unverified_days: number;
          member_total: number;
          team_total_steps: number;
        }[];
      };
      is_superadmin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      set_superadmin: {
        Args: {
          target_user_id: string;
          is_super: boolean;
        };
        Returns: undefined;
      };
      update_site_setting: {
        Args: {
          setting_key: string;
          setting_value: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types for easier access
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Insertable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updatable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Specific table row types
export type User = Tables<"users">;
export type League = Tables<"leagues">;
export type Membership = Tables<"memberships">;
export type Submission = Tables<"submissions">;
export type SiteSetting = Tables<"site_settings">;
export type AuditLog = Tables<"audit_log">;
