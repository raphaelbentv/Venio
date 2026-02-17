export type ActivityAction =
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_ARCHIVED'
  | 'PROJECT_UNARCHIVED'
  | 'STATUS_CHANGED'
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_MOVED'
  | 'TASK_DELETED'
  | 'TASK_COMMENT_ADDED'
  | 'DOCUMENT_UPLOADED'
  | 'SECTION_CREATED'
  | 'SECTION_DELETED'
  | 'ITEM_CREATED'
  | 'ITEM_DELETED'
  | 'UPDATE_POSTED'
  | 'BILLING_CREATED'

export interface ActivityLog {
  _id: string
  project: string
  action: ActivityAction
  actor: { _id: string; name: string; email: string } | string
  summary: string
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}
