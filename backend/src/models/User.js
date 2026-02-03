import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['CLIENT', 'SUPER_ADMIN', 'ADMIN', 'VIEWER'], required: true },
    name: { type: String, required: true },
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)
