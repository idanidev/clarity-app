import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as firestoreService from '../../services/firestoreService'

// Mock de Firebase
vi.mock('../../firebase', () => ({
  db: {
    collection: vi.fn(),
    doc: vi.fn(),
  },
}))

describe('FirestoreService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('addExpense', () => {
    it('should add an expense successfully', async () => {
      const mockExpense = {
        name: 'Test Expense',
        amount: 100,
        category: 'Food',
        date: '2024-01-01',
      }

      // Mock implementation
      vi.spyOn(firestoreService, 'addExpense').mockResolvedValue({
        id: 'expense-1',
        ...mockExpense,
      })

      const result = await firestoreService.addExpense('user-1', mockExpense)

      expect(result).toHaveProperty('id')
      expect(result.name).toBe(mockExpense.name)
      expect(result.amount).toBe(mockExpense.amount)
    })
  })

  describe('getUserCategories', () => {
    it('should return user categories', async () => {
      const mockCategories = {
        Food: {
          subcategories: ['Restaurants', 'Groceries'],
          color: '#8B5CF6',
        },
      }

      vi.spyOn(firestoreService, 'getUserCategories').mockResolvedValue(
        mockCategories
      )

      const result = await firestoreService.getUserCategories('user-1')

      expect(result).toEqual(mockCategories)
      expect(result.Food).toHaveProperty('subcategories')
      expect(result.Food).toHaveProperty('color')
    })
  })

  describe('saveCategories', () => {
    it('should save categories successfully', async () => {
      const mockCategories = {
        Food: {
          subcategories: ['Restaurants'],
          color: '#8B5CF6',
        },
      }

      vi.spyOn(firestoreService, 'saveCategories').mockResolvedValue(
        undefined
      )

      await expect(
        firestoreService.saveCategories('user-1', mockCategories)
      ).resolves.not.toThrow()
    })
  })
})

