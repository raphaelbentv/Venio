import { useEffect, useRef, useState } from 'react'

export const useParallax = (speed = 0.5) => {
  const elementRef = useRef<HTMLElement | null>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (!elementRef.current) return

      const rect = elementRef.current.getBoundingClientRect()
      const scrolled = window.pageYOffset
      const elementTop = rect.top + scrolled
      const windowHeight = window.innerHeight

      // Calculate parallax only when element is in viewport
      if (rect.top < windowHeight && rect.bottom > 0) {
        const parallax = (scrolled - elementTop + windowHeight) * speed
        setOffset(parallax)
      }
    }

    handleScroll() // Initial calculation
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [speed])

  return { elementRef, offset }
}

interface ParallaxElement {
  id: string
  speed: number
  element: HTMLElement | null
}

export const useParallaxMulti = (elements: ParallaxElement[] = []) => {
  const [offsets, setOffsets] = useState<Record<string, number>>({})

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.pageYOffset
      const windowHeight = window.innerHeight
      const newOffsets: Record<string, number> = {}

      elements.forEach(({ id, speed, element }) => {
        if (!element) return

        const rect = element.getBoundingClientRect()
        const elementTop = rect.top + scrolled

        if (rect.top < windowHeight && rect.bottom > 0) {
          newOffsets[id] = (scrolled - elementTop + windowHeight) * speed
        }
      })

      setOffsets(newOffsets)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [elements])

  return offsets
}
