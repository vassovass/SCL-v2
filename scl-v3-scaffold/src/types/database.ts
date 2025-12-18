// This file should be generated using:
// npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
//
// For now, here's a placeholder that matches your existing SCL v2 schema.
// Replace this with generated types for full type safety.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
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
      };
      leagues: {
        Row: {
          id: string;
          name: string;
          stepweek_start: string;
          invite_code: string;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          stepweek_start?: string;
          invite_code?: string;
          owner_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          stepweek_start?: string;
          invite_code?: string;
          owner_id?: string;
          created_at?: string;
        };
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
      };
      submissions: {
        Row: {
          id: string;
          league_id: string;
          user_id: string;
          for_date: string;
          steps: number;
          proof_path: string | null;
          verified: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          user_id: string;
          for_date: string;
          steps: number;
          proof_path?: string | null;
          verified?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          user_id?: string;
          for_date?: string;
          steps?: number;
          proof_path?: string | null;
          verified?: boolean | null;
          created_at?: string;
        };
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
      };
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
    };
  };
}
