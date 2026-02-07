import React from 'react'
import { Link } from 'react-router-dom'
import Hero from '../components/Hero'
import Manifeste from '../components/Manifeste'
import ServicesCore from '../components/ServicesCore'
import Citation from '../components/Citation'
import CTAFinal from '../components/CTAFinal'
import GradientMeshBackground from '../components/GradientMeshBackground'
import ParallaxDecorations from '../components/ParallaxDecorations'
import SEO from '../components/SEO'
import StructuredData from '../components/StructuredData'
import './Home.css'

const Home = () => {
  return (
    <>
      <SEO 
        title="Accueil"
        description="La plupart des stratégies échouent. Ce n'est pas un hasard. Venio construit ce qui doit exister. Code propriétaire, architectures sur mesure, audit sans filtre. Pas de templates, pas de mensonges."
        keywords="agence digitale, développement web, communication, branding, stratégie digitale, Paris"
      />
      <StructuredData type="home" />
      <GradientMeshBackground />
      <ParallaxDecorations />
      <Hero />
      <Manifeste />
      <ServicesCore />
      <Citation />
      <CTAFinal />
    </>
  )
}

export default Home

