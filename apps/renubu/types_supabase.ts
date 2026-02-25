export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  mvp: {
    Tables: {
      contacts: {
        Row: {
          company_id: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          is_primary: boolean | null
          last_name: string
          phone: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          is_primary?: boolean | null
          last_name: string
          phone?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          is_primary?: boolean | null
          last_name?: string
          phone?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_mvp_contacts_company_id"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          assigned_to: string | null
          company_id: string | null
          created_at: string | null
          current_arr: number | null
          domain: string | null
          health_score: number | null
          id: string
          industry: string | null
          name: string
          primary_contact_email: string | null
          primary_contact_id: string | null
          primary_contact_name: string | null
          renewal_date: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          company_id?: string | null
          created_at?: string | null
          current_arr?: number | null
          domain?: string | null
          health_score?: number | null
          id?: string
          industry?: string | null
          name: string
          primary_contact_email?: string | null
          primary_contact_id?: string | null
          primary_contact_name?: string | null
          renewal_date?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          company_id?: string | null
          created_at?: string | null
          current_arr?: number | null
          domain?: string | null
          health_score?: number | null
          id?: string
          industry?: string | null
          name?: string
          primary_contact_email?: string | null
          primary_contact_id?: string | null
          primary_contact_name?: string | null
          renewal_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_mvp_customers_primary_contact"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          customer_id: string | null
          description: string | null
          event_date: string
          event_type: string
          id: string
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          event_date: string
          event_type: string
          id?: string
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string | null
          customer_id: string | null
          id: string
          note_type: string | null
          renewal_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          customer_id?: string | null
          id?: string
          note_type?: string | null
          renewal_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          customer_id?: string | null
          id?: string
          note_type?: string | null
          renewal_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_renewal_id_fkey"
            columns: ["renewal_id"]
            isOneToOne: false
            referencedRelation: "renewals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      renewals: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          current_arr: number
          customer_id: string | null
          id: string
          notes: string | null
          probability: number | null
          proposed_arr: number | null
          renewal_date: string
          risk_level: string
          stage: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          current_arr: number
          customer_id?: string | null
          id?: string
          notes?: string | null
          probability?: number | null
          proposed_arr?: number | null
          renewal_date: string
          risk_level?: string
          stage?: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          current_arr?: number
          customer_id?: string | null
          id?: string
          notes?: string | null
          probability?: number | null
          proposed_arr?: number | null
          renewal_date?: string
          risk_level?: string
          stage?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "renewals_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renewals_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_config: {
        Row: {
          active_schema: string
          created_at: string | null
          description: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          active_schema?: string
          created_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          active_schema?: string
          created_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          renewal_id: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          renewal_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          renewal_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_renewal_id_fkey"
            columns: ["renewal_id"]
            isOneToOne: false
            referencedRelation: "renewals"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      current_schema_status: {
        Row: {
          active_schema: string | null
          description: string | null
          last_switched: string | null
          status_description: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_primary_contact: {
        Args: {
          p_customer_id: string
          p_email: string
          p_first_name: string
          p_last_name: string
          p_phone?: string
          p_title?: string
        }
        Returns: string
      }
      get_active_schema: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      switch_active_schema: {
        Args: { schema_name: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          customer_id: string | null
          id: string
          is_read: boolean | null
          message: string
          severity: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          customer_id?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          severity?: string
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          customer_id?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          severity?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string | null
          domain: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company_id: string | null
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          is_primary: boolean | null
          last_name: string
          phone: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          is_primary?: boolean | null
          last_name: string
          phone?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          is_primary?: boolean | null
          last_name?: string
          phone?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          arr: number
          auto_renewal: boolean | null
          contract_number: string | null
          contract_type: string
          created_at: string | null
          customer_id: string | null
          end_date: string
          id: string
          notes: string | null
          seats: number | null
          start_date: string
          status: string
          terms_url: string | null
          updated_at: string | null
        }
        Insert: {
          arr: number
          auto_renewal?: boolean | null
          contract_number?: string | null
          contract_type?: string
          created_at?: string | null
          customer_id?: string | null
          end_date: string
          id?: string
          notes?: string | null
          seats?: number | null
          start_date: string
          status?: string
          terms_url?: string | null
          updated_at?: string | null
        }
        Update: {
          arr?: number
          auto_renewal?: boolean | null
          contract_number?: string | null
          contract_type?: string
          created_at?: string | null
          customer_id?: string | null
          end_date?: string
          id?: string
          notes?: string | null
          seats?: number | null
          start_date?: string
          status?: string
          terms_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          confidence_score: number | null
          content: string
          conversation_id: string | null
          created_at: string | null
          decision_outcome: string | null
          id: string
          message_type: string
          participant_id: string | null
          participant_type: string
          responds_to_message_id: string | null
          structured_data: Json | null
        }
        Insert: {
          confidence_score?: number | null
          content: string
          conversation_id?: string | null
          created_at?: string | null
          decision_outcome?: string | null
          id?: string
          message_type: string
          participant_id?: string | null
          participant_type: string
          responds_to_message_id?: string | null
          structured_data?: Json | null
        }
        Update: {
          confidence_score?: number | null
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          decision_outcome?: string | null
          id?: string
          message_type?: string
          participant_id?: string | null
          participant_type?: string
          responds_to_message_id?: string | null
          structured_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "workflow_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_responds_to_message_id_fkey"
            columns: ["responds_to_message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_properties: {
        Row: {
          churn_risk_score: number | null
          contract_end_date: string | null
          contract_renewal_date: string | null
          created_at: string | null
          current_arr: number | null
          customer_id: string | null
          expansion_opportunity_date: string | null
          expansion_potential: number | null
          health_score: number | null
          id: string
          last_activity_date: string | null
          last_updated: string | null
          next_review_date: string | null
          nps_score: number | null
          revenue_impact_tier: number | null
          risk_level: string | null
          usage_score: number | null
        }
        Insert: {
          churn_risk_score?: number | null
          contract_end_date?: string | null
          contract_renewal_date?: string | null
          created_at?: string | null
          current_arr?: number | null
          customer_id?: string | null
          expansion_opportunity_date?: string | null
          expansion_potential?: number | null
          health_score?: number | null
          id?: string
          last_activity_date?: string | null
          last_updated?: string | null
          next_review_date?: string | null
          nps_score?: number | null
          revenue_impact_tier?: number | null
          risk_level?: string | null
          usage_score?: number | null
        }
        Update: {
          churn_risk_score?: number | null
          contract_end_date?: string | null
          contract_renewal_date?: string | null
          created_at?: string | null
          current_arr?: number | null
          customer_id?: string | null
          expansion_opportunity_date?: string | null
          expansion_potential?: number | null
          health_score?: number | null
          id?: string
          last_activity_date?: string | null
          last_updated?: string | null
          next_review_date?: string | null
          nps_score?: number | null
          revenue_impact_tier?: number | null
          risk_level?: string | null
          usage_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_properties_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          current_arr: number | null
          domain: string | null
          health_score: number | null
          id: string
          industry: string | null
          name: string
          primary_contact_email: string | null
          primary_contact_id: string | null
          primary_contact_name: string | null
          renewal_date: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          current_arr?: number | null
          domain?: string | null
          health_score?: number | null
          id?: string
          industry?: string | null
          name: string
          primary_contact_email?: string | null
          primary_contact_id?: string | null
          primary_contact_name?: string | null
          renewal_date?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          current_arr?: number | null
          domain?: string | null
          health_score?: number | null
          id?: string
          industry?: string | null
          name?: string
          primary_contact_email?: string | null
          primary_contact_id?: string | null
          primary_contact_name?: string | null
          renewal_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_customers_primary_contact"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      date_monitoring_log: {
        Row: {
          check_date: string
          created_at: string | null
          customer_id: string | null
          days_until_date: number
          event_created: boolean | null
          event_id: string | null
          id: string
          key_date_id: string | null
        }
        Insert: {
          check_date: string
          created_at?: string | null
          customer_id?: string | null
          days_until_date: number
          event_created?: boolean | null
          event_id?: string | null
          id?: string
          key_date_id?: string | null
        }
        Update: {
          check_date?: string
          created_at?: string | null
          customer_id?: string | null
          days_until_date?: number
          event_created?: boolean | null
          event_id?: string | null
          id?: string
          key_date_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "date_monitoring_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "date_monitoring_log_key_date_id_fkey"
            columns: ["key_date_id"]
            isOneToOne: false
            referencedRelation: "key_dates"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          customer_id: string | null
          description: string | null
          event_date: string
          event_type: string
          id: string
          metadata: Json | null
          priority: number | null
          processed: boolean | null
          status: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          event_date: string
          event_type: string
          id?: string
          metadata?: Json | null
          priority?: number | null
          processed?: boolean | null
          status?: string
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          priority?: number | null
          processed?: boolean | null
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      key_dates: {
        Row: {
          alert_days: number | null
          created_at: string | null
          customer_id: string | null
          date_type: string
          date_value: string
          description: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          alert_days?: number | null
          created_at?: string | null
          customer_id?: string | null
          date_type: string
          date_value: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          alert_days?: number | null
          created_at?: string | null
          customer_id?: string | null
          date_type?: string
          date_value?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "key_dates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string | null
          customer_id: string | null
          id: string
          note_type: string | null
          renewal_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          customer_id?: string | null
          id?: string
          note_type?: string | null
          renewal_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          customer_id?: string | null
          id?: string
          note_type?: string | null
          renewal_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_renewal_id_fkey"
            columns: ["renewal_id"]
            isOneToOne: false
            referencedRelation: "renewals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_type: string | null
          avatar_url: string | null
          company_id: string | null
          company_name: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_local_user: boolean | null
          local_auth_enabled: boolean | null
          password_hash: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          auth_type?: string | null
          avatar_url?: string | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_local_user?: boolean | null
          local_auth_enabled?: boolean | null
          password_hash?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_type?: string | null
          avatar_url?: string | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_local_user?: boolean | null
          local_auth_enabled?: boolean | null
          password_hash?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      renewal_tasks: {
        Row: {
          action_score: number | null
          assigned_user_id: string | null
          completed_at: string | null
          created_at: string | null
          days_to_deadline: number | null
          deadline_urgency_score: number | null
          id: string
          is_overdue: boolean | null
          notes: string | null
          outcome_achieved: boolean | null
          renewal_id: string | null
          status: string | null
          task_deadline_date: string | null
          task_template_id: string | null
          updated_at: string | null
        }
        Insert: {
          action_score?: number | null
          assigned_user_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          days_to_deadline?: number | null
          deadline_urgency_score?: number | null
          id?: string
          is_overdue?: boolean | null
          notes?: string | null
          outcome_achieved?: boolean | null
          renewal_id?: string | null
          status?: string | null
          task_deadline_date?: string | null
          task_template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          action_score?: number | null
          assigned_user_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          days_to_deadline?: number | null
          deadline_urgency_score?: number | null
          id?: string
          is_overdue?: boolean | null
          notes?: string | null
          outcome_achieved?: boolean | null
          renewal_id?: string | null
          status?: string | null
          task_deadline_date?: string | null
          task_template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "renewal_tasks_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renewal_tasks_renewal_id_fkey"
            columns: ["renewal_id"]
            isOneToOne: false
            referencedRelation: "renewals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renewal_tasks_task_template_id_fkey"
            columns: ["task_template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      renewal_workflow_outcomes: {
        Row: {
          completed_at: string | null
          created_at: string | null
          customer_sentiment_change: string | null
          id: string
          key_deliverables_achieved: string[] | null
          outcome_quality: string | null
          phase: string
          phase_completed: boolean | null
          renewal_id: string | null
          renewal_probability_change: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          customer_sentiment_change?: string | null
          id?: string
          key_deliverables_achieved?: string[] | null
          outcome_quality?: string | null
          phase: string
          phase_completed?: boolean | null
          renewal_id?: string | null
          renewal_probability_change?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          customer_sentiment_change?: string | null
          id?: string
          key_deliverables_achieved?: string[] | null
          outcome_quality?: string | null
          phase?: string
          phase_completed?: boolean | null
          renewal_id?: string | null
          renewal_probability_change?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "renewal_workflow_outcomes_renewal_id_fkey"
            columns: ["renewal_id"]
            isOneToOne: false
            referencedRelation: "renewals"
            referencedColumns: ["id"]
          },
        ]
      }
      renewals: {
        Row: {
          ai_confidence: number | null
          ai_recommendations: string | null
          ai_risk_score: number | null
          assigned_to: string | null
          contract_id: string | null
          created_at: string | null
          current_arr: number
          current_phase: string | null
          customer_id: string | null
          expansion_opportunity: number | null
          id: string
          last_action_score_update: string | null
          last_contact_date: string | null
          next_action: string | null
          next_action_date: string | null
          notes: string | null
          probability: number | null
          proposed_arr: number | null
          renewal_date: string
          risk_level: string
          stage: string
          tasks_generated_at: string | null
          updated_at: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_recommendations?: string | null
          ai_risk_score?: number | null
          assigned_to?: string | null
          contract_id?: string | null
          created_at?: string | null
          current_arr: number
          current_phase?: string | null
          customer_id?: string | null
          expansion_opportunity?: number | null
          id?: string
          last_action_score_update?: string | null
          last_contact_date?: string | null
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          probability?: number | null
          proposed_arr?: number | null
          renewal_date: string
          risk_level?: string
          stage?: string
          tasks_generated_at?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_recommendations?: string | null
          ai_risk_score?: number | null
          assigned_to?: string | null
          contract_id?: string | null
          created_at?: string | null
          current_arr?: number
          current_phase?: string | null
          customer_id?: string | null
          expansion_opportunity?: number | null
          id?: string
          last_action_score_update?: string | null
          last_contact_date?: string | null
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          probability?: number | null
          proposed_arr?: number | null
          renewal_date?: string
          risk_level?: string
          stage?: string
          tasks_generated_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "renewals_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renewals_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renewals_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          complexity_score: number | null
          created_at: string | null
          deadline_type: string | null
          description: string | null
          earliest_start_day: number
          grace_period_days: number | null
          id: string
          is_active: boolean | null
          latest_completion_day: number
          name: string
          phase: string
          updated_at: string | null
        }
        Insert: {
          complexity_score?: number | null
          created_at?: string | null
          deadline_type?: string | null
          description?: string | null
          earliest_start_day: number
          grace_period_days?: number | null
          id?: string
          is_active?: boolean | null
          latest_completion_day: number
          name: string
          phase: string
          updated_at?: string | null
        }
        Update: {
          complexity_score?: number | null
          created_at?: string | null
          deadline_type?: string | null
          description?: string | null
          earliest_start_day?: number
          grace_period_days?: number | null
          id?: string
          is_active?: boolean | null
          latest_completion_day?: number
          name?: string
          phase?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          customer_id: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          renewal_id: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          renewal_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          renewal_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_renewal_id_fkey"
            columns: ["renewal_id"]
            isOneToOne: false
            referencedRelation: "renewals"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_conversations: {
        Row: {
          conversation_type: string
          created_at: string | null
          created_by: string | null
          id: string
          privacy_level: string | null
          renewal_id: string | null
          renewal_task_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          workflow_id: string | null
        }
        Insert: {
          conversation_type: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          privacy_level?: string | null
          renewal_id?: string | null
          renewal_task_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          workflow_id?: string | null
        }
        Update: {
          conversation_type?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          privacy_level?: string | null
          renewal_id?: string | null
          renewal_task_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_conversations_renewal_id_fkey"
            columns: ["renewal_id"]
            isOneToOne: false
            referencedRelation: "renewals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_conversations_renewal_task_id_fkey"
            columns: ["renewal_task_id"]
            isOneToOne: false
            referencedRelation: "renewal_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_conversations_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflows_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      current_schema_status: {
        Row: {
          active_schema: string | null
          description: string | null
          last_switched: string | null
          status_description: string | null
        }
        Relationships: []
      }
      mvp_contacts: {
        Row: {
          company_id: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string | null
          is_primary: boolean | null
          last_name: string | null
          phone: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string | null
          is_primary?: boolean | null
          last_name?: string | null
          phone?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string | null
          is_primary?: boolean | null
          last_name?: string | null
          phone?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      schema_status: {
        Row: {
          complexity_level: string | null
          description: string | null
          schema_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      authenticate_local_user: {
        Args: { user_email: string; user_password: string }
        Returns: {
          auth_type: string
          company_name: string
          full_name: string
          user_id: string
          email: string
        }[]
      }
      create_local_user: {
        Args: {
          user_company_name?: string
          user_email: string
          user_full_name?: string
          user_password: string
        }
        Returns: string
      }
      generate_renewal_tasks: {
        Args: { renewal_uuid: string }
        Returns: undefined
      }
      get_next_priority_task: {
        Args: { override_date?: string }
        Returns: {
          assigned_user_id: string
          action_score: number
          deadline_urgency_score: number
          task_deadline_date: string
          status: string
          outcome_achieved: boolean
          is_overdue: boolean
          completed_at: string
          notes: string
          created_at: string
          updated_at: string
          task_name: string
          task_description: string
          phase: string
          complexity_score: number
          customer_id: string
          customer_name: string
          renewal_date: string
          current_arr: number
          days_to_deadline: number
          id: string
          renewal_id: string
          task_template_id: string
        }[]
      }
      switch_to_schema: {
        Args: { schema_name: string }
        Returns: undefined
      }
      update_action_scores: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_local_user_password: {
        Args: { new_password: string; old_password: string; user_email: string }
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
  graphql_public: {
    Enums: {},
  },
  mvp: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

