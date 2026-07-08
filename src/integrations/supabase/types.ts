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
      accounts: {
        Row: {
          buying_motive: string | null
          created_at: string
          deal_type_default: string | null
          email: string | null
          expansion_notes: string | null
          health_score: number | null
          id: string
          lat: number | null
          lng: number | null
          location: string | null
          name: string
          owner_user_id: string | null
          phone: string | null
          portfolio_size: string
          segment: string | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          buying_motive?: string | null
          created_at?: string
          deal_type_default?: string | null
          email?: string | null
          expansion_notes?: string | null
          health_score?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string | null
          name: string
          owner_user_id?: string | null
          phone?: string | null
          portfolio_size?: string
          segment?: string | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          buying_motive?: string | null
          created_at?: string
          deal_type_default?: string | null
          email?: string | null
          expansion_notes?: string | null
          health_score?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string | null
          name?: string
          owner_user_id?: string | null
          phone?: string | null
          portfolio_size?: string
          segment?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_playbooks: {
        Row: {
          asset_id: string
          created_at: string
          id: string
          playbook_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          id?: string
          playbook_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          id?: string
          playbook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_playbooks_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_playbooks_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "playbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_file_ref: string | null
          asset_type: string
          asset_url: string | null
          created_at: string
          created_by_user_id: string | null
          description: string | null
          id: string
          name: string
          status: string
          storage_method: string
          updated_at: string
          updated_by_user_id: string | null
          workspace_id: string
        }
        Insert: {
          asset_file_ref?: string | null
          asset_type: string
          asset_url?: string | null
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string
          storage_method?: string
          updated_at?: string
          updated_by_user_id?: string | null
          workspace_id: string
        }
        Update: {
          asset_file_ref?: string | null
          asset_type?: string
          asset_url?: string | null
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string
          storage_method?: string
          updated_at?: string
          updated_by_user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          account_id: string
          created_at: string
          email: string | null
          id: string
          linkedin_url: string | null
          name: string
          next_action: string | null
          next_action_date: string | null
          notes: string | null
          owner_user_id: string | null
          phone: string | null
          referred_by: string | null
          role_type: string | null
          title: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          email?: string | null
          id?: string
          linkedin_url?: string | null
          name: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          owner_user_id?: string | null
          phone?: string | null
          referred_by?: string | null
          role_type?: string | null
          title?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          email?: string | null
          id?: string
          linkedin_url?: string | null
          name?: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          owner_user_id?: string | null
          phone?: string | null
          referred_by?: string | null
          role_type?: string | null
          title?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_files: {
        Row: {
          contractor_type: string | null
          deal_id: string
          file_category: string | null
          file_name: string
          file_ref: string
          file_type: string
          id: string
          uploaded_at: string
          uploaded_by: string | null
          workspace_id: string
        }
        Insert: {
          contractor_type?: string | null
          deal_id: string
          file_category?: string | null
          file_name: string
          file_ref: string
          file_type: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
          workspace_id: string
        }
        Update: {
          contractor_type?: string | null
          deal_id?: string
          file_category?: string | null
          file_name?: string
          file_ref?: string
          file_type?: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_files_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_files_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          account_id: string
          buying_motive: string | null
          created_at: string
          deal_name: string | null
          deal_size_range: string | null
          deal_type: string[] | null
          external_id: string | null
          id: string
          internal_notes: string | null
          last_meaningful_activity_date: string | null
          next_action: string | null
          next_action_date: string | null
          objection_notes: string | null
          owner_user_id: string | null
          playbook_assigned_at: string | null
          playbook_assigned_by: string | null
          playbook_id: string | null
          primary_buyer_role: string | null
          primary_contact_id: string | null
          primary_objection: string | null
          probability: number | null
          project_city: string | null
          project_state: string | null
          project_street: string | null
          project_zip: string | null
          proposal_link: string | null
          proposal_requested_date: string | null
          proposal_submitted_date: string | null
          site_notes: string | null
          stage: string
          status: string
          trigger_signal: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          account_id: string
          buying_motive?: string | null
          created_at?: string
          deal_name?: string | null
          deal_size_range?: string | null
          deal_type?: string[] | null
          external_id?: string | null
          id?: string
          internal_notes?: string | null
          last_meaningful_activity_date?: string | null
          next_action?: string | null
          next_action_date?: string | null
          objection_notes?: string | null
          owner_user_id?: string | null
          playbook_assigned_at?: string | null
          playbook_assigned_by?: string | null
          playbook_id?: string | null
          primary_buyer_role?: string | null
          primary_contact_id?: string | null
          primary_objection?: string | null
          probability?: number | null
          project_city?: string | null
          project_state?: string | null
          project_street?: string | null
          project_zip?: string | null
          proposal_link?: string | null
          proposal_requested_date?: string | null
          proposal_submitted_date?: string | null
          site_notes?: string | null
          stage?: string
          status?: string
          trigger_signal?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          account_id?: string
          buying_motive?: string | null
          created_at?: string
          deal_name?: string | null
          deal_size_range?: string | null
          deal_type?: string[] | null
          external_id?: string | null
          id?: string
          internal_notes?: string | null
          last_meaningful_activity_date?: string | null
          next_action?: string | null
          next_action_date?: string | null
          objection_notes?: string | null
          owner_user_id?: string | null
          playbook_assigned_at?: string | null
          playbook_assigned_by?: string | null
          playbook_id?: string | null
          primary_buyer_role?: string | null
          primary_contact_id?: string | null
          primary_objection?: string | null
          probability?: number | null
          project_city?: string | null
          project_state?: string | null
          project_street?: string | null
          project_zip?: string | null
          proposal_link?: string | null
          proposal_requested_date?: string | null
          proposal_submitted_date?: string | null
          site_notes?: string | null
          stage?: string
          status?: string
          trigger_signal?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "playbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          commitments: string | null
          contact_id: string | null
          created_at: string
          created_by_user_id: string | null
          deal_id: string | null
          external_ref: string | null
          id: string
          key_points: Json | null
          next_action: string | null
          next_action_date: string | null
          objections: string | null
          occurred_at: string
          participants: Json | null
          summary: string | null
          type: string
          workspace_id: string
        }
        Insert: {
          commitments?: string | null
          contact_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          deal_id?: string | null
          external_ref?: string | null
          id?: string
          key_points?: Json | null
          next_action?: string | null
          next_action_date?: string | null
          objections?: string | null
          occurred_at?: string
          participants?: Json | null
          summary?: string | null
          type: string
          workspace_id: string
        }
        Update: {
          commitments?: string | null
          contact_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          deal_id?: string | null
          external_ref?: string | null
          id?: string
          key_points?: Json | null
          next_action?: string | null
          next_action_date?: string | null
          objections?: string | null
          occurred_at?: string
          participants?: Json | null
          summary?: string | null
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_contacts: {
        Row: {
          contact_id: string
          created_at: string | null
          id: string
          lead_id: string
          workspace_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          id?: string
          lead_id: string
          workspace_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          id?: string
          lead_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_contacts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_contacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_stakeholders: {
        Row: {
          confidence: string | null
          created_at: string | null
          email: string | null
          id: string
          lead_id: string
          linkedin_url: string | null
          notes: string | null
          phone: string | null
          stakeholder_name: string | null
          stakeholder_role_type: string
          title: string | null
          workspace_id: string
        }
        Insert: {
          confidence?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          lead_id: string
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          stakeholder_name?: string | null
          stakeholder_role_type?: string
          title?: string | null
          workspace_id: string
        }
        Update: {
          confidence?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          lead_id?: string
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          stakeholder_name?: string | null
          stakeholder_role_type?: string
          title?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_stakeholders_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_stakeholders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company: string
          contact_notes: string | null
          created_at: string
          deal_id: string | null
          estimated_timeline: string | null
          external_id: string | null
          facility_type: string | null
          first_touch_email: string | null
          health_score: number | null
          id: string
          lat: number | null
          linkedin_dm: string | null
          lng: number | null
          location: string
          owner_user_id: string | null
          project_name: string
          recommended_playbook: string | null
          signal_details: Json | null
          signal_reason: string | null
          source_links: Json | null
          stakeholders_json: Json | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          company: string
          contact_notes?: string | null
          created_at?: string
          deal_id?: string | null
          estimated_timeline?: string | null
          external_id?: string | null
          facility_type?: string | null
          first_touch_email?: string | null
          health_score?: number | null
          id?: string
          lat?: number | null
          linkedin_dm?: string | null
          lng?: number | null
          location: string
          owner_user_id?: string | null
          project_name: string
          recommended_playbook?: string | null
          signal_details?: Json | null
          signal_reason?: string | null
          source_links?: Json | null
          stakeholders_json?: Json | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          company?: string
          contact_notes?: string | null
          created_at?: string
          deal_id?: string | null
          estimated_timeline?: string | null
          external_id?: string | null
          facility_type?: string | null
          first_touch_email?: string | null
          health_score?: number | null
          id?: string
          lat?: number | null
          linkedin_dm?: string | null
          lng?: number | null
          location?: string
          owner_user_id?: string | null
          project_name?: string
          recommended_playbook?: string | null
          signal_details?: Json | null
          signal_reason?: string | null
          source_links?: Json | null
          stakeholders_json?: Json | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ms_outlook_connections: {
        Row: {
          access_token: string | null
          connected_at: string
          id: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          connected_at?: string
          id?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          connected_at?: string
          id?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pending_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invite_code: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          used_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invite_code: string
          invited_by: string
          role?: Database["public"]["Enums"]["app_role"]
          used_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invite_code?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          used_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      playbooks: {
        Row: {
          associated_deal_type: string | null
          created_at: string
          created_by: string | null
          default_nurture_tag: string | null
          design_details: string | null
          dtype_new_construction: string | null
          dtype_retrofit: string | null
          eng_one_time: string | null
          eng_phased: string | null
          eng_retainer: string | null
          exit_rule: string | null
          expansion_seed: string | null
          expedited: boolean | null
          first_message_email_template: string | null
          first_message_linkedin_template: string | null
          followup_day10_template: string | null
          followup_day21_template: string | null
          followup_day3_template: string | null
          id: string
          kind: string
          name: string
          objective: string | null
          opp_design: string | null
          opp_policy: string | null
          opp_programming: string | null
          owner_user_id: string | null
          policy_details: string | null
          programming_details: string | null
          proof_asset_file_ref: string | null
          proof_asset_id: string | null
          proof_asset_label: string | null
          proof_asset_type: string | null
          proof_asset_url: string | null
          secondary_proof_asset_id: string | null
          status: string
          trigger: string | null
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          associated_deal_type?: string | null
          created_at?: string
          created_by?: string | null
          default_nurture_tag?: string | null
          design_details?: string | null
          dtype_new_construction?: string | null
          dtype_retrofit?: string | null
          eng_one_time?: string | null
          eng_phased?: string | null
          eng_retainer?: string | null
          exit_rule?: string | null
          expansion_seed?: string | null
          expedited?: boolean | null
          first_message_email_template?: string | null
          first_message_linkedin_template?: string | null
          followup_day10_template?: string | null
          followup_day21_template?: string | null
          followup_day3_template?: string | null
          id?: string
          kind?: string
          name: string
          objective?: string | null
          opp_design?: string | null
          opp_policy?: string | null
          opp_programming?: string | null
          owner_user_id?: string | null
          policy_details?: string | null
          programming_details?: string | null
          proof_asset_file_ref?: string | null
          proof_asset_id?: string | null
          proof_asset_label?: string | null
          proof_asset_type?: string | null
          proof_asset_url?: string | null
          secondary_proof_asset_id?: string | null
          status?: string
          trigger?: string | null
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          associated_deal_type?: string | null
          created_at?: string
          created_by?: string | null
          default_nurture_tag?: string | null
          design_details?: string | null
          dtype_new_construction?: string | null
          dtype_retrofit?: string | null
          eng_one_time?: string | null
          eng_phased?: string | null
          eng_retainer?: string | null
          exit_rule?: string | null
          expansion_seed?: string | null
          expedited?: boolean | null
          first_message_email_template?: string | null
          first_message_linkedin_template?: string | null
          followup_day10_template?: string | null
          followup_day21_template?: string | null
          followup_day3_template?: string | null
          id?: string
          kind?: string
          name?: string
          objective?: string | null
          opp_design?: string | null
          opp_policy?: string | null
          opp_programming?: string | null
          owner_user_id?: string | null
          policy_details?: string | null
          programming_details?: string | null
          proof_asset_file_ref?: string | null
          proof_asset_id?: string | null
          proof_asset_label?: string | null
          proof_asset_type?: string | null
          proof_asset_url?: string | null
          secondary_proof_asset_id?: string | null
          status?: string
          trigger?: string | null
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbooks_proof_asset_id_fkey"
            columns: ["proof_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbooks_secondary_proof_asset_id_fkey"
            columns: ["secondary_proof_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbooks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_reports: {
        Row: {
          advanced_overrides: Json | null
          community_address: string | null
          community_name: string | null
          comps_radius: number | null
          created_at: string
          deal_id: string | null
          demographics: Json | null
          expires_at: string
          fitness_comps: Json | null
          id: string
          map_center: Json | null
          multifamily_comps: Json | null
          outputs: Json | null
          owner_user_id: string
          property_class: string | null
          sf_override: number | null
          token: string
          units: number | null
          workspace_id: string
        }
        Insert: {
          advanced_overrides?: Json | null
          community_address?: string | null
          community_name?: string | null
          comps_radius?: number | null
          created_at?: string
          deal_id?: string | null
          demographics?: Json | null
          expires_at?: string
          fitness_comps?: Json | null
          id?: string
          map_center?: Json | null
          multifamily_comps?: Json | null
          outputs?: Json | null
          owner_user_id: string
          property_class?: string | null
          sf_override?: number | null
          token: string
          units?: number | null
          workspace_id: string
        }
        Update: {
          advanced_overrides?: Json | null
          community_address?: string | null
          community_name?: string | null
          comps_radius?: number | null
          created_at?: string
          deal_id?: string | null
          demographics?: Json | null
          expires_at?: string
          fitness_comps?: Json | null
          id?: string
          map_center?: Json | null
          multifamily_comps?: Json | null
          outputs?: Json | null
          owner_user_id?: string
          property_class?: string | null
          sf_override?: number | null
          token?: string
          units?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_reports_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_reports_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_contractor_items: {
        Row: {
          contractor_type: string
          created_at: string
          design_fee: number
          flat_fee: number
          id: string
          markup_percentage: number
          quote_id: string
          shipping_fee: number
          sort_order: number
          updated_at: string
          vendor_name: string | null
          workspace_id: string
        }
        Insert: {
          contractor_type: string
          created_at?: string
          design_fee?: number
          flat_fee?: number
          id?: string
          markup_percentage?: number
          quote_id: string
          shipping_fee?: number
          sort_order?: number
          updated_at?: string
          vendor_name?: string | null
          workspace_id: string
        }
        Update: {
          contractor_type?: string
          created_at?: string
          design_fee?: number
          flat_fee?: number
          id?: string
          markup_percentage?: number
          quote_id?: string
          shipping_fee?: number
          sort_order?: number
          updated_at?: string
          vendor_name?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_contractor_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_contractor_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          contact_id: string | null
          created_at: string
          deal_id: string
          decision_maker_count: number | null
          discount_reason: string | null
          discount_type: string | null
          discount_value: number
          engagement_type: string | null
          hourly_rate: number
          id: string
          include_discount_reason_on_pdf: boolean
          owner_user_id: string | null
          phase_concept_hours: number
          phase_consultation_hours: number
          phase_handoff_hours: number
          phase_pm_hours: number
          phase_policy_creation_hours: number
          phase_program_creation_hours: number
          phase_revisions_hours: number
          phase_revisions_rounds: number
          phase_sourcing_hours: number
          redloft_contact_email: string | null
          redloft_contact_name: string | null
          redloft_contact_phone: string | null
          redloft_contact_title: string | null
          service_category: string[] | null
          service_details: Json
          snapshot_contact_email: string | null
          snapshot_contact_name: string | null
          snapshot_contact_phone: string | null
          snapshot_project_address: string | null
          snapshot_project_name: string | null
          snapshot_referral_source: string | null
          sow_approach_pillars: string[] | null
          sow_deliverables: Json
          sow_estimated_hours_max: number | null
          sow_estimated_hours_min: number | null
          sow_executive_summary: string | null
          sow_expense_threshold: number
          sow_invoice_terms: string | null
          sow_invoicing_cadence: string | null
          sow_milestones: Json
          sow_nte_amount: number | null
          sow_nte_enabled: boolean
          sow_problem_statement: string | null
          sow_proposed_approach: string | null
          status: string
          timeline_urgency: string | null
          updated_at: string
          version_number: number
          workspace_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          deal_id: string
          decision_maker_count?: number | null
          discount_reason?: string | null
          discount_type?: string | null
          discount_value?: number
          engagement_type?: string | null
          hourly_rate?: number
          id?: string
          include_discount_reason_on_pdf?: boolean
          owner_user_id?: string | null
          phase_concept_hours?: number
          phase_consultation_hours?: number
          phase_handoff_hours?: number
          phase_pm_hours?: number
          phase_policy_creation_hours?: number
          phase_program_creation_hours?: number
          phase_revisions_hours?: number
          phase_revisions_rounds?: number
          phase_sourcing_hours?: number
          redloft_contact_email?: string | null
          redloft_contact_name?: string | null
          redloft_contact_phone?: string | null
          redloft_contact_title?: string | null
          service_category?: string[] | null
          service_details?: Json
          snapshot_contact_email?: string | null
          snapshot_contact_name?: string | null
          snapshot_contact_phone?: string | null
          snapshot_project_address?: string | null
          snapshot_project_name?: string | null
          snapshot_referral_source?: string | null
          sow_approach_pillars?: string[] | null
          sow_deliverables?: Json
          sow_estimated_hours_max?: number | null
          sow_estimated_hours_min?: number | null
          sow_executive_summary?: string | null
          sow_expense_threshold?: number
          sow_invoice_terms?: string | null
          sow_invoicing_cadence?: string | null
          sow_milestones?: Json
          sow_nte_amount?: number | null
          sow_nte_enabled?: boolean
          sow_problem_statement?: string | null
          sow_proposed_approach?: string | null
          status?: string
          timeline_urgency?: string | null
          updated_at?: string
          version_number?: number
          workspace_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          deal_id?: string
          decision_maker_count?: number | null
          discount_reason?: string | null
          discount_type?: string | null
          discount_value?: number
          engagement_type?: string | null
          hourly_rate?: number
          id?: string
          include_discount_reason_on_pdf?: boolean
          owner_user_id?: string | null
          phase_concept_hours?: number
          phase_consultation_hours?: number
          phase_handoff_hours?: number
          phase_pm_hours?: number
          phase_policy_creation_hours?: number
          phase_program_creation_hours?: number
          phase_revisions_hours?: number
          phase_revisions_rounds?: number
          phase_sourcing_hours?: number
          redloft_contact_email?: string | null
          redloft_contact_name?: string | null
          redloft_contact_phone?: string | null
          redloft_contact_title?: string | null
          service_category?: string[] | null
          service_details?: Json
          snapshot_contact_email?: string | null
          snapshot_contact_name?: string | null
          snapshot_contact_phone?: string | null
          snapshot_project_address?: string | null
          snapshot_project_name?: string | null
          snapshot_referral_source?: string | null
          sow_approach_pillars?: string[] | null
          sow_deliverables?: Json
          sow_estimated_hours_max?: number | null
          sow_estimated_hours_min?: number | null
          sow_executive_summary?: string | null
          sow_expense_threshold?: number
          sow_invoice_terms?: string | null
          sow_invoicing_cadence?: string | null
          sow_milestones?: Json
          sow_nte_amount?: number | null
          sow_nte_enabled?: boolean
          sow_problem_statement?: string | null
          sow_proposed_approach?: string | null
          status?: string
          timeline_urgency?: string | null
          updated_at?: string
          version_number?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sm_assets: {
        Row: {
          asset_type: string
          created_at: string
          created_by: string | null
          file_url: string
          id: string
          notes: string | null
          tags: string[] | null
          thumbnail_url: string | null
          workspace_id: string
        }
        Insert: {
          asset_type: string
          created_at?: string
          created_by?: string | null
          file_url: string
          id?: string
          notes?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          workspace_id: string
        }
        Update: {
          asset_type?: string
          created_at?: string
          created_by?: string | null
          file_url?: string
          id?: string
          notes?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sm_assets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sm_campaigns: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          default_cta_style: string | null
          description_brief: string | null
          do_dont_guidance: string | null
          id: string
          is_active: boolean
          keyword_tags: string[] | null
          name: string
          platforms: string[]
          recurrence_rule: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by?: string | null
          default_cta_style?: string | null
          description_brief?: string | null
          do_dont_guidance?: string | null
          id?: string
          is_active?: boolean
          keyword_tags?: string[] | null
          name: string
          platforms?: string[]
          recurrence_rule?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          default_cta_style?: string | null
          description_brief?: string | null
          do_dont_guidance?: string | null
          id?: string
          is_active?: boolean
          keyword_tags?: string[] | null
          name?: string
          platforms?: string[]
          recurrence_rule?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sm_campaigns_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sm_content_assets: {
        Row: {
          asset_id: string
          content_item_id: string
          display_order: number
          id: string
        }
        Insert: {
          asset_id: string
          content_item_id: string
          display_order?: number
          id?: string
        }
        Update: {
          asset_id?: string
          content_item_id?: string
          display_order?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sm_content_assets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "sm_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sm_content_assets_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "sm_content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      sm_content_items: {
        Row: {
          campaign_id: string | null
          caption: string | null
          created_at: string
          created_by: string | null
          hashtags_saved: string[] | null
          hashtags_suggested: string[] | null
          id: string
          override_date: string | null
          platform: string
          schedule_slot_id: string | null
          status: string
          title: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          campaign_id?: string | null
          caption?: string | null
          created_at?: string
          created_by?: string | null
          hashtags_saved?: string[] | null
          hashtags_suggested?: string[] | null
          id?: string
          override_date?: string | null
          platform: string
          schedule_slot_id?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          campaign_id?: string | null
          caption?: string | null
          created_at?: string
          created_by?: string | null
          hashtags_saved?: string[] | null
          hashtags_suggested?: string[] | null
          id?: string
          override_date?: string | null
          platform?: string
          schedule_slot_id?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sm_content_items_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sm_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sm_content_items_schedule_slot_id_fkey"
            columns: ["schedule_slot_id"]
            isOneToOne: false
            referencedRelation: "sm_schedule_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sm_content_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sm_schedule_slots: {
        Row: {
          campaign_id: string | null
          created_at: string
          id: string
          platform: string
          scheduled_date: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          id?: string
          platform: string
          scheduled_date: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          id?: string
          platform?: string
          scheduled_date?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sm_schedule_slots_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sm_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sm_schedule_slots_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admin_workspace_overrides: {
        Row: {
          active_workspace_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_workspace_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_workspace_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "super_admin_workspace_overrides_active_workspace_id_fkey"
            columns: ["active_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          deal_id: string | null
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      trainers: {
        Row: {
          account_id: string | null
          address: string | null
          career_health_score: number | null
          career_mentions: string | null
          created_at: string
          email: string | null
          id: string
          instagram_url: string | null
          lat: number | null
          linkedin_url: string | null
          lng: number | null
          name: string
          phone: string | null
          source_links: Json | null
          updated_at: string
          website_url: string | null
          workspace_id: string
        }
        Insert: {
          account_id?: string | null
          address?: string | null
          career_health_score?: number | null
          career_mentions?: string | null
          created_at?: string
          email?: string | null
          id?: string
          instagram_url?: string | null
          lat?: number | null
          linkedin_url?: string | null
          lng?: number | null
          name: string
          phone?: string | null
          source_links?: Json | null
          updated_at?: string
          website_url?: string | null
          workspace_id: string
        }
        Update: {
          account_id?: string | null
          address?: string | null
          career_health_score?: number | null
          career_mentions?: string | null
          created_at?: string
          email?: string | null
          id?: string
          instagram_url?: string | null
          lat?: number | null
          linkedin_url?: string | null
          lng?: number | null
          name?: string
          phone?: string | null
          source_links?: Json | null
          updated_at?: string
          website_url?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainers_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workspace_permissions: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          created_at: string
          id: string
          resource: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          resource: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          resource?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_permissions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_pipeline_stages: {
        Row: {
          created_at: string
          id: string
          stages: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stages: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stages?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_pipeline_stages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_pull_configs: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          search_context: string | null
          signal_types: Json
          updated_at: string
          verticals: Json
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          search_context?: string | null
          signal_types?: Json
          updated_at?: string
          verticals?: Json
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          search_context?: string | null
          signal_types?: Json
          updated_at?: string
          verticals?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_pull_configs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "super_admin" | "admin" | "moderator" | "user"
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
      app_role: ["super_admin", "admin", "moderator", "user"],
    },
  },
} as const
