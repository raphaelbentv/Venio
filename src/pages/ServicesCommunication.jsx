import React from 'react'
import GradientMeshBackground from '../components/GradientMeshBackground'
import SEO from '../components/SEO'
import StructuredData from '../components/StructuredData'
import './ServicesPage.css'

const ServicesCommunication = () => {
  return (
    <>
      <SEO 
        title="Communication & Branding"
        description="Identités visuelles cohérentes, stratégies éditoriales structurées, contenus premium et storytelling. Direction artistique pour entreprises premium et marques modernes."
        keywords="communication, branding, identité visuelle, stratégie éditoriale, storytelling, direction artistique"
      />
      <StructuredData type="service-communication" />
      <GradientMeshBackground />
      <div className="services-page">
        <section className="services-hero">
          <h1>COMMUNICATION & BRANDING</h1>
          <p className="services-subtitle">Identités. Stratégies. Contenu.</p>
        </section>

        <section className="services-content">
          <div className="services-section">
            <h2>Ce que nous créons</h2>
            <ul className="services-list">
              <li>Identités visuelles cohérentes</li>
              <li>Stratégies éditoriales structurées</li>
              <li>Contenus premium et storytelling</li>
              <li>Direction artistique</li>
            </ul>
          </div>

          <div className="services-section">
            <h2>Notre approche</h2>
            <div className="approach-steps">
              <div className="approach-step">
                <span className="step-number">1</span>
                <div>
                  <h3>Analyse</h3>
                  <p>Déconstruction de votre existant</p>
                </div>
              </div>
              <div className="approach-step">
                <span className="step-number">2</span>
                <div>
                  <h3>Stratégie</h3>
                  <p>Architecture de marque solide</p>
                </div>
              </div>
              <div className="approach-step">
                <span className="step-number">3</span>
                <div>
                  <h3>Création</h3>
                  <p>Exécution impeccable</p>
                </div>
              </div>
            </div>
          </div>

          <div className="services-section">
            <h2>Pour qui</h2>
            <ul className="services-list">
              <li>Entreprises premium</li>
              <li>Cabinets professionnels</li>
              <li>Marques modernes</li>
              <li>Entrepreneurs visionnaires</li>
            </ul>
          </div>

          <div className="services-cta">
            <h2>Parlons de votre projet</h2>
            <form className="contact-form">
              <div className="form-row">
                <input type="text" placeholder="Prénom" required />
                <input type="text" placeholder="Nom" required />
              </div>
              <input type="email" placeholder="Email" required />
              <input type="text" placeholder="Entreprise" />
              <textarea placeholder="Message" rows="6" required></textarea>
              <button type="submit" className="form-submit">Envoyer</button>
            </form>
          </div>
        </section>
      </div>
    </>
  )
}

export default ServicesCommunication

