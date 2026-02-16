export type CrmStatus = 'LEAD' | 'QUALIFIED' | 'CONTACTED' | 'DEMO' | 'PROPOSAL' | 'WON' | 'LOST'
export type CrmPriority = 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE'
export type CrmTemperature = 'FROID' | 'TIEDE' | 'CHAUD' | 'TRES_CHAUD'

export interface CrmStatusConfig {
  key: string
  label: string
  color: string
}

export interface Lead {
  _id: string
  company: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  source?: string
  budget?: number | null
  priority?: string
  status: string
  nextActionAt?: string | null
  lastContactAt?: string | null
  statusChangedAt?: string | null
  notes?: string
  serviceType?: string
  leadTemperature?: string
  interactionNotes?: string
  assignedTo?: string | null
  clientAccountId?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface LeadAlert {
  type: 'cold' | 'overdue' | 'stale'
  label: string
  color: string
}

export interface LeadFormData {
  company: string
  contactName: string
  contactEmail: string
  contactPhone: string
  source: string
  budget: string
  priority: string
  status: string
  nextActionAt: string
  notes: string
  serviceType: string
  leadTemperature: string
  interactionNotes: string
  assignedTo: string
}

export interface PipelineColumn {
  status: string
  leads: Lead[]
}

export interface AdminUser {
  _id: string
  name: string
  email: string
  role: string
}

export interface CrmAlerts {
  coldLeads: Lead[]
  overdueLeads: Lead[]
  staleLeads: Lead[]
}
