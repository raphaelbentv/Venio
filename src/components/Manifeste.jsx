import React from 'react'
import './Manifeste.css'

const Manifeste = () => {
  return (
    <section className="manifeste">
      <div className="manifeste-content">
        <p className="manifeste-intro">
          Venio refuse :
        </p>
        <p className="manifeste-text">
          Le jargon marketing vide.<br />
          Les promesses creuses.<br />
          Les tendances suivies par mimétisme.<br />
          Les stratégies sans objectifs concrets.<br />
          Les projets dictés par l&apos;ego ou la peur.
        </p>
        <p className="manifeste-principle">
          Si ça ne sert à rien, on ne le fait pas.
        </p>
        <p className="manifeste-tagline">
          Lucidité. Efficacité. Refus du mensonge.
        </p>
      </div>
    </section>
  )
}

export default Manifeste

