import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock localStorage
const localStorageMock = {
  getItem: (key) => {
    return localStorageMock[key] || null
  },
  setItem: (key, value) => {
    localStorageMock[key] = value
  },
  removeItem: (key) => {
    delete localStorageMock[key]
  },
  clear: () => {
    Object.keys(localStorageMock).forEach(key => {
      if (key !== 'getItem' && key !== 'setItem' && key !== 'removeItem' && key !== 'clear') {
        delete localStorageMock[key]
      }
    })
  }
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock navigator.clipboard
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: () => Promise.resolve(),
      readText: () => Promise.resolve('')
    },
    configurable: true
  })
}

// Mock navigator.share
if (!navigator.share) {
  Object.defineProperty(navigator, 'share', {
    value: () => Promise.resolve(),
    configurable: true
  })
}

// Suppress console errors for expected test scenarios
const originalError = console.error
beforeEach(() => {
  console.error = (...args) => {
    // Suppress specific expected errors
    if (
      typeof args[0] === 'string' && 
      (
        args[0].includes('Warning: ReactDOM.render is deprecated') ||
        args[0].includes('Warning: An invalid form control')
      )
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterEach(() => {
  console.error = originalError
})
