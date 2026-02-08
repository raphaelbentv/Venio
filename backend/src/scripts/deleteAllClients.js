import dotenv from 'dotenv'
import mongoose from 'mongoose'
import User from '../models/User.js'
import Project from '../models/Project.js'
import ProjectSection from '../models/ProjectSection.js'
import ProjectItem from '../models/ProjectItem.js'
import BillingDocument from '../models/BillingDocument.js'
import ClientContact from '../models/ClientContact.js'
import ClientNote from '../models/ClientNote.js'
import ClientActivity from '../models/ClientActivity.js'

dotenv.config()

const MONGO_URI = process.env.MONGODB_URI

if (!MONGO_URI) {
  console.error('MONGODB_URI is required')
  process.exit(1)
}

function maskUri(uri) {
  try {
    const u = new URL(uri.replace('mongodb+srv://', 'https://').replace('mongodb://', 'http://'))
    return `${u.protocol}//***@${u.hostname}/`
  } catch {
    return '(URI masquée)'
  }
}

async function deleteAllClients() {
  await mongoose.connect(MONGO_URI)
  const dbName = mongoose.connection.db?.databaseName || '?'
  console.log('Connexion BDD:', maskUri(MONGO_URI), '| base:', dbName)
  console.log('')

  // Supprimer tous les users dont le rôle est CLIENT ou client (casse)
  const clientUsers = await User.find({ role: { $in: ['CLIENT', 'client'] } }).select('_id email name role').lean()
  const clientIds = clientUsers.map((u) => u._id)

  if (clientIds.length === 0) {
    console.log('Aucun client trouvé dans la collection users (role CLIENT ou client).')
  } else {
    console.log(clientIds.length, 'client(s) à supprimer:', clientUsers.map((u) => u.email).join(', '))
    console.log('')
    const projectIds = await Project.find({ client: { $in: clientIds } }).select('_id').lean().then((p) => p.map((x) => x._id))

    const r1 = await ProjectItem.deleteMany({ project: { $in: projectIds } })
    const r2 = await ProjectSection.deleteMany({ project: { $in: projectIds } })
    const r3 = await BillingDocument.deleteMany({ client: { $in: clientIds } })
    const r4 = await Project.deleteMany({ client: { $in: clientIds } })
    const r5 = await ClientContact.deleteMany({ clientId: { $in: clientIds } })
    const r6 = await ClientNote.deleteMany({ clientId: { $in: clientIds } })
    const r7 = await ClientActivity.deleteMany({ clientId: { $in: clientIds } })
    const r8 = await User.deleteMany({ role: { $in: ['CLIENT', 'client'] } })

    console.log('Suppression effectuée :')
    console.log('  - ProjectItem:', r1.deletedCount)
    console.log('  - ProjectSection:', r2.deletedCount)
    console.log('  - BillingDocument:', r3.deletedCount)
    console.log('  - Project:', r4.deletedCount)
    console.log('  - ClientContact:', r5.deletedCount)
    console.log('  - ClientNote:', r6.deletedCount)
    console.log('  - ClientActivity:', r7.deletedCount)
    console.log('  - User (clients):', r8.deletedCount)
  }

  const db = mongoose.connection.db
  const collections = await db.listCollections().toArray()
  const clientsColl = collections.find((c) => c.name === 'clients')
  if (clientsColl) {
    await db.dropCollection('clients')
    console.log('  - Collection "clients" supprimée.')
  } else {
    console.log('  - Aucune collection "clients" trouvée (les clients sont dans "users").')
  }

  console.log('')
  console.log('Terminé.')
  await mongoose.disconnect()
}

deleteAllClients().catch((err) => {
  console.error(err)
  process.exit(1)
})
