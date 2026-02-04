# Effet Parallax - Documentation

## Vue d'ensemble

L'effet parallax a été implémenté sur la partie publique du site pour créer une expérience visuelle immersive et moderne. Le parallax crée une illusion de profondeur en faisant bouger les éléments à différentes vitesses lors du scroll.

## Architecture

### Hook personnalisé : `useParallax`

Situé dans `/src/hooks/useParallax.js`, ce hook gère l'effet parallax pour un élément unique.

**Utilisation :**
```javascript
import { useParallax } from '../hooks/useParallax'

const { elementRef, offset } = useParallax(0.3) // 0.3 = vitesse du parallax

<div 
  ref={elementRef}
  style={{ transform: `translateY(${offset}px)` }}
>
  Contenu
</div>
```

**Paramètres :**
- `speed` : Vitesse du parallax (0.1 = lent, 0.5 = rapide)

### Composants avec parallax

#### 1. **Hero** (`/src/components/Hero.jsx`)
- Titre principal : vitesse 0.3
- Orbe de gradient : vitesse 0.15
- Crée un effet de profondeur entre le titre et l'arrière-plan

#### 2. **Manifeste** (`/src/components/Manifeste.jsx`)
- Contenu entier : vitesse 0.2
- Mouvement subtil pour accompagner la lecture

#### 3. **ServicesCore** (`/src/components/ServicesCore.jsx`)
- Cartes de services : vitesses échelonnées (0.1, 0.15, 0.2)
- Effet de cascade lors du scroll
- Chaque carte se déplace à une vitesse différente

#### 4. **Citation** (`/src/components/Citation.jsx`)
- Citation : vitesse 0.25
- Donne de l'importance au message

#### 5. **Poles** (`/src/components/Poles.jsx`)
- Titre : vitesse 0.15
- Cartes : vitesses échelonnées (0.08, 0.12, 0.16)
- Effet de profondeur entre le titre et les cartes

#### 6. **GradientMeshBackground** (`/src/components/GradientMeshBackground.jsx`)
- Couches de gradient : vitesses variées (0.03 à 0.08)
- Parallax très subtil pour ne pas distraire
- Crée une sensation de profondeur dans le fond

### Décorations parallax

Le composant `ParallaxDecorations` (`/src/components/ParallaxDecorations.jsx`) ajoute des éléments décoratifs animés :

- **Cercles flottants** : 3 cercles avec mouvements et rotations
- **Lignes diagonales** : 2 lignes avec mouvements verticaux
- **Grille de points** : Grille qui s'estompe au scroll

Ces éléments sont en `position: fixed` et ne gênent pas l'interaction (pointer-events: none).

## Performance

### Optimisations

1. **Passive event listeners** : Tous les écouteurs de scroll utilisent `{ passive: true }`
2. **Will-change** : Propriété CSS appliquée aux éléments animés
3. **RequestAnimationFrame** : Non utilisé pour le scroll (passive listeners suffisent)
4. **Calculs conditionnels** : Le parallax ne calcule que si l'élément est visible

### Mode GPU OFF

Tous les effets parallax sont automatiquement désactivés quand `body.gpu-off` est actif :
- Les décorations parallax sont masquées
- Le parallax du background est désactivé
- Les composants conservent leur position statique

### Responsive

Les effets parallax fonctionnent sur tous les appareils, mais :
- Les décorations sont réduites sur mobile (tailles plus petites)
- Les vitesses restent identiques pour une expérience cohérente

## Vitesses recommandées

- **Très subtil** : 0.03 - 0.08 (background, éléments de fond)
- **Subtil** : 0.1 - 0.2 (cartes, sections)
- **Modéré** : 0.2 - 0.3 (titres, éléments importants)
- **Prononcé** : 0.3 - 0.5 (éléments d'accroche, hero)

## Ajout de parallax à un nouveau composant

```javascript
import { useParallax } from '../hooks/useParallax'

const MonComposant = () => {
  const { elementRef, offset } = useParallax(0.2)

  return (
    <div 
      ref={elementRef}
      style={{ transform: `translateY(${offset}px)` }}
    >
      Contenu
    </div>
  )
}
```

## Parallax multiple dans un composant

Pour plusieurs éléments avec des vitesses différentes :

```javascript
const cardsRef = useRef([])
const [cardOffsets, setCardOffsets] = useState([0, 0, 0])

useEffect(() => {
  const handleScroll = () => {
    const scrolled = window.pageYOffset
    const windowHeight = window.innerHeight

    const newOffsets = cardsRef.current.map((card, index) => {
      if (!card) return 0
      const rect = card.getBoundingClientRect()
      if (rect.top < windowHeight && rect.bottom > 0) {
        const speed = 0.1 + (index * 0.05)
        const elementTop = rect.top + scrolled
        return (scrolled - elementTop + windowHeight) * speed
      }
      return 0
    })

    setCardOffsets(newOffsets)
  }

  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
  return () => window.removeEventListener('scroll', handleScroll)
}, [])
```

## Bonnes pratiques

1. **Ne pas abuser** : Trop de parallax peut donner le mal de mer
2. **Vitesses cohérentes** : Garder des vitesses similaires pour les éléments du même type
3. **Tester sur mobile** : Vérifier que l'effet reste agréable sur petit écran
4. **Respecter le GPU OFF** : Toujours désactiver en mode performance réduite
5. **Passive listeners** : Toujours utiliser `{ passive: true }` pour le scroll

## Désactivation

Pour désactiver le parallax globalement, ajouter la classe `gpu-off` au body :
```javascript
document.body.classList.add('gpu-off')
```

Le composant `PerformanceControl` permet aux utilisateurs de basculer ce mode.
