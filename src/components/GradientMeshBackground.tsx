import { useEffect, useState } from 'react'
import './GradientMeshBackground.css'

const GradientMeshBackground = () => {
  const [gpuOff, setGpuOff] = useState<boolean>(() => document.body.classList.contains('gpu-off'))
  const [reducedLayers, setReducedLayers] = useState<boolean>(false)
  const [disableAnimations, setDisableAnimations] = useState<boolean>(false)
  const [scrollY, setScrollY] = useState<number>(0)

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setGpuOff(document.body.classList.contains('gpu-off'))
    })

    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (gpuOff) {
      return undefined
    }

    // Détecter les appareils bas de gamme
    const isLowEnd = () => {
      // Vérifier la mémoire disponible
      if ((navigator as any).deviceMemory && (navigator as any).deviceMemory < 4) {
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

    // Détecter les performances en temps réel (seulement si la page est visible)
    let frameCount = 0
    let lastTime = performance.now()
    let animationFrameId: number
    let isPageVisible = !document.hidden

    const checkPerformance = () => {
      if (!isPageVisible) return

      frameCount++
      const currentTime = performance.now()

      // Vérifier les FPS toutes les 3 secondes
      if (currentTime - lastTime >= 3000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))

        // Si FPS < 25, désactiver les animations
        if (fps < 25) {
          setDisableAnimations(true)
        }

        frameCount = 0
        lastTime = currentTime
      }

      animationFrameId = requestAnimationFrame(checkPerformance)
    }

    // Gérer la visibilité de la page
    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden
      if (!isPageVisible && animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      } else if (isPageVisible) {
        frameCount = 0
        lastTime = performance.now()
        checkPerformance()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Démarrer la vérification après 5 secondes (laisser le temps au chargement)
    const timeoutId = setTimeout(() => {
      if (isPageVisible) {
        checkPerformance()
      }
    }, 5000)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [gpuOff])

  // Parallax effect on scroll - TRÈS subtil
  useEffect(() => {
    if (gpuOff || disableAnimations) return

    const handleScroll = () => {
      setScrollY(window.pageYOffset)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [gpuOff, disableAnimations])

  if (gpuOff) {
    return <div className="gradient-mesh-background gpu-off-static" />
  }

  // Parallax très subtil - vitesses réduites de moitié
  const parallaxOffset1 = scrollY * 0.02
  const parallaxOffset2 = scrollY * 0.03

  return (
    <div className={`gradient-mesh-background ${disableAnimations ? 'no-animations' : ''}`}>
      <div
        className="gradient-mesh-layer gradient-mesh-layer-1"
        style={{ transform: `translateY(${parallaxOffset1}px)` }}
      ></div>
      <div
        className="gradient-mesh-layer gradient-mesh-layer-2"
        style={{ transform: `translateY(${parallaxOffset2}px)` }}
      ></div>
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
