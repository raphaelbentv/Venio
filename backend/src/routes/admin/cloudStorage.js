import { Router } from 'express'
import auth from '../../middleware/auth.js'
import { requireAdmin } from '../../middleware/role.js'

const router = Router()

const NEXTCLOUD_BASE = process.env.NEXTCLOUD_URL || 'https://cloud.susanoo.app'
const NEXTCLOUD_USER = process.env.NEXTCLOUD_USERNAME || ''
const NEXTCLOUD_PASS = process.env.NEXTCLOUD_PASSWORD || ''
const NEXTCLOUD_ROOT = process.env.NEXTCLOUD_ROOT_FOLDER || 'Venio'

function getWebdavUrl(subPath = '') {
  const cleanPath = subPath.replace(/^\/+/, '').replace(/\/+$/, '')
  const root = `${NEXTCLOUD_ROOT}${cleanPath ? '/' + cleanPath : ''}`
  return `${NEXTCLOUD_BASE}/remote.php/dav/files/${NEXTCLOUD_USER}/${root}`
}

function getAuthHeader() {
  const credentials = Buffer.from(`${NEXTCLOUD_USER}:${NEXTCLOUD_PASS}`).toString('base64')
  return `Basic ${credentials}`
}

function parseWebdavXml(xml, requestedPath) {
  const items = []
  const responses = xml.split('<d:response>').slice(1)

  for (const block of responses) {
    const hrefMatch = block.match(/<d:href>([^<]+)<\/d:href>/)
    if (!hrefMatch) continue

    const href = decodeURIComponent(hrefMatch[1])
    const isCollection = block.includes('<d:collection')
    const sizeMatch = block.match(/<d:getcontentlength>(\d+)<\/d:getcontentlength>/)
    const lastModMatch = block.match(/<d:getlastmodified>([^<]+)<\/d:getlastmodified>/)
    const contentTypeMatch = block.match(/<d:getcontenttype>([^<]+)<\/d:getcontenttype>/)
    const etagMatch = block.match(/<d:getetag>"?([^"<]+)"?<\/d:getetag>/)

    const parts = href.replace(/\/+$/, '').split('/')
    const name = parts[parts.length - 1] || ''

    const rootIndex = href.indexOf(`/${NEXTCLOUD_ROOT}`)
    let relativePath = ''
    if (rootIndex !== -1) {
      relativePath = href.slice(rootIndex + NEXTCLOUD_ROOT.length + 1).replace(/^\/+/, '').replace(/\/+$/, '')
    }

    items.push({
      name,
      href,
      relativePath,
      isDirectory: isCollection,
      size: sizeMatch ? parseInt(sizeMatch[1], 10) : 0,
      lastModified: lastModMatch ? lastModMatch[1] : null,
      contentType: contentTypeMatch ? contentTypeMatch[1] : (isCollection ? 'directory' : 'application/octet-stream'),
      etag: etagMatch ? etagMatch[1] : null,
    })
  }

  const normalizedRequested = requestedPath.replace(/^\/+/, '').replace(/\/+$/, '')
  return items.filter((item) => {
    if (item.relativePath === normalizedRequested && item.isDirectory) return false
    return true
  })
}

// List files/folders in a path
router.get('/list', auth, requireAdmin, async (req, res) => {
  try {
    const subPath = req.query.path || ''
    const url = getWebdavUrl(subPath)

    const response = await fetch(url, {
      method: 'PROPFIND',
      headers: {
        Authorization: getAuthHeader(),
        Depth: '1',
        'Content-Type': 'application/xml',
      },
      body: `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:displayname/>
    <d:getcontentlength/>
    <d:getlastmodified/>
    <d:getcontenttype/>
    <d:resourcetype/>
    <d:getetag/>
  </d:prop>
</d:propfind>`,
    })

    if (response.status === 404) {
      return res.json({ items: [], path: subPath })
    }

    if (!response.ok) {
      const text = await response.text()
      return res.status(response.status).json({ error: `Nextcloud error: ${response.status}`, details: text })
    }

    const xml = await response.text()
    const items = parseWebdavXml(xml, subPath)

    items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      return a.name.localeCompare(b.name, 'fr')
    })

    return res.json({ items, path: subPath })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

// Create a folder
router.post('/mkdir', auth, requireAdmin, async (req, res) => {
  try {
    const { path: folderPath } = req.body
    if (!folderPath) return res.status(400).json({ error: 'path is required' })

    const url = getWebdavUrl(folderPath)

    const response = await fetch(url, {
      method: 'MKCOL',
      headers: {
        Authorization: getAuthHeader(),
      },
    })

    if (response.status === 405) {
      return res.status(409).json({ error: 'Le dossier existe déjà' })
    }

    if (!response.ok) {
      const text = await response.text()
      return res.status(response.status).json({ error: `Erreur création dossier: ${response.status}`, details: text })
    }

    return res.json({ success: true, path: folderPath })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

// Upload a file (receives base64 body)
router.post('/upload', auth, requireAdmin, async (req, res) => {
  try {
    const { path: filePath, content, contentType } = req.body
    if (!filePath || !content) return res.status(400).json({ error: 'path and content are required' })

    const fileBuffer = Buffer.from(content, 'base64')
    const url = getWebdavUrl(filePath)

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': contentType || 'application/octet-stream',
      },
      body: fileBuffer,
    })

    if (!response.ok) {
      const text = await response.text()
      return res.status(response.status).json({ error: `Erreur upload: ${response.status}`, details: text })
    }

    return res.json({ success: true, path: filePath })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

// Download / get a file (proxy)
router.get('/download', auth, requireAdmin, async (req, res) => {
  try {
    const subPath = req.query.path
    if (!subPath) return res.status(400).json({ error: 'path is required' })

    const url = getWebdavUrl(subPath)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: getAuthHeader(),
      },
    })

    if (!response.ok) {
      return res.status(response.status).json({ error: `Erreur téléchargement: ${response.status}` })
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const contentDisposition = response.headers.get('content-disposition')

    res.setHeader('Content-Type', contentType)
    if (contentDisposition) {
      res.setHeader('Content-Disposition', contentDisposition)
    } else {
      const fileName = subPath.split('/').pop()
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`)
    }

    const buffer = await response.arrayBuffer()
    return res.send(Buffer.from(buffer))
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

// Delete a file or folder
router.delete('/delete', auth, requireAdmin, async (req, res) => {
  try {
    const subPath = req.query.path
    if (!subPath) return res.status(400).json({ error: 'path is required' })

    const url = getWebdavUrl(subPath)

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: getAuthHeader(),
      },
    })

    if (!response.ok) {
      const text = await response.text()
      return res.status(response.status).json({ error: `Erreur suppression: ${response.status}`, details: text })
    }

    return res.json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

// Rename / move a file or folder
router.post('/move', auth, requireAdmin, async (req, res) => {
  try {
    const { from, to } = req.body
    if (!from || !to) return res.status(400).json({ error: 'from and to are required' })

    const fromUrl = getWebdavUrl(from)
    const toUrl = getWebdavUrl(to)

    const response = await fetch(fromUrl, {
      method: 'MOVE',
      headers: {
        Authorization: getAuthHeader(),
        Destination: toUrl,
        Overwrite: 'F',
      },
    })

    if (!response.ok) {
      const text = await response.text()
      return res.status(response.status).json({ error: `Erreur déplacement: ${response.status}`, details: text })
    }

    return res.json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

export default router
