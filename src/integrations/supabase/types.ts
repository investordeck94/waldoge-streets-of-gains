export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bark_zero_constitution: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          priority: number
          section: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          priority?: number
          section: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          priority?: number
          section?: string
          updated_at?: string
        }
        Relationships: []
      }
      bark_zero_creations: {
        Row: {
          content: string
          created_at: string
          id: string
          kind: string
          metadata: Json
          owner_notes: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          kind: string
          metadata?: Json
          owner_notes?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          kind?: string
          metadata?: Json
          owner_notes?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bark_zero_curiosities: {
        Row: {
          created_at: string
          findings: string | null
          id: string
          opinion: string | null
          question: string
          sources: Json
          status: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          findings?: string | null
          id?: string
          opinion?: string | null
          question: string
          sources?: Json
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          findings?: string | null
          id?: string
          opinion?: string | null
          question?: string
          sources?: Json
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      bark_zero_diary: {
        Row: {
          content: string
          created_at: string
          entry_date: string
          id: string
          mood: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          entry_date?: string
          id?: string
          mood?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          mood?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bark_zero_dreams: {
        Row: {
          connections: string[]
          content: string
          created_at: string
          id: string
          is_private: boolean
          theme: string | null
          updated_at: string
        }
        Insert: {
          connections?: string[]
          content: string
          created_at?: string
          id?: string
          is_private?: boolean
          theme?: string | null
          updated_at?: string
        }
        Update: {
          connections?: string[]
          content?: string
          created_at?: string
          id?: string
          is_private?: boolean
          theme?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bark_zero_evolution: {
        Row: {
          created_at: string
          event_type: string
          id: string
          is_active: boolean
          lesson: string
          related_id: string | null
          related_kind: string | null
          signal: string
          updated_at: string
          weight: number
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          is_active?: boolean
          lesson: string
          related_id?: string | null
          related_kind?: string | null
          signal: string
          updated_at?: string
          weight?: number
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          is_active?: boolean
          lesson?: string
          related_id?: string | null
          related_kind?: string | null
          signal?: string
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      bark_zero_knowledge: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          source: string | null
          tags: string[]
          topic: string
          updated_at: string
          weight: number
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          source?: string | null
          tags?: string[]
          topic: string
          updated_at?: string
          weight?: number
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          source?: string | null
          tags?: string[]
          topic?: string
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      bark_zero_launch_history: {
        Row: {
          brief: string | null
          created_at: string
          error: string | null
          id: string
          launch_score: number | null
          mint_address: string | null
          narrative_score: number | null
          proposal: Json
          request_id: string | null
          signature: string | null
          status: string
          ticker: string
          token_name: string
          updated_at: string
        }
        Insert: {
          brief?: string | null
          created_at?: string
          error?: string | null
          id?: string
          launch_score?: number | null
          mint_address?: string | null
          narrative_score?: number | null
          proposal: Json
          request_id?: string | null
          signature?: string | null
          status?: string
          ticker: string
          token_name: string
          updated_at?: string
        }
        Update: {
          brief?: string | null
          created_at?: string
          error?: string | null
          id?: string
          launch_score?: number | null
          mint_address?: string | null
          narrative_score?: number | null
          proposal?: Json
          request_id?: string | null
          signature?: string | null
          status?: string
          ticker?: string
          token_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      bark_zero_market_intel: {
        Row: {
          bark_take: string | null
          category: string
          composite: number
          created_at: string
          id: string
          is_active: boolean
          rank: number | null
          scanned_at: string
          scores: Json
          slug: string
          source: string | null
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          bark_take?: string | null
          category: string
          composite?: number
          created_at?: string
          id?: string
          is_active?: boolean
          rank?: number | null
          scanned_at?: string
          scores?: Json
          slug: string
          source?: string | null
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          bark_take?: string | null
          category?: string
          composite?: number
          created_at?: string
          id?: string
          is_active?: boolean
          rank?: number | null
          scanned_at?: string
          scores?: Json
          slug?: string
          source?: string | null
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bark_zero_memories: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          tags: string[]
          title: string
          updated_at: string
          weight: number
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          tags?: string[]
          title: string
          updated_at?: string
          weight?: number
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          tags?: string[]
          title?: string
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      maze_leaderboard: {
        Row: {
          created_at: string
          difficulty: number
          id: string
          moves: number
          player_name: string
          wallet_address: string
        }
        Insert: {
          created_at?: string
          difficulty: number
          id?: string
          moves: number
          player_name: string
          wallet_address: string
        }
        Update: {
          created_at?: string
          difficulty?: number
          id?: string
          moves?: number
          player_name?: string
          wallet_address?: string
        }
        Relationships: []
      }
      sog_auth_challenges: {
        Row: {
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          issued_at: string
          nonce: string
          statement: string
          wallet: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          issued_at?: string
          nonce: string
          statement: string
          wallet: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          issued_at?: string
          nonce?: string
          statement?: string
          wallet?: string
        }
        Relationships: []
      }
      sog_runs: {
        Row: {
          attestation_digest: string | null
          chain_id: number
          chain_nonce: number
          client_run_key: string | null
          contract_address: string
          created_at: string
          deadline: number
          duration_ms: number
          epoch_key: string
          id: string
          level: number
          reward_amount_wei: number
          run_id: string
          score: number
          status: string
          tx_hash: string | null
          updated_at: string
          validation_error: string | null
          wallet: string
          wave: number
        }
        Insert: {
          attestation_digest?: string | null
          chain_id: number
          chain_nonce: number
          client_run_key?: string | null
          contract_address: string
          created_at?: string
          deadline: number
          duration_ms?: number
          epoch_key?: string
          id?: string
          level: number
          reward_amount_wei?: number
          run_id: string
          score: number
          status?: string
          tx_hash?: string | null
          updated_at?: string
          validation_error?: string | null
          wallet: string
          wave: number
        }
        Update: {
          attestation_digest?: string | null
          chain_id?: number
          chain_nonce?: number
          client_run_key?: string | null
          contract_address?: string
          created_at?: string
          deadline?: number
          duration_ms?: number
          epoch_key?: string
          id?: string
          level?: number
          reward_amount_wei?: number
          run_id?: string
          score?: number
          status?: string
          tx_hash?: string | null
          updated_at?: string
          validation_error?: string | null
          wallet?: string
          wave?: number
        }
        Relationships: []
      }
      sog_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          issued_at: string
          last_used_at: string | null
          revoked_at: string | null
          token_hash: string
          wallet: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          issued_at?: string
          last_used_at?: string | null
          revoked_at?: string | null
          token_hash: string
          wallet: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          issued_at?: string
          last_used_at?: string | null
          revoked_at?: string | null
          token_hash?: string
          wallet?: string
        }
        Relationships: []
      }
      wallet_usage: {
        Row: {
          created_at: string
          feature: string
          id: string
          updated_at: string
          usage_count: number
          usage_date: string
          wallet_address: string
        }
        Insert: {
          created_at?: string
          feature: string
          id?: string
          updated_at?: string
          usage_count?: number
          usage_date?: string
          wallet_address: string
        }
        Update: {
          created_at?: string
          feature?: string
          id?: string
          updated_at?: string
          usage_count?: number
          usage_date?: string
          wallet_address?: string
        }
        Relationships: []
      }
    }
    Views: {
      maze_leaderboard_public: {
        Row: {
          created_at: string | null
          difficulty: number | null
          id: string | null
          moves: number | null
          player_name: string | null
        }
        Insert: {
          created_at?: string | null
          difficulty?: number | null
          id?: string | null
          moves?: number | null
          player_name?: string | null
        }
        Update: {
          created_at?: string | null
          difficulty?: number | null
          id?: string | null
          moves?: number | null
          player_name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_and_increment_usage: {
        Args: { p_feature: string; p_tier_limit: number; p_wallet: string }
        Returns: boolean
      }
      check_maze_rate_limit: { Args: { p_wallet: string }; Returns: boolean }
      get_leaderboard: {
        Args: { p_difficulty: number; p_limit?: number }
        Returns: {
          created_at: string
          difficulty: number
          id: string
          moves: number
          player_name: string
        }[]
      }
      get_usage_count: {
        Args: { p_feature: string; p_wallet: string }
        Returns: number
      }
      is_valid_maze_score: {
        Args: { p_difficulty: number; p_moves: number }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
