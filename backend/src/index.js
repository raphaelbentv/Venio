import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

import authRoutes from './routes/auth.js'
import projectRoutes from './routes/projects.js'
import documentRoutes from './routes/documents.js'
import adminUserRoutes from './routes/admin/users.js'
import adminClientRoutes from './routes/admin/clients.js'
import adminAdminsRoutes from './routes/admin/admins.js'
import adminProjectRoutes from './routes/admin/projects.js'
import adminProjectSectionsRoutes from './routes/admin/projectSections.js'
import adminProjectItemsRoutes from './routes/admin/projectItems.js'
import adminBillingRoutes from './routes/admin/billing.js'
import adminCrmRoutes from './routes/admin/crm.js'
import adminCloudStorageRoutes from './routes/admin/cloudStorage.js'
import clientProjectContentRoutes from './routes/client/projectContent.js'
import User from './models/User.js'

dotenv.config()

const app = express()
const port = process.env.PORT || 3000
const mongoUri = process.env.MONGODB_URI

if (!mongoUri) {
  throw new Error('MONGODB_URI is required')
}

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5001',
    credentials: true,
  })
)
app.use(express.json({ limit: '2mb' }))
app.use(morgan('dev'))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/documents', documentRoutes)

app.use('/api/admin/users', adminUserRoutes)
app.use('/api/admin/clients', adminClientRoutes)
app.use('/api/admin/admins', adminAdminsRoutes)
app.use('/api/admin/projects', adminProjectRoutes)
app.use('/api/admin/projects', adminProjectSectionsRoutes)
app.use('/api/admin/projects', adminProjectItemsRoutes)
app.use('/api/admin/billing', adminBillingRoutes)
app.use('/api/admin/crm', adminCrmRoutes)
app.use('/api/admin/cloud', adminCloudStorageRoutes)

// Routes client pour le contenu des projets
app.use('/api/projects', clientProjectContentRoutes)

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.use((err, _req, res, _next) => {
  const status = err.status || 500
  res.status(status).json({
    error: err.message || 'Server error',
  })
})

mongoose
  .connect(mongoUri)
  .then(() => {
    return User.exists({ role: 'SUPER_ADMIN' }).then(async (hasSuperAdmin) => {
      if (hasSuperAdmin) return
      await User.updateMany({ role: 'ADMIN' }, { $set: { role: 'SUPER_ADMIN' } })
    })
  })
  .then(() => {
    app.listen(port, () => {
      console.log(`API running on http://localhost:${port}`)
    })
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  })
