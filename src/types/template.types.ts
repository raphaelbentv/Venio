export interface TemplateSection {
  title: string
  description: string
}

export interface TemplateTask {
  title: string
  description: string
  priority: string
}

export interface ProjectTemplate {
  _id: string
  name: string
  description: string
  serviceTypes: string[]
  deliverableTypes: string[]
  tags: string[]
  priority: string
  defaultSections: TemplateSection[]
  defaultTasks: TemplateTask[]
  budget: { amount: number | null; currency: string }
  createdAt: string
  updatedAt: string
}
