import { useState, useEffect } from 'react'

interface ToastProps {
  title: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
  duration?: number
}

interface Toast extends ToastProps {
  id: string
}

let toastCount = 0

export function toast({ title, description, variant = 'default', duration = 5000 }: ToastProps) {
  const id = `toast-${++toastCount}`
  
  // Create toast element
  const toastElement = document.createElement('div')
  toastElement.id = id
  toastElement.className = `
    fixed top-4 right-4 z-50 max-w-sm w-full bg-white dark:bg-slate-900 
    border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg 
    transform transition-all duration-300 ease-in-out
    ${variant === 'destructive' ? 'border-red-200 dark:border-red-800' : ''}
    ${variant === 'success' ? 'border-green-200 dark:border-green-800' : ''}
  `
  
  const iconClass = variant === 'destructive' ? 'text-red-600' : 
                   variant === 'success' ? 'text-green-600' : 'text-blue-600'
  
  toastElement.innerHTML = `
    <div class="p-4">
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 ${iconClass}" fill="currentColor" viewBox="0 0 20 20">
            ${variant === 'destructive' ? `
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            ` : variant === 'success' ? `
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            ` : `
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            `}
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-sm font-medium text-slate-900 dark:text-white">${title}</h3>
          ${description ? `<p class="mt-1 text-sm text-slate-600 dark:text-slate-400">${description}</p>` : ''}
        </div>
        <div class="flex-shrink-0">
          <button onclick="this.closest('[id^=toast-]').remove()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  `
  
  // Add to DOM
  const container = document.getElementById('toast-container') || createToastContainer()
  container.appendChild(toastElement)
  
  // Animate in
  setTimeout(() => {
    toastElement.style.transform = 'translateX(0)'
    toastElement.style.opacity = '1'
  }, 100)
  
  // Auto remove
  setTimeout(() => {
    removeToast(id)
  }, duration)
  
  return id
}

function createToastContainer() {
  const container = document.createElement('div')
  container.id = 'toast-container'
  container.className = 'fixed top-4 right-4 z-50 space-y-2'
  document.body.appendChild(container)
  return container
}

function removeToast(id: string) {
  const toast = document.getElementById(id)
  if (toast) {
    toast.style.transform = 'translateX(100%)'
    toast.style.opacity = '0'
    setTimeout(() => {
      toast.remove()
    }, 300)
  }
}

// Add styles to head
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    #toast-container > div {
      transform: translateX(100%);
      opacity: 0;
    }
  `
  document.head.appendChild(style)
}

