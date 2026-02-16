export interface Client {
  _id: string
  name: string
  email: string
  companyName?: string
  phone?: string
  website?: string
  status: string
  healthStatus?: string
  serviceType?: string
  ownerAdminId?: { _id: string; name: string }
  createdAt?: string
  updatedAt?: string
}

export interface Contact {
  _id: string
  firstName: string
  lastName?: string
  email?: string
  phone?: string
  isMain?: boolean
  createdAt?: string
}

export interface ContactDraft {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export interface Note {
  _id: string
  content: string
  pinned?: boolean
  createdBy?: { name: string }
  createdAt: string
}

export interface Activity {
  _id: string
  label: string
  type: string
  actorId?: { name: string }
  createdAt: string
}

export interface BillingSummary {
  amountInvoiced?: number
  amountPaid?: number
  amountUnpaid?: number
  unpaidCount?: number
  currency?: string
}

export interface BillingDocument {
  _id: string
  number: string
  type: string
  status: string
  total?: number
  currency?: string
  pdfStoragePath?: string
  paidAt?: string
  project?: { name: string; _id?: string }
  createdAt?: string
}

export interface Deliverable {
  _id: string
  title: string
  projectName: string
  itemType: string
  visibleToClient: boolean
  isDownloadable: boolean
}

export interface CloudInfo {
  enabled: boolean
  clientFolder?: string
  webUrl?: string
  folders?: CloudFolder[]
}

export interface CloudFolder {
  name: string
  webUrl: string
}
