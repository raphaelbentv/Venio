import { apiFetch } from '../lib/api'

export async function listCloudFiles(path = '') {
  const query = path ? `?path=${encodeURIComponent(path)}` : ''
  return apiFetch(`/api/admin/cloud/list${query}`)
}

export async function createCloudFolder(path) {
  return apiFetch('/api/admin/cloud/mkdir', {
    method: 'POST',
    body: JSON.stringify({ path }),
  })
}

export async function uploadCloudFile(path, file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const base64 = reader.result.split(',')[1]
        const result = await apiFetch('/api/admin/cloud/upload', {
          method: 'POST',
          body: JSON.stringify({
            path,
            content: base64,
            contentType: file.type || 'application/octet-stream',
          }),
        })
        resolve(result)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Erreur lecture du fichier'))
    reader.readAsDataURL(file)
  })
}

export function getCloudDownloadUrl(path) {
  return `/api/admin/cloud/download?path=${encodeURIComponent(path)}`
}

export async function deleteCloudItem(path) {
  return apiFetch(`/api/admin/cloud/delete?path=${encodeURIComponent(path)}`, {
    method: 'DELETE',
  })
}

export async function moveCloudItem(from, to) {
  return apiFetch('/api/admin/cloud/move', {
    method: 'POST',
    body: JSON.stringify({ from, to }),
  })
}
