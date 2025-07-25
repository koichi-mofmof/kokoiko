export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      list_bookmarks: {
        Row: {
          created_at: string
          id: string
          list_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          list_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          list_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_bookmarks_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "place_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      list_place_commnts: {
        Row: {
          comment: string
          created_at: string | null
          id: string
          list_place_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string | null
          id?: string
          list_place_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string | null
          id?: string
          list_place_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_place_commnts_list_place_id_fkey"
            columns: ["list_place_id"]
            isOneToOne: false
            referencedRelation: "list_places"
            referencedColumns: ["id"]
          },
        ]
      }
      list_place_rankings: {
        Row: {
          comment: string | null
          created_at: string | null
          created_by: string | null
          id: string
          list_id: string
          place_id: string
          rank: number
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          list_id: string
          place_id: string
          rank: number
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          list_id?: string
          place_id?: string
          rank?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "list_place_rankings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_place_rankings_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "place_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_place_rankings_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      list_place_tags: {
        Row: {
          assigned_at: string | null
          list_place_id: string
          tag_id: string
        }
        Insert: {
          assigned_at?: string | null
          list_place_id: string
          tag_id: string
        }
        Update: {
          assigned_at?: string | null
          list_place_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_place_tags_list_place_id_fkey"
            columns: ["list_place_id"]
            isOneToOne: false
            referencedRelation: "list_places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_place_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      list_places: {
        Row: {
          added_at: string | null
          created_at: string | null
          id: string
          list_id: string
          place_id: string
          updated_at: string | null
          user_id: string
          visited_status:
            | Database["public"]["Enums"]["visited_status_enum"]
            | null
        }
        Insert: {
          added_at?: string | null
          created_at?: string | null
          id?: string
          list_id: string
          place_id: string
          updated_at?: string | null
          user_id: string
          visited_status?:
            | Database["public"]["Enums"]["visited_status_enum"]
            | null
        }
        Update: {
          added_at?: string | null
          created_at?: string | null
          id?: string
          list_id?: string
          place_id?: string
          updated_at?: string | null
          user_id?: string
          visited_status?:
            | Database["public"]["Enums"]["visited_status_enum"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "list_places_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "place_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_places_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      list_share_tokens: {
        Row: {
          created_at: string | null
          created_by: string
          current_uses: number
          default_permission: Database["public"]["Enums"]["shared_list_permission_enum"]
          expires_at: string | null
          id: string
          is_active: boolean
          list_id: string
          list_name: string | null
          max_uses: number | null
          owner_id: string
          owner_name: string | null
          token: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string
          current_uses?: number
          default_permission?: Database["public"]["Enums"]["shared_list_permission_enum"]
          expires_at?: string | null
          id?: string
          is_active?: boolean
          list_id: string
          list_name?: string | null
          max_uses?: number | null
          owner_id: string
          owner_name?: string | null
          token: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          current_uses?: number
          default_permission?: Database["public"]["Enums"]["shared_list_permission_enum"]
          expires_at?: string | null
          id?: string
          is_active?: boolean
          list_id?: string
          list_name?: string | null
          max_uses?: number | null
          owner_id?: string
          owner_name?: string | null
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "list_share_tokens_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "place_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      place_lists: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_place_lists_profiles"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          address: string | null
          admin_area_level_1: string | null
          country_code: string | null
          country_name: string | null
          created_at: string | null
          google_place_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          region_hierarchy: Json | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          admin_area_level_1?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string | null
          google_place_id?: string | null
          id: string
          latitude?: number | null
          longitude?: number | null
          name: string
          region_hierarchy?: Json | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          admin_area_level_1?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string | null
          google_place_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          region_hierarchy?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      region_hierarchy: {
        Row: {
          admin_area_level_1: string | null
          admin_area_level_1_type: string | null
          country_code: string
          country_name: string
          created_at: string | null
          id: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          admin_area_level_1?: string | null
          admin_area_level_1_type?: string | null
          country_code: string
          country_name: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          admin_area_level_1?: string | null
          admin_area_level_1_type?: string | null
          country_code?: string
          country_name?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      shared_lists: {
        Row: {
          id: string
          list_id: string
          owner_id: string
          permission: Database["public"]["Enums"]["shared_list_permission_enum"]
          shared_at: string | null
          shared_with_user_id: string
        }
        Insert: {
          id?: string
          list_id: string
          owner_id: string
          permission?: Database["public"]["Enums"]["shared_list_permission_enum"]
          shared_at?: string | null
          shared_with_user_id: string
        }
        Update: {
          id?: string
          list_id?: string
          owner_id?: string
          permission?: Database["public"]["Enums"]["shared_list_permission_enum"]
          shared_at?: string | null
          shared_with_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_lists_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "place_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_list_access: {
        Args: {
          target_list_id: string
          user_id?: string
          required_permission?: string
        }
        Returns: boolean
      }
      confirm_account_deletion_ready: {
        Args: { target_user_id: string }
        Returns: Json
      }
      create_place_list: {
        Args: {
          p_name: string
          p_description: string
          p_is_public: boolean
          p_created_by: string
        }
        Returns: string
      }
      delete_list_place_cascade: {
        Args: { p_list_place_id: string }
        Returns: undefined
      }
      delete_place_list: {
        Args: { p_id: string; p_user_id: string }
        Returns: boolean
      }
      delete_user_data_transaction: {
        Args: { target_user_id: string }
        Returns: Json
      }
      get_my_place_lists: {
        Args: { user_id: string }
        Returns: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string | null
        }[]
      }
      get_shared_lists_for_user: {
        Args: { p_user_id: string }
        Returns: {
          list_id: string
          list_name: string
          list_description: string
          list_is_public: boolean
          list_created_at: string
          list_updated_at: string
          list_created_by: string
          permission: string
        }[]
      }
      has_list_access: {
        Args: { list_uuid: string; access_type?: string }
        Returns: boolean
      }
      has_list_place_access: {
        Args: { list_place_uuid: string; access_type?: string }
        Returns: boolean
      }
      has_place_access_via_lists: {
        Args: { place_id_param: string; access_type?: string }
        Returns: boolean
      }
      is_collaborator: {
        Args: {
          user_id: string
          list_uuid: string
          required_permission?: string
        }
        Returns: boolean
      }
      is_own_data: {
        Args: { data_user_id: string }
        Returns: boolean
      }
      is_owner: {
        Args: { user_id: string; list_uuid: string }
        Returns: boolean
      }
      is_publicly_accessible: {
        Args: { list_uuid: string }
        Returns: boolean
      }
      prepare_user_storage_cleanup: {
        Args: { target_user_id: string }
        Returns: Json
      }
      register_place_to_list: {
        Args: {
          google_place_id_input: string
          place_name_input: string
          list_id_input: string
          user_id_input: string
          place_address_input?: string
          place_latitude_input?: number
          place_longitude_input?: number
          tag_names_input?: string[]
          user_comment_input?: string
          visited_status_input?: Database["public"]["Enums"]["visited_status_enum"]
          country_code_input?: string
          country_name_input?: string
          admin_area_level_1_input?: string
          region_hierarchy_input?: Json
        }
        Returns: string
      }
      update_list_place_and_tags: {
        Args: {
          p_list_place_id: string
          p_visited_status?: Database["public"]["Enums"]["visited_status_enum"]
          p_tags?: string[]
          p_user_id?: string
        }
        Returns: undefined
      }
      update_place_list: {
        Args: {
          p_id: string
          p_name: string
          p_description: string
          p_is_public: boolean
          p_user_id: string
        }
        Returns: boolean
      }
      verify_share_token_access: {
        Args: { token_value: string }
        Returns: {
          list_id: string
          permission: string
          owner_id: string
          is_valid: boolean
        }[]
      }
    }
    Enums: {
      shared_list_permission_enum: "view" | "edit"
      visited_status_enum: "visited" | "not_visited"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      shared_list_permission_enum: ["view", "edit"],
      visited_status_enum: ["visited", "not_visited"],
    },
  },
} as const

