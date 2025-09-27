import { useState, useEffect } from 'react'

interface ResponsiveConfig {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isLargeDesktop: boolean
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

export function useResponsive(): ResponsiveConfig {
  const [breakpoint, setBreakpoint] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'>('lg')

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 640) setBreakpoint('xs')
      else if (width < 768) setBreakpoint('sm')
      else if (width < 1024) setBreakpoint('md')
      else if (width < 1280) setBreakpoint('lg')
      else if (width < 1536) setBreakpoint('xl')
      else setBreakpoint('2xl')
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return {
    isMobile: breakpoint === 'xs' || breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl',
    isLargeDesktop: breakpoint === '2xl',
    breakpoint
  }
}
