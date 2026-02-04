import React from 'react'
import { Link } from 'react-router-dom'
import './ServicesCore.css'

const ServicesCore = () => {
  const services = [
    {
      title: 'CONSEIL STRATÉGIQUE',
      description: 'Vision. Positionnement. IA.',
      link: '/services/conseil'
    },
    {
      title: 'DÉVELOPPEMENT',
      description: 'Sites. Plateformes. SaaS.',
      link: '/services/developpement'
    },
    {
      title: 'COMMUNICATION & BRANDING',
      description: 'Identités. Stratégies. Contenu.',
      link: '/services/communication'
    }
  ]

  return (
    <section className="services-core">
      <div className="services-core-container">
        <h2 className="services-core-title">Les 3 activités principales de Venio</h2>
        <div className="services-core-grid">
          {services.map((service, index) => (
            <Link 
              key={index} 
              to={service.link} 
              className="service-core-card"
            >
              <h3 className="service-core-card-title">{service.title}</h3>
              <p className="service-core-card-desc">{service.description}</p>
              <span className="service-core-card-link">En savoir plus →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ServicesCore

