export type TaskStatus = 'A_FAIRE' | 'EN_COURS' | 'EN_REVIEW' | 'TERMINE'
export type TaskPriority = 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE'

export interface Task {
  _id: string
  project: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assignee: { _id: string; name: string; email: string } | null
  dueDate: string | null
  tags: string[]
  order: number
  createdBy: { _id: string; name: string; email: string }
  createdAt: string
  updatedAt: string
}

export interface TaskFormData {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assignee: string
  dueDate: string
  tags: string[]
}
