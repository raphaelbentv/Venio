import PDFDocument from 'pdfkit'
import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'

/**
 * Generate a PDF for a BillingDocument and save to storagePath.
 * @param {object} doc - BillingDocument (plain object with number, type, lines, total, currency, client, project, etc.)
 * @param {object} client - User (client) with name, email
 * @param {object} project - Project with name
 * @param {string} storagePath - Relative path to save PDF
 * @returns {Promise<string>} - Resolved with absolute path of saved file
 */
export async function generateBillingPdf(doc, client, project, storagePath) {
  const absolutePath = path.resolve(process.cwd(), storagePath)
  await fsp.mkdir(path.dirname(absolutePath), { recursive: true })

  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({ margin: 50 })
    const stream = fs.createWriteStream(absolutePath)
    pdf.pipe(stream)

    const title = doc.type === 'QUOTE' ? 'DEVIS' : 'FACTURE'
    pdf.fontSize(20).text(title, { continued: false })
    pdf.fontSize(10).text(`N° ${doc.number}`, { continued: false })
    pdf.moveDown()

    pdf.fontSize(10)
    pdf.text(`Projet: ${project?.name || '-'}`)
    pdf.text(`Client: ${client?.name || '-'} (${client?.email || ''})`)
    pdf.moveDown()

    pdf.text('Désignation', 50, pdf.y)
    pdf.text('Qté', 320, pdf.y)
    pdf.text('Prix unitaire', 380, pdf.y)
    pdf.text('Total', 450, pdf.y)
    pdf.moveTo(50, pdf.y + 5).lineTo(550, pdf.y + 5).stroke()
    pdf.moveDown(8)

    for (const line of doc.lines || []) {
      pdf.text(line.description?.substring(0, 40) || '-', 50, pdf.y)
      pdf.text(String(line.quantity ?? 0), 320, pdf.y)
      pdf.text(`${Number(line.unitPrice ?? 0).toFixed(2)} ${doc.currency || 'EUR'}`, 380, pdf.y)
      pdf.text(`${Number(line.total ?? 0).toFixed(2)} ${doc.currency || 'EUR'}`, 450, pdf.y)
      pdf.moveDown(6)
    }

    pdf.moveDown(10)
    pdf.text(`Total: ${Number(doc.total ?? 0).toFixed(2)} ${doc.currency || 'EUR'}`, 350, pdf.y)
    if (doc.note) {
      pdf.moveDown(8)
      pdf.fontSize(9).text(`Note: ${doc.note}`, 50, pdf.y)
    }

    pdf.end()
    stream.on('finish', () => resolve(absolutePath))
    stream.on('error', reject)
  })
}
