import React from 'react'
import { Link } from 'react-router-dom'
import GradientMeshBackground from '../components/GradientMeshBackground'
import SEO from '../components/SEO'
import StructuredData from '../components/StructuredData'
import './APropos.css'

const APropos = () => {
  return (
    <>
      <SEO 
        title="À Propos"
        description="Venio construit des systèmes qui durent. Lucidité, efficacité et ambition. Architecture sur mesure, identités cohérentes et stratégies actionnables pour entreprises premium."
        keywords="à propos Venio, agence digitale Paris, équipe Venio, expertise technique, vision"
      />
      <StructuredData type="apropos" />
      <GradientMeshBackground />
      <div className="apropos-page">
        <section className="apropos-hero">
          <h1>À PROPOS</h1>
          <p className="apropos-subtitle">Qui nous sommes, ce que nous faisons</p>
        </section>

        <section className="apropos-content">
          <div className="apropos-section">
            <h2>Vision Venio</h2>
            <p>
              Venio construit des systèmes qui durent. Loin des tendances éphémères et des solutions 
              génériques, nous développons des architectures sur mesure, des identités cohérentes 
              et des stratégies actionnables.
            </p>
            <p>
              Notre approche combine lucidité analytique, exigence technique et efficacité opérationnelle. 
              Nous ne vendons pas des sites, nous vendons des systèmes pensés pour évoluer.
            </p>
          </div>

          <div className="apropos-section">
            <h2>Notre approche</h2>
            <div className="piliers">
              <div className="pilier">
                <h3>Lucidité</h3>
                <p>Analyse sans filtre, diagnostic précis, recommandations directes. Pas de bullshit, que du concret.</p>
              </div>
              <div className="pilier">
                <h3>Efficacité</h3>
                <p>Architectures optimisées, processus structurés, livraisons dans les temps. Performance avant tout.</p>
              </div>
              <div className="pilier">
                <h3>Ambition</h3>
                <p>Projets qui comptent, solutions qui durent, résultats mesurables. Nous visons l'excellence.</p>
              </div>
            </div>
          </div>

          <div className="apropos-section">
            <h2>Expertise technique</h2>
            <p>
              Nous développons des solutions robustes et scalables avec des technologies modernes 
              et des intégrations IA avancées.
            </p>
            <p>
              Nous privilégions le code propriétaire, les architectures sur mesure et les systèmes 
              pensés pour évoluer. Pas de templates, pas de solutions génériques.
            </p>
          </div>

          <div className="apropos-cta">
            <h2>Parlons de votre projet</h2>
            <p>Discutons de vos besoins avec lucidité et ambition.</p>
            <Link to="/contact" className="cta-btn">Prendre contact</Link>
          </div>
        </section>
      </div>
    </>
  )
}

export default APropos

