import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['TASK_ASSIGNED', 'TASK_UPDATED', 'PROJECT_UPDATE', 'DOCUMENT_ADDED'],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, default: '' },
    link: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
)

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 })

export default mongoose.model('Notification', notificationSchema)
