import React from 'react'
import { Link } from 'react-router-dom'
import Hero from '../components/Hero'
import Manifeste from '../components/Manifeste'
import ServicesCore from '../components/ServicesCore'
import Poles from '../components/Poles'
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
        description="Venio construit des systèmes qui durent. Architecture sur mesure, identités cohérentes et stratégies actionnables pour entreprises premium. Communication, développement et conseil stratégique."
        keywords="agence digitale, développement web, communication, branding, stratégie digitale, Paris"
      />
      <StructuredData type="home" />
      <GradientMeshBackground />
      <ParallaxDecorations />
      <Hero />
      <Manifeste />
      <ServicesCore />
      <Poles />
      <Citation />
      <CTAFinal />
    </>
  )
}

export default Home

