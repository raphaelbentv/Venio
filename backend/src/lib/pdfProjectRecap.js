import PDFDocument from 'pdfkit'
import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'

const STATUS_LABELS = {
  EN_COURS: 'En cours',
  EN_ATTENTE: 'En attente',
  TERMINE: 'Terminé',
}

const TASK_STATUS_LABELS = {
  A_FAIRE: 'À faire',
  EN_COURS: 'En cours',
  EN_REVIEW: 'En review',
  TERMINE: 'Terminé',
}

const PRIORITY_LABELS = {
  BASSE: 'Basse',
  NORMALE: 'Normale',
  HAUTE: 'Haute',
  URGENTE: 'Urgente',
}

/**
 * Generate a project recap PDF.
 * @param {object} params
 * @param {object} params.project - Project document
 * @param {object} params.client - Client user { name, email }
 * @param {Array} params.tasks - Array of Task documents
 * @param {Array} params.updates - Array of ProjectUpdate documents
 * @param {Array} params.sections - Array of ProjectSection documents
 * @returns {Promise<Buffer>} - PDF as buffer
 */
export async function generateProjectRecapPdf({ project, client, tasks, updates, sections }) {
  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({ margin: 50, size: 'A4' })
    const chunks = []
    pdf.on('data', (chunk) => chunks.push(chunk))
    pdf.on('end', () => resolve(Buffer.concat(chunks)))
    pdf.on('error', reject)

    // Header
    pdf.fontSize(22).text('RÉCAPITULATIF PROJET', { align: 'center' })
    pdf.moveDown(0.5)
    pdf.fontSize(10).fillColor('#666').text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' })
    pdf.fillColor('#000')
    pdf.moveDown(1.5)

    // Project info
    pdf.fontSize(16).text(project.name)
    pdf.moveDown(0.3)
    pdf.fontSize(10)
    pdf.text(`Statut: ${STATUS_LABELS[project.status] || project.status}`)
    pdf.text(`Priorité: ${PRIORITY_LABELS[project.priority] || project.priority || 'Normale'}`)
    if (project.projectNumber) pdf.text(`N° projet: ${project.projectNumber}`)
    if (client) pdf.text(`Client: ${client.name} (${client.email || ''})`)
    if (project.responsible) pdf.text(`Responsable: ${project.responsible}`)
    if (project.startDate) pdf.text(`Début: ${new Date(project.startDate).toLocaleDateString('fr-FR')}`)
    if (project.endDate) pdf.text(`Fin prévue: ${new Date(project.endDate).toLocaleDateString('fr-FR')}`)
    if (project.deliveredAt) pdf.text(`Livré le: ${new Date(project.deliveredAt).toLocaleDateString('fr-FR')}`)
    if (project.description) {
      pdf.moveDown(0.5)
      pdf.fontSize(9).fillColor('#444').text(project.description)
      pdf.fillColor('#000')
    }

    // Budget
    if (project.budget?.amount) {
      pdf.moveDown(1)
      pdf.fontSize(12).text('Budget')
      pdf.fontSize(10).text(`Montant: ${Number(project.budget.amount).toLocaleString('fr-FR')} ${project.budget.currency || 'EUR'}`)
      if (project.billing?.amountInvoiced) {
        pdf.text(`Facturé: ${Number(project.billing.amountInvoiced).toLocaleString('fr-FR')} ${project.budget.currency || 'EUR'}`)
      }
    }

    // Deadlines
    if (project.deadlines?.length > 0) {
      pdf.moveDown(1)
      pdf.fontSize(12).text('Échéances')
      pdf.fontSize(10)
      for (const d of project.deadlines) {
        pdf.text(`• ${d.label} — ${new Date(d.dueAt).toLocaleDateString('fr-FR')}`)
      }
    }

    // Sections
    if (sections?.length > 0) {
      pdf.moveDown(1)
      pdf.fontSize(12).text('Sections')
      pdf.fontSize(10)
      for (const s of sections) {
        pdf.text(`• ${s.title}${s.description ? ` — ${s.description}` : ''}`)
      }
    }

    // Tasks
    if (tasks?.length > 0) {
      pdf.moveDown(1)
      pdf.fontSize(12).text(`Tâches (${tasks.length})`)
      pdf.moveDown(0.3)

      const byStatus = { A_FAIRE: 0, EN_COURS: 0, EN_REVIEW: 0, TERMINE: 0 }
      for (const t of tasks) {
        if (byStatus[t.status] !== undefined) byStatus[t.status]++
      }
      pdf.fontSize(10)
      pdf.text(`À faire: ${byStatus.A_FAIRE}  |  En cours: ${byStatus.EN_COURS}  |  En review: ${byStatus.EN_REVIEW}  |  Terminé: ${byStatus.TERMINE}`)
      pdf.moveDown(0.5)

      for (const t of tasks) {
        const status = TASK_STATUS_LABELS[t.status] || t.status
        const priority = PRIORITY_LABELS[t.priority] || t.priority
        pdf.fontSize(9).text(`[${status}] ${t.title} (${priority})${t.assignee?.name ? ` — ${t.assignee.name}` : ''}`)
      }
    }

    // Updates
    if (updates?.length > 0) {
      pdf.moveDown(1)
      pdf.fontSize(12).text('Mises à jour')
      pdf.moveDown(0.3)
      pdf.fontSize(10)
      for (const u of updates) {
        const date = new Date(u.createdAt).toLocaleDateString('fr-FR')
        pdf.text(`${date} — ${u.title}`)
        if (u.description) {
          pdf.fontSize(9).fillColor('#444').text(u.description.substring(0, 200))
          pdf.fillColor('#000').fontSize(10)
        }
        pdf.moveDown(0.3)
      }
    }

    // Tags
    if (project.tags?.length > 0) {
      pdf.moveDown(1)
      pdf.fontSize(10).text(`Tags: ${project.tags.join(', ')}`)
    }

    pdf.end()
  })
}
