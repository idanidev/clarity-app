import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Limpiar después de cada test
afterEach(() => {
  cleanup()
})

// Mock de window.scrollTo para los tests
globalThis.scrollTo = vi.fn()
window.scrollTo = vi.fn()

// Mock de Firebase para tests
vi.mock('../firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(() => () => {}),
  },
  db: {},
}))

// Mock de Firebase Functions
vi.mock('../services/firestoreService', () => ({
  addExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
  getExpenses: vi.fn(),
  subscribeToExpenses: vi.fn(),
  addRecurringExpense: vi.fn(),
  updateRecurringExpense: vi.fn(),
  deleteRecurringExpense: vi.fn(),
  getRecurringExpenses: vi.fn(),
  subscribeToRecurringExpenses: vi.fn(),
  saveCategories: vi.fn(),
  getUserCategories: vi.fn(),
  saveBudgets: vi.fn(),
  getUserBudgets: vi.fn(),
  getUserLanguage: vi.fn(() => Promise.resolve('es')),
  saveUserLanguage: vi.fn(),
}))

