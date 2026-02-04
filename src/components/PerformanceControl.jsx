import React, { useState, useEffect } from 'react'
import './PerformanceControl.css'

const PerformanceControl = () => {
  const [gpuMode, setGpuMode] = useState(() => {
    // Récupérer la préférence sauvegardée
    const saved = localStorage.getItem('gpu-mode')
    return saved !== null ? saved === 'true' : true
  })

  useEffect(() => {
    // Sauvegarder la préférence
    localStorage.setItem('gpu-mode', gpuMode)

    // Appliquer la classe au body
    if (!gpuMode) {
      document.body.classList.add('gpu-off')
    } else {
      document.body.classList.remove('gpu-off')
    }
  }, [gpuMode])

  const toggleGpuMode = () => {
    setGpuMode(!gpuMode)
  }

  return (
    <button
      className={`performance-control ${!gpuMode ? 'gpu-off' : ''}`}
      onClick={toggleGpuMode}
      title={gpuMode ? 'Désactiver les animations GPU' : 'Activer les animations GPU'}
      aria-label={gpuMode ? 'Désactiver les animations GPU' : 'Activer les animations GPU'}
    >
      <svg 
        className="performance-icon" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
        aria-hidden="true"
      >
        {gpuMode ? (
          // Icône GPU ON (éclair)
          <>
            <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
          </>
        ) : (
          // Icône GPU OFF (éclair barré)
          <>
            <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" opacity="0.3" />
            <line x1="2" y1="2" x2="22" y2="22" strokeWidth="2.5" />
          </>
        )}
      </svg>
      <span className="performance-label">
        {gpuMode ? 'GPU ON' : 'GPU OFF'}
      </span>
    </button>
  )
}

export default PerformanceControl
