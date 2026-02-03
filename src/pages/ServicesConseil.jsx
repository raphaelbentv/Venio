import React from 'react'
import GradientMeshBackground from '../components/GradientMeshBackground'
import SEO from '../components/SEO'
import StructuredData from '../components/StructuredData'
import './ServicesPage.css'

const ServicesConseil = () => {
  return (
    <>
      <SEO 
        title="Conseil Stratégique"
        description="Positionnement, vision, architecture digitale globale et stratégie IA. Audit sans filtre, analyse lucide et recommandations actionnables pour transformer votre entreprise."
        keywords="conseil stratégique, transformation digitale, audit stratégique, consulting, stratégie IA, positionnement"
      />
      <StructuredData type="service-conseil" />
      <GradientMeshBackground />
      <div className="services-page">
        <section className="services-hero">
          <h1>CONSEIL STRATÉGIQUE</h1>
          <p className="services-subtitle">Vision. Positionnement. IA.</p>
        </section>

        <section className="services-content">
          <div className="services-section">
            <h2>Nos domaines d'intervention</h2>
            <ul className="services-list">
              <li>Positionnement et vision</li>
              <li>Architecture digitale globale</li>
              <li>Stratégie IA et automatisation</li>
              <li>Transformation numérique</li>
              <li>Structuration d'offres</li>
            </ul>
          </div>

          <div className="services-section">
            <h2>Notre méthode</h2>
            <ul className="services-list">
              <li>Audit sans filtre</li>
              <li>Analyse lucide</li>
              <li>Recommandations actionnables</li>
              <li>Accompagnement structuré</li>
            </ul>
          </div>

          <div className="services-section">
            <h2>Format d'intervention</h2>
            <ul className="services-list">
              <li>Missions ponctuelles</li>
              <li>Accompagnement mensuel</li>
              <li>Audit stratégique</li>
              <li>Consulting technique</li>
            </ul>
          </div>

          <div className="services-cta calendly">
            <h2>Premier échange gratuit (30min)</h2>
            <p>Réservez un créneau pour discuter de votre projet</p>
            <a 
              href="https://calendly.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="calendly-btn"
            >
              Réserver un créneau →
            </a>
          </div>
        </section>
      </div>
    </>
  )
}

export default ServicesConseil

