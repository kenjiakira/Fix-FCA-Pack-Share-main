import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useMobileOptimization() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
  const [isLowPerformance, setIsLowPerformance] = React.useState<boolean>(false)
  const [shouldReduceAnimations, setShouldReduceAnimations] = React.useState<boolean>(false)

  React.useEffect(() => {
    const checkMobileAndPerformance = () => {
      const isMobileDevice = window.innerWidth < MOBILE_BREAKPOINT
      setIsMobile(isMobileDevice)

      if (isMobileDevice) {
        const hardwareConcurrency = navigator.hardwareConcurrency || 4
        const memoryInfo = (navigator as any).deviceMemory || 4
        const connection = (navigator as any).connection
        
        const isLowEnd = hardwareConcurrency <= 4 || memoryInfo <= 2
        
        const isSlowConnection = connection && (
          connection.effectiveType === 'slow-2g' || 
          connection.effectiveType === '2g' || 
          connection.effectiveType === '3g'
        )
        
        setIsLowPerformance(isLowEnd || isSlowConnection)
        setShouldReduceAnimations(isLowEnd || isSlowConnection)
      }
    }

    checkMobileAndPerformance()
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    mql.addEventListener("change", checkMobileAndPerformance)
    
    return () => mql.removeEventListener("change", checkMobileAndPerformance)
  }, [])

  return {
    isMobile: !!isMobile,
    isLowPerformance,
    shouldReduceAnimations,
    toggleAnimations: () => setShouldReduceAnimations(prev => !prev)
  }
}
