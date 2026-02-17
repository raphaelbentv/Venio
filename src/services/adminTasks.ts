import { apiFetch } from '../lib/api'
import type { Task, TaskFormData } from '../types/task.types'

export async function fetchTasks(projectId: string): Promise<Task[]> {
  const res = await apiFetch(`/api/admin/projects/${projectId}/tasks`) as { tasks: Task[] }
  return res.tasks
}

export async function createTask(projectId: string, data: Partial<TaskFormData>): Promise<Task> {
  const res = await apiFetch(`/api/admin/projects/${projectId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(data),
  }) as { task: Task }
  return res.task
}

export async function updateTask(projectId: string, taskId: string, data: Partial<TaskFormData>): Promise<Task> {
  const res = await apiFetch(`/api/admin/projects/${projectId}/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }) as { task: Task }
  return res.task
}

export async function moveTask(projectId: string, taskId: string, status: string, order: number): Promise<Task> {
  const res = await apiFetch(`/api/admin/projects/${projectId}/tasks/${taskId}/move`, {
    method: 'PATCH',
    body: JSON.stringify({ status, order }),
  }) as { task: Task }
  return res.task
}

export async function deleteTask(projectId: string, taskId: string): Promise<void> {
  await apiFetch(`/api/admin/projects/${projectId}/tasks/${taskId}`, {
    method: 'DELETE',
  })
}
