"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, type Language } from '@/lib/translations'

interface TranslationsContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: typeof translations.en
  mounted: boolean
}

const TranslationsContext = createContext<TranslationsContextType | undefined>(undefined)

interface TranslationsProviderProps {
  children: ReactNode
}

export function TranslationsProvider({ children }: TranslationsProviderProps) {
  const [language, setLanguageState] = useState<Language>('vi')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Get language from localStorage if available, default to Vietnamese
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage && ['en', 'vi', 'ja'].includes(savedLanguage)) {
      setLanguageState(savedLanguage)
    } else {
      // Set Vietnamese as default if no language is saved
      setLanguageState('vi')
      localStorage.setItem('language', 'vi')
    }
  }, [])

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage)
    localStorage.setItem('language', newLanguage)
  }

  const t = translations[language]

  const value = {
    language,
    setLanguage,
    t,
    mounted,
  }

  return (
    <TranslationsContext.Provider value={value}>
      {children}
    </TranslationsContext.Provider>
  )
}

export function useTranslations() {
  const context = useContext(TranslationsContext)
  if (context === undefined) {
    throw new Error('useTranslations must be used within a TranslationsProvider')
  }
  return context
}
