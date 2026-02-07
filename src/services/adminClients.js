import { apiFetch } from '../lib/api'

function extractData(response) {
  if (response && typeof response === 'object' && response.data !== undefined) {
    return response.data
  }
  return response
}

function extractMeta(response) {
  if (response && typeof response === 'object' && response.meta !== undefined) {
    return response.meta
  }
  return null
}

export async function listAdminClients(params = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    query.set(key, String(value))
  }
  const suffix = query.toString() ? `?${query.toString()}` : ''
  const response = await apiFetch(`/api/admin/clients${suffix}`)
  return {
    ...(extractData(response) || {}),
    meta: extractMeta(response),
  }
}

export async function createAdminClient(payload) {
  const response = await apiFetch('/api/admin/clients', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return extractData(response)
}

export async function getAdminClient(clientId) {
  const response = await apiFetch(`/api/admin/clients/${clientId}`)
  return extractData(response)
}

export async function updateAdminClient(clientId, payload) {
  const response = await apiFetch(`/api/admin/clients/${clientId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return extractData(response)
}

export async function archiveAdminClient(clientId) {
  const response = await apiFetch(`/api/admin/clients/${clientId}/archive`, {
    method: 'POST',
  })
  return extractData(response)
}

export async function reactivateAdminClient(clientId) {
  const response = await apiFetch(`/api/admin/clients/${clientId}/reactivate`, {
    method: 'POST',
  })
  return extractData(response)
}

export async function listAdminClientProjects(clientId, params = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    query.set(key, String(value))
  }
  const suffix = query.toString() ? `?${query.toString()}` : ''
  const response = await apiFetch(`/api/admin/clients/${clientId}/projects${suffix}`)
  return extractData(response)
}

export async function getAdminClientProgress(clientId) {
  const response = await apiFetch(`/api/admin/clients/${clientId}/progress`)
  return extractData(response)
}

export async function listAdminClientDeliverables(clientId) {
  const response = await apiFetch(`/api/admin/clients/${clientId}/deliverables`)
  return extractData(response)
}

export async function listAdminClientContacts(clientId) {
  const response = await apiFetch(`/api/admin/clients/${clientId}/contacts`)
  return extractData(response)
}

export async function createAdminClientContact(clientId, payload) {
  const response = await apiFetch(`/api/admin/clients/${clientId}/contacts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return extractData(response)
}

export async function updateAdminClientContact(clientId, contactId, payload) {
  const response = await apiFetch(`/api/admin/clients/${clientId}/contacts/${contactId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return extractData(response)
}

export async function deleteAdminClientContact(clientId, contactId) {
  const response = await apiFetch(`/api/admin/clients/${clientId}/contacts/${contactId}`, {
    method: 'DELETE',
  })
  return extractData(response)
}

export async function listAdminClientNotes(clientId) {
  const response = await apiFetch(`/api/admin/clients/${clientId}/notes`)
  return extractData(response)
}

export async function createAdminClientNote(clientId, payload) {
  const response = await apiFetch(`/api/admin/clients/${clientId}/notes`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return extractData(response)
}

export async function updateAdminClientNote(clientId, noteId, payload) {
  const response = await apiFetch(`/api/admin/clients/${clientId}/notes/${noteId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return extractData(response)
}

export async function deleteAdminClientNote(clientId, noteId) {
  const response = await apiFetch(`/api/admin/clients/${clientId}/notes/${noteId}`, {
    method: 'DELETE',
  })
  return extractData(response)
}

export async function listAdminClientActivities(clientId) {
  const response = await apiFetch(`/api/admin/clients/${clientId}/activities`)
  return extractData(response)
}

export async function getAdminClientBillingSummary(clientId) {
  const response = await apiFetch(`/api/admin/clients/${clientId}/billing/summary`)
  return extractData(response)
}

export async function listAdminClientBillingDocuments(clientId) {
  const response = await apiFetch(`/api/admin/clients/${clientId}/billing/documents`)
  return extractData(response)
}
