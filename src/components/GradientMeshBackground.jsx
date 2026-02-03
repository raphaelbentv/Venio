import React, { useEffect, useState } from 'react'
import './GradientMeshBackground.css'

const GradientMeshBackground = () => {
  const [reducedLayers, setReducedLayers] = useState(false)

  useEffect(() => {
    // Détecter les appareils bas de gamme
    const isLowEnd = () => {
      // Vérifier la mémoire disponible
      if (navigator.deviceMemory && navigator.deviceMemory < 4) {
        return true
      }
      
      // Vérifier le nombre de cœurs CPU
      if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
        return true
      }
      
      // Vérifier si c'est un mobile
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        return true
      }
      
      return false
    }

    setReducedLayers(isLowEnd())
  }, [])

  return (
    <div className="gradient-mesh-background">
      <div className="gradient-mesh-layer gradient-mesh-layer-1"></div>
      <div className="gradient-mesh-layer gradient-mesh-layer-2"></div>
      {!reducedLayers && (
        <>
          <div className="gradient-mesh-layer gradient-mesh-layer-3"></div>
          <div className="gradient-mesh-layer gradient-mesh-layer-4"></div>
        </>
      )}
      <div className="gradient-mesh-overlay"></div>
    </div>
  )
}

export default GradientMeshBackground
