import mongoose from 'mongoose'

const clientActivitySchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

clientActivitySchema.index({ clientId: 1, createdAt: -1 })

export default mongoose.model('ClientActivity', clientActivitySchema)
