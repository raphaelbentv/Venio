import mongoose from 'mongoose'

const leadSchema = new mongoose.Schema(
  {
    company: { type: String, required: true, trim: true },
    contactName: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    source: { type: String, default: '' },
    status: {
      type: String,
      enum: ['LEAD', 'QUALIFIED', 'CONTACTED', 'DEMO', 'PROPOSAL', 'WON', 'LOST'],
      default: 'LEAD',
    },
    priority: {
      type: String,
      enum: ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'],
      default: 'NORMALE',
    },
    budget: { type: Number, default: null },
    nextActionAt: { type: Date, default: null },
    lastContactAt: { type: Date, default: null },
    notes: { type: String, default: '' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

leadSchema.index({ status: 1, priority: 1 })
leadSchema.index({ assignedTo: 1, nextActionAt: 1 })
leadSchema.index({ company: 1 })

export default mongoose.model('Lead', leadSchema)
