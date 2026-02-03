import React from 'react'
import GradientMeshBackground from '../components/GradientMeshBackground'
import PoleCard from '../components/PoleCard'
import SEO from '../components/SEO'
import StructuredData from '../components/StructuredData'
import './PolesPage.css'

const PolesPage = () => {
  const poles = [
    {
      name: 'DECISIO',
      description: 'Communication juridique',
      link: 'https://decisio.paris',
      external: true
    },
    {
      name: 'CREATIO',
      description: 'Supports de cours',
      link: 'https://creatio.paris',
      external: true
    },
    {
      name: 'FORMATIO',
      description: 'Formations professionnelles',
      link: 'https://formatio.paris',
      external: true
    }
  ]

  return (
    <>
      <SEO 
        title="Nos Pôles"
        description="Venio opère à travers trois entités spécialisées : DECISIO (communication juridique), CREATIO (supports de cours) et FORMATIO (formations professionnelles). Expertise approfondie et cohérence stratégique."
        keywords="DECISIO, CREATIO, FORMATIO, communication juridique, supports de cours, formations professionnelles"
      />
      <StructuredData type="poles" />
      <GradientMeshBackground />
      <div className="poles-page">
        <section className="poles-hero">
          <h1>NOS PÔLES</h1>
          <p className="poles-subtitle">Trois entités spécialisées, une vision cohérente</p>
        </section>

        <section className="poles-content">
          <div className="poles-intro">
            <p>
              Venio opère à travers trois entités spécialisées, chacune dédiée à un domaine d'excellence. 
              Ces pôles permettent une expertise approfondie tout en maintenant une cohérence stratégique globale.
            </p>
          </div>

          <div className="poles-grid">
            {poles.map((pole, index) => (
              <PoleCard key={index} {...pole} />
            ))}
          </div>
        </section>
      </div>
    </>
  )
}

export default PolesPage

