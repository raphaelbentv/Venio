import dotenv from 'dotenv'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'

dotenv.config()

const MONGO_URI = process.env.MONGODB_URI
const ADMIN_EMAIL = 'raphael@venio.paris'
const ADMIN_PASSWORD = 'losange9669'
const ADMIN_NAME = 'Raphael'

if (!MONGO_URI) {
  console.error('MONGODB_URI is required')
  process.exit(1)
}

async function createAdmin() {
  await mongoose.connect(MONGO_URI)

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)

  let existing = await User.findOne({ email: ADMIN_EMAIL })
  if (!existing && ADMIN_EMAIL === 'raphael@venio.paris') {
    const oldUser = await User.findOne({ email: 'raphael' })
    if (oldUser) {
      await User.updateOne(
        { email: 'raphael' },
        { $set: { email: ADMIN_EMAIL, passwordHash, name: ADMIN_NAME, role: 'SUPER_ADMIN' } }
      )
      console.log('Identifiant migré de raphael vers raphael@venio.paris.')
      existing = { email: ADMIN_EMAIL }
    }
  }
  if (existing && existing.passwordHash) {
    await User.updateOne(
      { email: ADMIN_EMAIL },
      { $set: { passwordHash, name: ADMIN_NAME, role: 'SUPER_ADMIN' } }
    )
    console.log('Admin existant mis à jour.')
  } else if (!existing || !existing.passwordHash) {
    if (!existing) {
      await User.create({
        email: ADMIN_EMAIL,
        passwordHash,
        name: ADMIN_NAME,
        role: 'SUPER_ADMIN',
      })
      console.log('Compte admin créé.')
    }
  }

  console.log('')
  console.log('Identifiants de connexion admin :')
  console.log('  Email / identifiant :', ADMIN_EMAIL)
  console.log('  Mot de passe        :', ADMIN_PASSWORD)
  console.log('  Connexion          : /admin/login')
  console.log('')

  await mongoose.disconnect()
}

createAdmin().catch((err) => {
  console.error(err)
  process.exit(1)
})
