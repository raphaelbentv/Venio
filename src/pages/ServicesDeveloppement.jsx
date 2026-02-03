import React, { useState } from 'react'
import GradientMeshBackground from '../components/GradientMeshBackground'
import MathCaptcha from '../components/MathCaptcha'
import SEO from '../components/SEO'
import StructuredData from '../components/StructuredData'
import './ServicesPage.css'

const ServicesDeveloppement = () => {
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setSelectedFile(file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!captchaVerified) {
      alert('Veuillez compléter la vérification mathématique')
      return
    }
    // Ici vous pouvez ajouter la logique d'envoi du formulaire
    alert('Formulaire envoyé avec succès !')
  }

  return (
    <>
      <SEO 
        title="Développement Web"
        description="Sites web premium, plateformes métier complexes, SaaS scalables et outils sur mesure. Architecture sur mesure, code propriétaire, systèmes pensés pour durer et évoluer."
        keywords="développement web, développement sur mesure, SaaS, plateforme web, architecture web, React, développement Paris"
      />
      <StructuredData type="service-developpement" />
      <GradientMeshBackground />
      <div className="services-page">
        <section className="services-hero">
          <h1>DÉVELOPPEMENT</h1>
          <p className="services-subtitle">Sites. Plateformes. SaaS.</p>
        </section>

        <section className="services-content">
          <div className="services-section">
            <h2>Ce que nous développons</h2>
            <ul className="services-list">
              <li>Sites web premium et interactifs</li>
              <li>Plateformes métier complexes</li>
              <li>SaaS complets et scalables</li>
              <li>Outils internes sur mesure</li>
              <li>Intégration IA (locale ou cloud)</li>
            </ul>
          </div>

          <div className="services-section">
            <h2>Notre méthodologie</h2>
            <ol className="methodology-list">
              <li>Audit technique et fonctionnel</li>
              <li>Architecture et wireframes</li>
              <li>Développement itératif</li>
              <li>Tests et optimisation</li>
              <li>Déploiement et formation</li>
              <li>Maintenance et évolution</li>
            </ol>
          </div>

          <div className="services-section highlight">
            <h2>Pourquoi nous</h2>
            <div className="why-us">
              <p className="why-us-negative">Pas de templates</p>
              <p className="why-us-negative">Pas de solutions génériques</p>
              <p className="why-us-positive">Code propriétaire, architectures sur mesure, systèmes pensés pour durer et évoluer.</p>
            </div>
          </div>

          <div className="services-cta">
            <h2>Parlons de votre projet</h2>
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <input type="text" placeholder="Prénom" required />
                <input type="text" placeholder="Nom" required />
              </div>
              <input type="email" placeholder="Email" required />
              <input type="text" placeholder="Entreprise" />
              <textarea placeholder="Message" rows="6" required></textarea>
              <div className="form-file">
                <label htmlFor="brief" className="file-label">Brief technique (PDF, optionnel)</label>
                <div className="file-input-wrapper">
                  <input 
                    type="file" 
                    id="brief" 
                    accept=".pdf" 
                    onChange={handleFileChange}
                    className="file-input"
                  />
                  <label htmlFor="brief" className="file-button">
                    {selectedFile ? selectedFile.name : 'Choisir un fichier'}
                  </label>
                  {selectedFile && (
                    <button 
                      type="button" 
                      className="file-remove"
                      onClick={() => {
                        setSelectedFile(null)
                        document.getElementById('brief').value = ''
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              <MathCaptcha onVerify={setCaptchaVerified} />
              <button 
                type="submit" 
                className="form-submit"
                disabled={!captchaVerified}
              >
                Envoyer
              </button>
            </form>
          </div>
        </section>
      </div>
    </>
  )
}

export default ServicesDeveloppement

