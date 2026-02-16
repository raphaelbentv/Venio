import { useEffect, useRef } from 'react'
import './VantaBackground.css'

const VantaBackground = () => {
  const vantaRef = useRef<HTMLDivElement>(null)
  const vantaEffect = useRef<VantaEffect | null>(null)

  useEffect(() => {
    if (!vantaRef.current) return

    const initVanta = () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy()
      }

      if (typeof window.VANTA !== 'undefined' && window.VANTA.WAVES) {
        vantaEffect.current = window.VANTA.WAVES({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          shininess: 30.00,
          waveSpeed: 0.40,
          zoom: 0.65,
          color: 0x0a0a0a, // Noir
          color2: 0x1a1a1a, // Gris très sombre
        })
      }
    }

    // Attendre que les scripts soient chargés
    if (typeof window.VANTA === 'undefined' || !window.VANTA.WAVES) {
      let attempts = 0
      const maxAttempts = 50
      const checkVanta = setInterval(() => {
        attempts++
        if (typeof window.VANTA !== 'undefined' && window.VANTA.WAVES) {
          clearInterval(checkVanta)
          initVanta()
        } else if (attempts >= maxAttempts) {
          clearInterval(checkVanta)
          console.warn('Vanta.js failed to load')
        }
      }, 100)

      return () => clearInterval(checkVanta)
    } else {
      initVanta()
    }

    // Nettoyer au démontage
    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy()
        vantaEffect.current = null
      }
    }
  }, [])

  return <div ref={vantaRef} className="vanta-background" />
}

export default VantaBackground
