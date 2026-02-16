import { useEffect, useCallback, useState } from 'react'
import { useBlocker } from 'react-router-dom'

export function useUnsavedChanges(isDirty: boolean) {
  const blocker = useBlocker(isDirty)

  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const confirmNavigation = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.proceed()
    }
  }, [blocker])

  const cancelNavigation = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.reset()
    }
  }, [blocker])

  return {
    isBlocked: blocker.state === 'blocked',
    confirmNavigation,
    cancelNavigation,
  }
}

export function useFormDirty<T>(initial: T) {
  const [initialState] = useState<string>(() => JSON.stringify(initial))
  const [current, setCurrent] = useState<T>(initial)
  const isDirty = JSON.stringify(current) !== initialState

  return { current, setCurrent, isDirty }
}
