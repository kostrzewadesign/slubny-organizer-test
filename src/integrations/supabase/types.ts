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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      custom_categories: {
        Row: {
          category_name: string
          category_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          category_name: string
          category_type: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          category_name?: string
          category_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          completed: boolean | null
          created_at: string
          deposit_amount: number | null
          id: string
          note: string | null
          paid_amount: number | null
          payment_status:
            | Database["public"]["Enums"]["payment_status_new"]
            | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category: string
          completed?: boolean | null
          created_at?: string
          deposit_amount?: number | null
          id?: string
          note?: string | null
          paid_amount?: number | null
          payment_status?:
            | Database["public"]["Enums"]["payment_status_new"]
            | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          completed?: boolean | null
          created_at?: string
          deposit_amount?: number | null
          id?: string
          note?: string | null
          paid_amount?: number | null
          payment_status?:
            | Database["public"]["Enums"]["payment_status_new"]
            | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      guests: {
        Row: {
          accommodation: boolean | null
          child_age: number | null
          companion_of_guest_id: string | null
          created_at: string
          dietary_restrictions: string | null
          discount_type: string | null
          email: string | null
          first_name: string
          guest_group: string | null
          id: string
          is_child: boolean | null
          is_linked_to_profile: boolean | null
          is_service_provider: boolean | null
          last_name: string | null
          notes: string | null
          phone: string | null
          role: Database["public"]["Enums"]["guest_role"] | null
          rsvp_status: string | null
          seat_index: number | null
          special_icon: string | null
          status: string | null
          table_assignment: string | null
          transport: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accommodation?: boolean | null
          child_age?: number | null
          companion_of_guest_id?: string | null
          created_at?: string
          dietary_restrictions?: string | null
          discount_type?: string | null
          email?: string | null
          first_name: string
          guest_group?: string | null
          id?: string
          is_child?: boolean | null
          is_linked_to_profile?: boolean | null
          is_service_provider?: boolean | null
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["guest_role"] | null
          rsvp_status?: string | null
          seat_index?: number | null
          special_icon?: string | null
          status?: string | null
          table_assignment?: string | null
          transport?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accommodation?: boolean | null
          child_age?: number | null
          companion_of_guest_id?: string | null
          created_at?: string
          dietary_restrictions?: string | null
          discount_type?: string | null
          email?: string | null
          first_name?: string
          guest_group?: string | null
          id?: string
          is_child?: boolean | null
          is_linked_to_profile?: boolean | null
          is_service_provider?: boolean | null
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["guest_role"] | null
          rsvp_status?: string | null
          seat_index?: number | null
          special_icon?: string | null
          status?: string | null
          table_assignment?: string | null
          transport?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_companion_of_guest_id_fkey"
            columns: ["companion_of_guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          target_guest_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          target_guest_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          target_guest_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      table_assignments: {
        Row: {
          created_at: string
          guest_id: string
          id: string
          seat_number: number | null
          table_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          guest_id: string
          id?: string
          seat_number?: number | null
          table_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          guest_id?: string
          id?: string
          seat_number?: number | null
          table_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_assignments_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_assignments_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          seats: number
          table_type: Database["public"]["Enums"]["table_type"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          seats?: number
          table_type?: Database["public"]["Enums"]["table_type"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          seats?: number
          table_type?: Database["public"]["Enums"]["table_type"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          category: string
          completed: boolean | null
          created_at: string
          description: string | null
          id: string
          is_priority: boolean | null
          task_type: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          completed?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          is_priority?: boolean | null
          task_type?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          completed?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          is_priority?: boolean | null
          task_type?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          bride_first_name: string | null
          bride_last_name: string | null
          bride_name: string | null
          created_at: string
          expenses_initialized: boolean | null
          groom_first_name: string | null
          groom_last_name: string | null
          groom_name: string | null
          guest_count: number | null
          has_completed_onboarding: boolean | null
          has_paid: boolean | null
          has_seen_welcome_modal: boolean | null
          id: string
          location: string | null
          notes: string | null
          setup_completed: boolean | null
          setup_completed_at: string | null
          tasks_initialized: boolean | null
          total_budget: number | null
          updated_at: string
          user_id: string
          wedding_date: string | null
        }
        Insert: {
          bride_first_name?: string | null
          bride_last_name?: string | null
          bride_name?: string | null
          created_at?: string
          expenses_initialized?: boolean | null
          groom_first_name?: string | null
          groom_last_name?: string | null
          groom_name?: string | null
          guest_count?: number | null
          has_completed_onboarding?: boolean | null
          has_paid?: boolean | null
          has_seen_welcome_modal?: boolean | null
          id?: string
          location?: string | null
          notes?: string | null
          setup_completed?: boolean | null
          setup_completed_at?: string | null
          tasks_initialized?: boolean | null
          total_budget?: number | null
          updated_at?: string
          user_id: string
          wedding_date?: string | null
        }
        Update: {
          bride_first_name?: string | null
          bride_last_name?: string | null
          bride_name?: string | null
          created_at?: string
          expenses_initialized?: boolean | null
          groom_first_name?: string | null
          groom_last_name?: string | null
          groom_name?: string | null
          guest_count?: number | null
          has_completed_onboarding?: boolean | null
          has_paid?: boolean | null
          has_seen_welcome_modal?: boolean | null
          id?: string
          location?: string | null
          notes?: string | null
          setup_completed?: boolean | null
          setup_completed_at?: string | null
          tasks_initialized?: boolean | null
          total_budget?: number | null
          updated_at?: string
          user_id?: string
          wedding_date?: string | null
        }
        Relationships: []
      }
      wedding_templates: {
        Row: {
          amount: number | null
          category: string
          created_at: string
          description: string | null
          id: string
          is_priority: boolean | null
          order_index: number | null
          payment_status: string | null
          template_type: string
          title: string
        }
        Insert: {
          amount?: number | null
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_priority?: boolean | null
          order_index?: number | null
          payment_status?: string | null
          template_type: string
          title: string
        }
        Update: {
          amount?: number | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_priority?: boolean | null
          order_index?: number | null
          payment_status?: string | null
          template_type?: string
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_guest_with_companion: {
        Args: { p_companion?: Json; p_guest: Json; p_user_id: string }
        Returns: Json
      }
      budget_summary: {
        Args: { p_user_id: string }
        Returns: {
          deposit_paid: number
          paid: number
          remaining: number
          total: number
        }[]
      }
      cascade_delete_user_data: { Args: never; Returns: undefined }
      cleanup_duplicate_couple_tables: { Args: never; Returns: undefined }
      cleanup_old_audit_logs: { Args: never; Returns: undefined }
      cleanup_old_guest_data: { Args: never; Returns: undefined }
      cleanup_user_data: { Args: { target_user_id: string }; Returns: boolean }
      encrypt_guest_data: { Args: { raw_data: string }; Returns: string }
      export_user_guest_data: {
        Args: { requesting_user_id: string }
        Returns: Json
      }
      get_masked_guest_data: {
        Args: never
        Returns: {
          accommodation: boolean
          child_age: number
          companion_of_guest_id: string
          created_at: string
          dietary_restrictions: string
          discount_type: string
          email: string
          first_name: string
          guest_group: string
          id: string
          is_child: boolean
          is_service_provider: boolean
          last_name: string
          notes: string
          phone: string
          rsvp_status: string
          status: string
          table_assignment: string
          transport: boolean
          updated_at: string
          user_id: string
        }[]
      }
      init_default_expenses_if_needed: { Args: never; Returns: number }
      init_default_tasks_if_needed: { Args: never; Returns: number }
      log_enhanced_security_event: {
        Args: { event_action: string; event_details?: Json }
        Returns: undefined
      }
      mask_guest_email: { Args: { email_input: string }; Returns: string }
      mask_guest_phone: { Args: { phone_input: string }; Returns: string }
      reset_expenses_to_defaults: { Args: never; Returns: number }
      validate_email_format: { Args: { email_input: string }; Returns: boolean }
      validate_guest_access: {
        Args: { accessing_user_id: string; guest_user_id: string }
        Returns: boolean
      }
      validate_guest_jsonb: { Args: { guest_data: Json }; Returns: boolean }
      validate_guest_ownership: {
        Args: { guest_id: string; requesting_user_id: string }
        Returns: boolean
      }
      validate_password_security: {
        Args: { password_input: string }
        Returns: boolean
      }
      validate_phone_format: { Args: { phone_input: string }; Returns: string }
      verify_rls_isolation: {
        Args: never
        Returns: {
          policy_count: number
          rls_enabled: boolean
          table_name: string
          test_result: string
        }[]
      }
    }
    Enums: {
      guest_role: "bride" | "groom" | "guest" | "vendor"
      payment_status_new: "none" | "deposit_paid" | "paid" | "deposit_only"
      rsvp_status_enum:
        | "sent"
        | "confirmed"
        | "declined"
        | "pending"
        | "attending"
      table_type: "main_couple" | "regular"
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
    Enums: {
      guest_role: ["bride", "groom", "guest", "vendor"],
      payment_status_new: ["none", "deposit_paid", "paid", "deposit_only"],
      rsvp_status_enum: [
        "sent",
        "confirmed",
        "declined",
        "pending",
        "attending",
      ],
      table_type: ["main_couple", "regular"],
    },
  },
} as const
