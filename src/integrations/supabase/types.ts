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
      lancamentos: {
        Row: {
          created_at: string
          data: string
          desconto: number
          id: string
          user_id: string
          valor_bruto: number
          valor_liquido: number | null
        }
        Insert: {
          created_at?: string
          data: string
          desconto?: number
          id?: string
          user_id: string
          valor_bruto: number
          valor_liquido?: number | null
        }
        Update: {
          created_at?: string
          data?: string
          desconto?: number
          id?: string
          user_id?: string
          valor_bruto?: number
          valor_liquido?: number | null
        }
        Relationships: []
      }
      metas: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          user_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          user_id: string
          valor: number
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          created_at: string
          user_id: string
          nome: string
          telefone: string | null
          whatsapp: string | null
          email: string | null
          observacoes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          nome: string
          telefone?: string | null
          whatsapp?: string | null
          email?: string | null
          observacoes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          nome?: string
          telefone?: string | null
          whatsapp?: string | null
          email?: string | null
          observacoes?: string | null
        }
        Relationships: []
      }
      pets: {
        Row: {
          id: string
          created_at: string
          user_id: string
          customer_id: string
          nome: string
          especie: string | null
          raca: string | null
          data_aniversario: string | null
          sexo: string | null
          porte: string | null
          peso: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          customer_id: string
          nome: string
          especie?: string | null
          raca?: string | null
          data_aniversario?: string | null
          sexo?: string | null
          porte?: string | null
          peso?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          customer_id?: string
          nome?: string
          especie?: string | null
          raca?: string | null
          data_aniversario?: string | null
          sexo?: string | null
          porte?: string | null
          peso?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          id: string
          created_at: string
          user_id: string
          nome: string
          categoria: string | null
          prazo_recompra_dias: number
          dias_aviso_previo: number
          mensagem_padrao: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          nome: string
          categoria?: string | null
          prazo_recompra_dias?: number
          dias_aviso_previo?: number
          mensagem_padrao?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          nome?: string
          categoria?: string | null
          prazo_recompra_dias?: number
          dias_aviso_previo?: number
          mensagem_padrao?: string | null
        }
        Relationships: []
      }
      pet_purchases: {
        Row: {
          id: string
          created_at: string
          user_id: string
          pet_id: string
          product_id: string
          data_compra: string
          dias_recompra: number
          proxima_data: string
          dias_aviso_previo: number
          data_lembrete: string
          status: string
          purchase_history_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          pet_id: string
          product_id: string
          data_compra: string
          dias_recompra: number
          proxima_data: string
          dias_aviso_previo: number
          data_lembrete: string
          status?: string
          purchase_history_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          pet_id?: string
          product_id?: string
          data_compra?: string
          dias_recompra?: number
          proxima_data?: string
          dias_aviso_previo?: number
          data_lembrete?: string
          status?: string
          purchase_history_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_purchases_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_purchases_purchase_history_id_fkey"
            columns: ["purchase_history_id"]
            isOneToOne: false
            referencedRelation: "pet_purchases"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          created_at: string
          user_id: string
          purchase_id: string
          data: string
          tipo: string
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          purchase_id: string
          data: string
          tipo: string
          status: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          purchase_id?: string
          data?: string
          tipo?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "pet_purchases"
            referencedColumns: ["id"]
          }
        ]
      }
      whatsapp_logs: {
        Row: {
          id: string
          created_at: string
          user_id: string
          purchase_id: string | null
          telefone: string
          mensagem: string
          data_envio: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          purchase_id?: string | null
          telefone: string
          mensagem: string
          data_envio?: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          purchase_id?: string | null
          telefone?: string
          mensagem?: string
          data_envio?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_logs_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "pet_purchases"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
