import Notification from '../models/Notification.js'

export async function createNotification({ recipient, type, title, message, link, metadata }) {
  if (!recipient) return null
  return Notification.create({
    recipient,
    type,
    title,
    message: message || '',
    link: link || '',
    metadata: metadata || {},
  })
}
