export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string
          user_id: string
          document_type: 'jargon' | 'prescription' | 'bill' | 'report'
          storage_path: string | null
          file_url: string | null
          ai_summary: string
          flagged_charges: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          document_type: 'jargon' | 'prescription' | 'bill' | 'report'
          storage_path?: string | null
          file_url?: string | null
          ai_summary: string
          flagged_charges?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          document_type?: 'jargon' | 'prescription' | 'bill' | 'report'
          storage_path?: string | null
          file_url?: string | null
          ai_summary?: string
          flagged_charges?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      family_profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string
          relationship: string
          date_of_birth: string
          blood_group: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          relationship: string
          date_of_birth: string
          blood_group?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          relationship?: string
          date_of_birth?: string
          blood_group?: string | null
          created_at?: string
        }
        Relationships: []
      }
      insurance_policies: {
        Row: {
          id: string
          user_id: string
          provider_name: string
          policy_number: string
          storage_path: string | null
          document_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider_name: string
          policy_number: string
          storage_path?: string | null
          document_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider_name?: string
          policy_number?: string
          storage_path?: string | null
          document_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
