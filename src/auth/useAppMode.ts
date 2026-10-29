import { useEffect, useState } from 'react'
import { appConfig, type AppMode } from './api'

// Asked once per page load; every screen shares the answer.
let asked: Promise<AppMode> | null = null

/** Whether this deployment is the demo or a pilot; null until the server says. */
export function useAppMode(): AppMode | null {
  const [mode, setMode] = useState<AppMode | null>(null)
  useEffect(() => {
    let live = true
    asked ??= appConfig()
      .then(({ mode }) => mode)
      .catch(() => {
        asked = null
        return 'demo' as const
      })
    void asked.then((answer) => live && setMode(answer))
    return () => {
      live = false
    }
  }, [])
  return mode
}
