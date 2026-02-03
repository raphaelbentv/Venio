import dotenv from 'dotenv'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import Project from '../models/Project.js'

dotenv.config()

const MONGO_URI = process.env.MONGODB_URI

if (!MONGO_URI) {
  console.error('MONGODB_URI is required')
  process.exit(1)
}

const demoDomain = 'demo.local'

const demoClients = [
  { name: 'Horizon Atelier', email: `contact@horizon.${demoDomain}` },
  { name: 'Nova Retail', email: `hello@novaretail.${demoDomain}` },
  { name: 'Maison Aurore', email: `bonjour@maisonaurore.${demoDomain}` },
  { name: 'Studio Kora', email: `team@studiokora.${demoDomain}` },
  { name: 'Lumen Santé', email: `contact@lumensante.${demoDomain}` },
]

const sampleProjects = [
  {
    name: 'Refonte site vitrine',
    summary: 'Moderniser l’image et améliorer la conversion.',
    description: 'Nouvelle charte et refonte UX/UI.',
    status: 'EN_COURS',
    priority: 'HAUTE',
    serviceTypes: ['Design', 'Développement'],
    deliverableTypes: ['Maquettes', 'Code source'],
    tags: ['refonte', 'urgent'],
    budget: { amount: 12000, currency: 'EUR', note: 'Budget validé' },
  },
  {
    name: 'Campagne acquisition Q2',
    summary: 'Booster les leads via ads et landing pages.',
    description: 'Plan média + landing pages optimisées.',
    status: 'EN_ATTENTE',
    priority: 'NORMALE',
    serviceTypes: ['Conseil', 'Marketing'],
    deliverableTypes: ['Rapport', 'Contenu'],
    tags: ['acquisition', 'ads'],
    budget: { amount: 6500, currency: 'EUR', note: '' },
  },
  {
    name: 'Plateforme e-commerce',
    summary: 'Lancer la boutique en ligne.',
    description: 'MVP e-commerce + intégration paiement.',
    status: 'EN_COURS',
    priority: 'URGENTE',
    serviceTypes: ['Développement', 'Intégration'],
    deliverableTypes: ['Code source', 'Documentation'],
    tags: ['ecommerce', 'prioritaire'],
    budget: { amount: 25000, currency: 'EUR', note: 'En 2 phases' },
  },
  {
    name: 'Branding & identité',
    summary: 'Aligner le positionnement et la marque.',
    description: 'Logo, guidelines, kit réseaux.',
    status: 'TERMINE',
    priority: 'BASSE',
    serviceTypes: ['Design', 'Stratégie'],
    deliverableTypes: ['Assets', 'Rapport'],
    tags: ['branding'],
    budget: { amount: 4000, currency: 'EUR', note: '' },
  },
]

const nowPlusDays = (days) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

async function seed() {
  await mongoose.connect(MONGO_URI)

  const existingDemoUsers = await User.find({ email: new RegExp(`@${demoDomain}$`) })
  const demoUserIds = existingDemoUsers.map((u) => u._id)
  if (demoUserIds.length) {
    await Project.deleteMany({ client: { $in: demoUserIds } })
    await User.deleteMany({ _id: { $in: demoUserIds } })
  }

  const passwordHash = await bcrypt.hash('password123', 10)

  const clients = await User.insertMany(
    demoClients.map((client) => ({
      name: client.name,
      email: client.email,
      passwordHash,
      role: 'CLIENT',
    }))
  )

  const projects = []
  clients.forEach((client, index) => {
    const baseIndex = index % sampleProjects.length
    const first = sampleProjects[baseIndex]
    const second = sampleProjects[(baseIndex + 1) % sampleProjects.length]
    const list = [first, second]

    list.forEach((proj, projIndex) => {
      projects.push({
        ...proj,
        client: client._id,
        projectNumber: `PROJ-DEMO-${String(index + 1).padStart(2, '0')}${projIndex + 1}`,
        startDate: nowPlusDays(2 + projIndex * 3),
        endDate: nowPlusDays(20 + projIndex * 7),
        deadlines: [
          { label: 'Kickoff', dueAt: nowPlusDays(2) },
          { label: 'Livraison', dueAt: nowPlusDays(30) },
        ],
        reminderAt: nowPlusDays(5),
        responsible: 'Commercial Demo',
        internalNotes: 'Client fictif généré automatiquement.',
      })
    })
  })

  await Project.insertMany(projects)

  console.log(`Seed OK: ${clients.length} clients, ${projects.length} projets`)
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
