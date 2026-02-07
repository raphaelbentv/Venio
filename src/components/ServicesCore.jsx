import React from 'react'
import { Link } from 'react-router-dom'
import './ServicesCore.css'

const highlight = (str) => <span className="service-core-highlight">{str}</span>

const ServicesCore = () => {
  const services = [
    {
      title: 'CONSEIL STRATÉGIQUE',
      market: 'Souvent on vous vend de l\'accompagnement : des gens qui disent oui à tout pour garder le contrat.',
      problem: 'Au final vous payez pour qu\'on vous rassure, pas pour vraiment avancer.',
      solution: <>Nous on fait l\'inverse. On regarde votre situation en face. {highlight('On vous dit ce qui ne va pas et ce qui marche.')} On vous donne des pistes concrètes. Si le projet n\'a pas de sens, on vous le dit.</>,
      result: <>Vous repartez avec {highlight('des idées claires.')} Pas avec un dossier qui prend la poussière.</>,
      link: '/services/conseil'
    },
    {
      title: 'DÉVELOPPEMENT',
      market: 'On vous promet un site beau et moderne. Souvent c\'est un modèle tout fait, bricolé à la va-vite.',
      problem: 'Résultat : ça tient quelques mois, puis les soucis arrivent. Ou ça ne suit plus quand vous grandissez. Ou plus personne ne sait le modifier.',
      solution: <>Nous on construit {highlight('des outils faits pour vous,')} pensés pour durer et grandir avec vous. Pas de modèle standard : {highlight('du sur mesure.')}</>,
      result: <>Un site ou une app {highlight('qui tient la route.')} Que vous pouvez faire évoluer. Que vous maîtrisez.</>,
      link: '/services/developpement'
    },
    {
      title: 'COMMUNICATION & BRANDING',
      market: 'On vous vend un logo, une charte, quelques posts. Du prêt-à-l\'emploi qui ressemble à tout le monde.',
      problem: 'Résultat : vous ne vous démarquez pas. Votre marque n\'a pas de personnalité.',
      solution: <>Nous on construit {highlight('une image de marque cohérente.')} Un message clair. Un style qui vous ressemble. {highlight('Une vraie identité.')}</>,
      result: <>Une marque {highlight('qui vous ressemble.')} Qui ne copie pas les tendances. Qui reste.</>,
      link: '/services/communication'
    }
  ]

  return (
    <section className="services-core">
      <div className="services-core-container">
        <h2 className="services-core-title">Ce que Venio fait</h2>
        <div className="services-core-grid">
          {services.map((service, index) => (
            <Link 
              key={index} 
              to={service.link} 
              className="service-core-card"
            >
              <h3 className="service-core-card-title">{service.title}</h3>
              <div className="service-core-card-content">
                <p className="service-market">{service.market}</p>
                <p className="service-problem">{service.problem}</p>
                <p className="service-solution">{service.solution}</p>
                <p className="service-result">{service.result}</p>
              </div>
              <span className="service-core-card-link">En savoir plus →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ServicesCore

