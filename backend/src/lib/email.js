import nodemailer from 'nodemailer'

function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.ionos.com'
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!user || !pass) {
    return null
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user, pass },
    tls: { minVersion: 'TLSv1.2' },
  })
}

/**
 * Envoie un email avec les identifiants de connexion admin.
 * @param {{ to: string, name: string, email: string, password: string }} opts
 * @returns {Promise<{ sent: boolean, error?: string }>}
 */
export async function sendAdminCredentials({ to, name, email, password }) {
  const transporter = getTransporter()
  if (!transporter) {
    return { sent: false, error: 'SMTP non configuré (SMTP_USER / SMTP_PASS)' }
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'admin@venio.paris'
  const appName = process.env.APP_NAME || 'Venio'
  const loginUrl = process.env.ADMIN_LOGIN_URL || 'http://localhost:5501/admin/login'

  try {
    await transporter.sendMail({
      from: `"${appName}" <${from}>`,
      to,
      subject: `[${appName}] Vos identifiants d'accès administrateur`,
      text: [
        `Bonjour ${name},`,
        '',
        `Un compte administrateur a été créé pour vous sur ${appName}.`,
        '',
        'Vos identifiants de connexion :',
        `  Email    : ${email}`,
        `  Mot de passe : ${password}`,
        '',
        `Connexion : ${loginUrl}`,
        '',
        'Nous vous recommandons de modifier ce mot de passe après votre première connexion.',
        '',
        `— L'équipe ${appName}`,
      ].join('\n'),
      html: [
        `<p>Bonjour ${escapeHtml(name)},</p>`,
        `<p>Un compte administrateur a été créé pour vous sur <strong>${escapeHtml(appName)}</strong>.</p>`,
        '<p><strong>Vos identifiants de connexion :</strong></p>',
        '<ul>',
        `<li>Email : <code>${escapeHtml(email)}</code></li>`,
        `<li>Mot de passe : <code>${escapeHtml(password)}</code></li>`,
        '</ul>',
        `<p>Connexion : <a href="${escapeHtml(loginUrl)}">${escapeHtml(loginUrl)}</a></p>`,
        '<p>Nous vous recommandons de modifier ce mot de passe après votre première connexion.</p>',
        `<p>— L'équipe ${escapeHtml(appName)}</p>`,
      ].join(''),
    })
    return { sent: true }
  } catch (err) {
    return { sent: false, error: err.message || String(err) }
  }
}

/**
 * Envoie un email de test (vérification SMTP).
 * @param {string} to - Adresse du destinataire
 * @returns {Promise<{ sent: boolean, error?: string }>}
 */
export async function sendTestEmail(to) {
  const transporter = getTransporter()
  if (!transporter) {
    return { sent: false, error: 'SMTP non configuré (SMTP_USER / SMTP_PASS)' }
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'admin@venio.paris'
  const appName = process.env.APP_NAME || 'Venio'
  try {
    await transporter.sendMail({
      from: `"${appName}" <${from}>`,
      to,
      subject: `[${appName}] Email de test`,
      text: `Ceci est un email de test envoyé depuis ${appName}. Si vous le recevez, la configuration SMTP fonctionne.`,
      html: `<p>Ceci est un email de test envoyé depuis <strong>${escapeHtml(appName)}</strong>.</p><p>Si vous le recevez, la configuration SMTP fonctionne.</p>`,
    })
    return { sent: true }
  } catch (err) {
    return { sent: false, error: err.message || String(err) }
  }
}

/**
 * Envoie un email de notification d'assignation de lead au commercial.
 * @param {{ to: string, assigneeName: string, lead: { company: string, contactName?: string, contactEmail?: string, contactPhone?: string, source?: string, priority?: string, budget?: number } }} opts
 * @returns {Promise<{ sent: boolean, error?: string }>}
 */
export async function sendLeadAssignmentEmail({ to, assigneeName, lead }) {
  const transporter = getTransporter()
  if (!transporter) {
    return { sent: false, error: 'SMTP non configuré (SMTP_USER / SMTP_PASS)' }
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'admin@venio.paris'
  const appName = process.env.APP_NAME || 'Venio'
  const crmUrl = process.env.CRM_URL || 'http://localhost:5501/admin/crm'

  const budgetStr = lead.budget != null ? `${lead.budget.toLocaleString('fr-FR')} €` : 'Non renseigné'

  try {
    await transporter.sendMail({
      from: `"${appName}" <${from}>`,
      to,
      subject: `[${appName}] Nouveau lead assigné : ${lead.company}`,
      text: [
        `Bonjour ${assigneeName},`,
        '',
        `Un nouveau lead vous a été assigné sur ${appName}.`,
        '',
        'Détails du lead :',
        `  Entreprise : ${lead.company}`,
        `  Contact    : ${lead.contactName || 'Non renseigné'}`,
        `  Email      : ${lead.contactEmail || 'Non renseigné'}`,
        `  Téléphone  : ${lead.contactPhone || 'Non renseigné'}`,
        `  Source     : ${lead.source || 'Non renseignée'}`,
        `  Priorité   : ${lead.priority || 'NORMALE'}`,
        `  Budget     : ${budgetStr}`,
        '',
        `Accéder au CRM : ${crmUrl}`,
        '',
        `— L'équipe ${appName}`,
      ].join('\n'),
      html: [
        `<p>Bonjour ${escapeHtml(assigneeName)},</p>`,
        `<p>Un nouveau lead vous a été assigné sur <strong>${escapeHtml(appName)}</strong>.</p>`,
        '<p><strong>Détails du lead :</strong></p>',
        '<table style="border-collapse: collapse; margin: 16px 0;">',
        `<tr><td style="padding: 4px 12px 4px 0; color: #666;">Entreprise</td><td style="padding: 4px 0;"><strong>${escapeHtml(lead.company)}</strong></td></tr>`,
        `<tr><td style="padding: 4px 12px 4px 0; color: #666;">Contact</td><td style="padding: 4px 0;">${escapeHtml(lead.contactName || 'Non renseigné')}</td></tr>`,
        `<tr><td style="padding: 4px 12px 4px 0; color: #666;">Email</td><td style="padding: 4px 0;">${lead.contactEmail ? `<a href="mailto:${escapeHtml(lead.contactEmail)}">${escapeHtml(lead.contactEmail)}</a>` : 'Non renseigné'}</td></tr>`,
        `<tr><td style="padding: 4px 12px 4px 0; color: #666;">Téléphone</td><td style="padding: 4px 0;">${escapeHtml(lead.contactPhone || 'Non renseigné')}</td></tr>`,
        `<tr><td style="padding: 4px 12px 4px 0; color: #666;">Source</td><td style="padding: 4px 0;">${escapeHtml(lead.source || 'Non renseignée')}</td></tr>`,
        `<tr><td style="padding: 4px 12px 4px 0; color: #666;">Priorité</td><td style="padding: 4px 0;">${escapeHtml(lead.priority || 'NORMALE')}</td></tr>`,
        `<tr><td style="padding: 4px 12px 4px 0; color: #666;">Budget</td><td style="padding: 4px 0;">${escapeHtml(budgetStr)}</td></tr>`,
        '</table>',
        `<p><a href="${escapeHtml(crmUrl)}" style="display: inline-block; padding: 10px 20px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 6px;">Accéder au CRM</a></p>`,
        `<p>— L'équipe ${escapeHtml(appName)}</p>`,
      ].join(''),
    })
    return { sent: true }
  } catch (err) {
    return { sent: false, error: err.message || String(err) }
  }
}

/**
 * Envoie un email de rappel pour les leads froids (sans contact depuis X jours).
 * @param {{ to: string, assigneeName: string, leads: Array<{ company: string, contactName: string, daysSinceContact: number }> }} opts
 * @returns {Promise<{ sent: boolean, error?: string }>}
 */
export async function sendColdLeadsReminderEmail({ to, assigneeName, leads }) {
  const transporter = getTransporter()
  if (!transporter) {
    return { sent: false, error: 'SMTP non configuré (SMTP_USER / SMTP_PASS)' }
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'admin@venio.paris'
  const appName = process.env.APP_NAME || 'Venio'
  const crmUrl = process.env.CRM_URL || 'http://localhost:5501/admin/crm'

  const leadsList = leads.map(l => `- ${l.company} (${l.contactName || 'Contact non renseigné'}) — ${l.daysSinceContact} jours sans contact`).join('\n')
  const leadsHtml = leads.map(l => 
    `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(l.company)}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(l.contactName || 'Non renseigné')}</td><td style="padding: 8px; border-bottom: 1px solid #eee; color: #f59e0b; font-weight: 600;">${l.daysSinceContact}j</td></tr>`
  ).join('')

  try {
    await transporter.sendMail({
      from: `"${appName}" <${from}>`,
      to,
      subject: `[${appName}] ${leads.length} lead(s) froid(s) nécessitent votre attention`,
      text: [
        `Bonjour ${assigneeName},`,
        '',
        `Vous avez ${leads.length} lead(s) sans contact récent :`,
        '',
        leadsList,
        '',
        `Accéder au CRM : ${crmUrl}`,
        '',
        `— L'équipe ${appName}`,
      ].join('\n'),
      html: [
        `<p>Bonjour ${escapeHtml(assigneeName)},</p>`,
        `<p>Vous avez <strong>${leads.length} lead(s)</strong> sans contact récent :</p>`,
        '<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">',
        '<tr style="background: #f3f4f6;"><th style="padding: 8px; text-align: left;">Entreprise</th><th style="padding: 8px; text-align: left;">Contact</th><th style="padding: 8px; text-align: left;">Inactif</th></tr>',
        leadsHtml,
        '</table>',
        `<p><a href="${escapeHtml(crmUrl)}" style="display: inline-block; padding: 10px 20px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 6px;">Accéder au CRM</a></p>`,
        `<p>— L'équipe ${escapeHtml(appName)}</p>`,
      ].join(''),
    })
    return { sent: true }
  } catch (err) {
    return { sent: false, error: err.message || String(err) }
  }
}

/**
 * Envoie un email récapitulatif des actions en retard.
 * @param {{ to: string, assigneeName: string, leads: Array<{ company: string, contactName: string, nextActionAt: Date, daysOverdue: number }> }} opts
 * @returns {Promise<{ sent: boolean, error?: string }>}
 */
export async function sendOverdueActionsEmail({ to, assigneeName, leads }) {
  const transporter = getTransporter()
  if (!transporter) {
    return { sent: false, error: 'SMTP non configuré (SMTP_USER / SMTP_PASS)' }
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'admin@venio.paris'
  const appName = process.env.APP_NAME || 'Venio'
  const crmUrl = process.env.CRM_URL || 'http://localhost:5501/admin/crm'

  const leadsList = leads.map(l => `- ${l.company} — Action prévue le ${new Date(l.nextActionAt).toLocaleDateString('fr-FR')} (${l.daysOverdue}j de retard)`).join('\n')
  const leadsHtml = leads.map(l => 
    `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(l.company)}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(l.nextActionAt).toLocaleDateString('fr-FR')}</td><td style="padding: 8px; border-bottom: 1px solid #eee; color: #ef4444; font-weight: 600;">${l.daysOverdue}j</td></tr>`
  ).join('')

  try {
    await transporter.sendMail({
      from: `"${appName}" <${from}>`,
      to,
      subject: `[${appName}] ${leads.length} action(s) en retard sur vos leads`,
      text: [
        `Bonjour ${assigneeName},`,
        '',
        `Vous avez ${leads.length} action(s) en retard :`,
        '',
        leadsList,
        '',
        `Accéder au CRM : ${crmUrl}`,
        '',
        `— L'équipe ${appName}`,
      ].join('\n'),
      html: [
        `<p>Bonjour ${escapeHtml(assigneeName)},</p>`,
        `<p>Vous avez <strong>${leads.length} action(s)</strong> en retard :</p>`,
        '<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">',
        '<tr style="background: #f3f4f6;"><th style="padding: 8px; text-align: left;">Entreprise</th><th style="padding: 8px; text-align: left;">Date prévue</th><th style="padding: 8px; text-align: left;">Retard</th></tr>',
        leadsHtml,
        '</table>',
        `<p><a href="${escapeHtml(crmUrl)}" style="display: inline-block; padding: 10px 20px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px;">Voir les actions en retard</a></p>`,
        `<p>— L'équipe ${escapeHtml(appName)}</p>`,
      ].join(''),
    })
    return { sent: true }
  } catch (err) {
    return { sent: false, error: err.message || String(err) }
  }
}

/**
 * Envoie un email d'escalade au manager.
 * @param {{ to: string, managerName: string, lead: object, assigneeName: string, daysSinceAssignment: number }} opts
 * @returns {Promise<{ sent: boolean, error?: string }>}
 */
export async function sendEscalationEmail({ to, managerName, lead, assigneeName, daysSinceAssignment }) {
  const transporter = getTransporter()
  if (!transporter) {
    return { sent: false, error: 'SMTP non configuré (SMTP_USER / SMTP_PASS)' }
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'admin@venio.paris'
  const appName = process.env.APP_NAME || 'Venio'
  const crmUrl = process.env.CRM_URL || 'http://localhost:5501/admin/crm'

  try {
    await transporter.sendMail({
      from: `"${appName}" <${from}>`,
      to,
      subject: `[${appName}] Escalade : Lead inactif depuis ${daysSinceAssignment} jours`,
      text: [
        `Bonjour ${managerName},`,
        '',
        `Le lead "${lead.company}" assigné à ${assigneeName} n'a pas eu d'activité depuis ${daysSinceAssignment} jours.`,
        '',
        `Détails du lead :`,
        `- Entreprise : ${lead.company}`,
        `- Contact : ${lead.contactName || 'Non renseigné'}`,
        `- Statut : ${lead.status}`,
        `- Priorité : ${lead.priority}`,
        '',
        `Accéder au CRM : ${crmUrl}`,
        '',
        `— L'équipe ${appName}`,
      ].join('\n'),
      html: [
        `<p>Bonjour ${escapeHtml(managerName)},</p>`,
        `<p>Le lead <strong>"${escapeHtml(lead.company)}"</strong> assigné à <strong>${escapeHtml(assigneeName)}</strong> n'a pas eu d'activité depuis <strong>${daysSinceAssignment} jours</strong>.</p>`,
        '<p><strong>Détails du lead :</strong></p>',
        '<ul>',
        `<li>Entreprise : ${escapeHtml(lead.company)}</li>`,
        `<li>Contact : ${escapeHtml(lead.contactName || 'Non renseigné')}</li>`,
        `<li>Statut : ${escapeHtml(lead.status)}</li>`,
        `<li>Priorité : ${escapeHtml(lead.priority)}</li>`,
        '</ul>',
        `<p><a href="${escapeHtml(crmUrl)}" style="display: inline-block; padding: 10px 20px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px;">Accéder au CRM</a></p>`,
        `<p>— L'équipe ${escapeHtml(appName)}</p>`,
      ].join(''),
    })
    return { sent: true }
  } catch (err) {
    return { sent: false, error: err.message || String(err) }
  }
}

/**
 * Envoie un email de rappel avant expiration de proposition.
 * @param {{ to: string, assigneeName: string, lead: object, daysInProposal: number }} opts
 * @returns {Promise<{ sent: boolean, error?: string }>}
 */
export async function sendProposalReminderEmail({ to, assigneeName, lead, daysInProposal }) {
  const transporter = getTransporter()
  if (!transporter) {
    return { sent: false, error: 'SMTP non configuré (SMTP_USER / SMTP_PASS)' }
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'admin@venio.paris'
  const appName = process.env.APP_NAME || 'Venio'
  const crmUrl = process.env.CRM_URL || 'http://localhost:5501/admin/crm'

  try {
    await transporter.sendMail({
      from: `"${appName}" <${from}>`,
      to,
      subject: `[${appName}] Rappel : Proposition en attente depuis ${daysInProposal} jours`,
      text: [
        `Bonjour ${assigneeName},`,
        '',
        `Le lead "${lead.company}" est en statut PROPOSITION depuis ${daysInProposal} jours.`,
        '',
        `Pensez à relancer ce prospect pour ne pas perdre l'opportunité.`,
        '',
        `Accéder au CRM : ${crmUrl}`,
        '',
        `— L'équipe ${appName}`,
      ].join('\n'),
      html: [
        `<p>Bonjour ${escapeHtml(assigneeName)},</p>`,
        `<p>Le lead <strong>"${escapeHtml(lead.company)}"</strong> est en statut <strong>PROPOSITION</strong> depuis <strong>${daysInProposal} jours</strong>.</p>`,
        '<p>Pensez à relancer ce prospect pour ne pas perdre l\'opportunité.</p>',
        `<p><a href="${escapeHtml(crmUrl)}" style="display: inline-block; padding: 10px 20px; background: #f97316; color: white; text-decoration: none; border-radius: 6px;">Voir la proposition</a></p>`,
        `<p>— L'équipe ${escapeHtml(appName)}</p>`,
      ].join(''),
    })
    return { sent: true }
  } catch (err) {
    return { sent: false, error: err.message || String(err) }
  }
}

/**
 * Envoie le rapport hebdomadaire CRM.
 * @param {{ to: string, stats: object }} opts
 * @returns {Promise<{ sent: boolean, error?: string }>}
 */
export async function sendWeeklyReportEmail({ to, stats }) {
  const transporter = getTransporter()
  if (!transporter) {
    return { sent: false, error: 'SMTP non configuré (SMTP_USER / SMTP_PASS)' }
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'admin@venio.paris'
  const appName = process.env.APP_NAME || 'Venio'
  const crmUrl = process.env.CRM_URL || 'http://localhost:5501/admin/crm'

  try {
    await transporter.sendMail({
      from: `"${appName}" <${from}>`,
      to,
      subject: `[${appName}] Rapport CRM hebdomadaire`,
      text: [
        `Rapport CRM de la semaine`,
        '',
        `Nouveaux leads : ${stats.newLeads}`,
        `Leads qualifiés : ${stats.qualified}`,
        `Leads gagnés : ${stats.won}`,
        `Leads perdus : ${stats.lost}`,
        `Taux de conversion : ${stats.conversionRate}%`,
        '',
        `Total leads actifs : ${stats.totalActive}`,
        `Valeur pipeline : ${stats.pipelineValue} €`,
        '',
        `Accéder au CRM : ${crmUrl}`,
        '',
        `— L'équipe ${appName}`,
      ].join('\n'),
      html: [
        `<h2>Rapport CRM de la semaine</h2>`,
        '<table style="width: 100%; max-width: 400px; border-collapse: collapse; margin: 16px 0;">',
        `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Nouveaux leads</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600; text-align: right;">${stats.newLeads}</td></tr>`,
        `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Leads qualifiés</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600; text-align: right; color: #0ea5e9;">${stats.qualified}</td></tr>`,
        `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Leads gagnés</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600; text-align: right; color: #22c55e;">${stats.won}</td></tr>`,
        `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Leads perdus</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600; text-align: right; color: #ef4444;">${stats.lost}</td></tr>`,
        `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Taux de conversion</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600; text-align: right;">${stats.conversionRate}%</td></tr>`,
        `<tr style="background: #f3f4f6;"><td style="padding: 8px;">Total leads actifs</td><td style="padding: 8px; font-weight: 600; text-align: right;">${stats.totalActive}</td></tr>`,
        `<tr style="background: #f3f4f6;"><td style="padding: 8px;">Valeur pipeline</td><td style="padding: 8px; font-weight: 600; text-align: right;">${stats.pipelineValue.toLocaleString('fr-FR')} €</td></tr>`,
        '</table>',
        `<p><a href="${escapeHtml(crmUrl)}" style="display: inline-block; padding: 10px 20px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 6px;">Accéder au CRM</a></p>`,
        `<p>— L'équipe ${escapeHtml(appName)}</p>`,
      ].join(''),
    })
    return { sent: true }
  } catch (err) {
    return { sent: false, error: err.message || String(err) }
  }
}

function escapeHtml(s) {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
