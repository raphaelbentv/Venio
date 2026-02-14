/**
 * Nextcloud WebDAV integration for automatic folder creation
 *
 * Uses WebDAV MKCOL to create folders on Nextcloud when a client account is created.
 * Requires the following environment variables:
 * - NEXTCLOUD_URL: Base URL of the Nextcloud instance (e.g., https://cloud.example.com)
 * - NEXTCLOUD_USER: Nextcloud username
 * - NEXTCLOUD_APP_PASSWORD: App password (generate in Nextcloud > Settings > Security > App passwords)
 * - NEXTCLOUD_BASE_PATH: Base path for client folders (e.g., /Venio/Clients)
 */

// Getters to read env vars at runtime (after dotenv has loaded them)
const getConfig = () => ({
  url: process.env.NEXTCLOUD_URL || '',
  user: process.env.NEXTCLOUD_USER || '',
  password: process.env.NEXTCLOUD_APP_PASSWORD || '',
  basePath: process.env.NEXTCLOUD_BASE_PATH || '/Venio/Clients',
})

const isConfigured = () => {
  const { url, user, password } = getConfig()
  return Boolean(url && user && password)
}

// Log warning once on first use if not configured
let hasLoggedWarning = false

// Subfolders to create for each client
const CLIENT_SUBFOLDERS = [
  'Contrats',
  'Devis',
  'Factures',
  'Livrables',
  'Communication',
  'Briefs',
  'Assets',
]

/**
 * Sanitize a folder name to prevent path traversal and invalid characters
 * @param {string} name - The raw folder name
 * @returns {string} - Sanitized folder name
 */
function sanitizeFolderName(name) {
  if (!name || typeof name !== 'string') return ''

  return name
    .trim()
    // Remove path separators and traversal attempts
    .replace(/[/\\]/g, '-')
    .replace(/\.\./g, '')
    // Remove characters that are problematic in URLs or file systems
    .replace(/[<>:"|?*]/g, '')
    // Collapse multiple dashes/spaces
    .replace(/--+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Build the WebDAV URL for a given path
 * @param {string} path - Path relative to the user's files
 * @returns {string} - Full WebDAV URL
 */
function buildWebDavUrl(path) {
  const { url, user } = getConfig()
  // Remove leading slash from path if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  // Encode each path segment separately to handle special characters
  const encodedPath = cleanPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
  return `${url}/remote.php/dav/files/${user}/${encodedPath}`
}

/**
 * Build the Authorization header for Basic Auth
 * @returns {string} - Basic auth header value
 */
function buildAuthHeader() {
  const { user, password } = getConfig()
  const credentials = Buffer.from(`${user}:${password}`).toString('base64')
  return `Basic ${credentials}`
}

/**
 * Create a single folder via WebDAV MKCOL
 * @param {string} path - Full path of the folder to create (e.g., /Venio/Clients/Acme)
 * @returns {Promise<{ success: boolean, alreadyExists?: boolean, error?: string }>}
 */
export async function createFolder(path) {
  if (!isConfigured()) {
    return { success: false, error: 'Nextcloud not configured' }
  }

  const url = buildWebDavUrl(path)

  try {
    const response = await fetch(url, {
      method: 'MKCOL',
      headers: {
        Authorization: buildAuthHeader(),
      },
    })

    // 201 Created = success
    // 405 Method Not Allowed = folder already exists (idempotent, treat as success)
    if (response.status === 201) {
      return { success: true }
    }

    if (response.status === 405) {
      return { success: true, alreadyExists: true }
    }

    // Other errors
    const text = await response.text().catch(() => '')
    return {
      success: false,
      error: `HTTP ${response.status}: ${response.statusText}${text ? ` - ${text.slice(0, 200)}` : ''}`,
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Network error',
    }
  }
}

/**
 * Create the full folder structure for a new client
 * Creates: {NEXTCLOUD_BASE_PATH}/{clientName}/ and all subfolders
 *
 * @param {string} clientName - Name of the client (company name or contact name)
 * @param {string} [clientId] - Optional client ID as fallback if name is empty
 * @returns {Promise<{ success: boolean, path?: string, created?: string[], errors?: string[] }>}
 */
export async function createClientFolders(clientName, clientId = null) {
  if (!isConfigured()) {
    if (!hasLoggedWarning) {
      console.warn('[Nextcloud] Skipping folder creation — not configured. Set NEXTCLOUD_URL, NEXTCLOUD_USER, and NEXTCLOUD_APP_PASSWORD to enable.')
      hasLoggedWarning = true
    }
    return { success: false, error: 'Nextcloud not configured' }
  }

  // Sanitize and validate the client name
  const sanitized = sanitizeFolderName(clientName)
  const folderName = sanitized || (clientId ? `client-${clientId}` : null)

  if (!folderName) {
    console.error('[Nextcloud] Cannot create folders: no valid client name or ID')
    return { success: false, error: 'No valid client name' }
  }

  const { basePath: configBasePath } = getConfig()
  const basePath = configBasePath.endsWith('/')
    ? configBasePath.slice(0, -1)
    : configBasePath

  const clientPath = `${basePath}/${folderName}`
  const created = []
  const errors = []

  console.log(`[Nextcloud] Creating folders for client: ${folderName}`)

  // First, ensure the base path exists (create parent folders)
  // Split basePath and create each level
  const baseSegments = basePath.split('/').filter(Boolean)
  let currentPath = ''
  for (const segment of baseSegments) {
    currentPath += `/${segment}`
    const result = await createFolder(currentPath)
    if (!result.success && !result.alreadyExists) {
      // Log but continue - the folder might exist
      console.warn(`[Nextcloud] Warning creating base path ${currentPath}: ${result.error}`)
    }
  }

  // Create the client's main folder
  const mainResult = await createFolder(clientPath)
  if (mainResult.success) {
    created.push(clientPath)
    if (!mainResult.alreadyExists) {
      console.log(`[Nextcloud] Created: ${clientPath}`)
    }
  } else {
    errors.push(`${clientPath}: ${mainResult.error}`)
    console.error(`[Nextcloud] Failed to create ${clientPath}: ${mainResult.error}`)
  }

  // Create subfolders
  for (const subfolder of CLIENT_SUBFOLDERS) {
    const subPath = `${clientPath}/${subfolder}`
    const result = await createFolder(subPath)
    if (result.success) {
      created.push(subPath)
      if (!result.alreadyExists) {
        console.log(`[Nextcloud] Created: ${subPath}`)
      }
    } else {
      errors.push(`${subPath}: ${result.error}`)
      console.error(`[Nextcloud] Failed to create ${subPath}: ${result.error}`)
    }
  }

  const success = errors.length === 0
  if (success) {
    console.log(`[Nextcloud] Successfully created folder structure for ${folderName}`)
  } else {
    console.warn(`[Nextcloud] Completed with ${errors.length} error(s) for ${folderName}`)
  }

  return {
    success,
    path: clientPath,
    created,
    ...(errors.length > 0 ? { errors } : {}),
  }
}

/**
 * Build a Nextcloud web UI URL to open a folder in the browser
 * @param {string} folderPath - Path relative to user files (e.g., /Venio/Clients/Acme/Contrats)
 * @returns {string} - Full Nextcloud web URL
 */
function buildWebUrl(folderPath) {
  const { url } = getConfig()
  const cleanPath = folderPath.startsWith('/') ? folderPath : `/${folderPath}`
  return `${url}/apps/files/?dir=${encodeURIComponent(cleanPath)}`
}

/**
 * Get the folder structure info for a client (names + web URLs)
 * @param {string} clientName - Client company name or contact name
 * @param {string} [clientId] - Optional fallback ID
 * @returns {{ enabled: boolean, clientFolder?: string, webUrl?: string, folders?: Array<{ name: string, path: string, webUrl: string }> }}
 */
export function getClientCloudInfo(clientName, clientId = null) {
  if (!isConfigured()) {
    return { enabled: false }
  }

  const sanitized = sanitizeFolderName(clientName)
  const folderName = sanitized || (clientId ? `client-${clientId}` : null)

  if (!folderName) {
    return { enabled: true, error: 'No valid client name' }
  }

  const { basePath: configBasePath } = getConfig()
  const basePath = configBasePath.endsWith('/') ? configBasePath.slice(0, -1) : configBasePath
  const clientPath = `${basePath}/${folderName}`

  const folders = CLIENT_SUBFOLDERS.map((name) => {
    const path = `${clientPath}/${name}`
    return {
      name,
      path,
      webUrl: buildWebUrl(path),
    }
  })

  return {
    enabled: true,
    clientFolder: folderName,
    webUrl: buildWebUrl(clientPath),
    folders,
  }
}

/**
 * Check if Nextcloud integration is enabled
 * @returns {boolean}
 */
export function isNextcloudEnabled() {
  return isConfigured()
}
