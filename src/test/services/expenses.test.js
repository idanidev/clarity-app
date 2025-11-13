import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as firestoreService from '../../services/firestoreService'

// Mock de Firebase
vi.mock('../../firebase', () => ({
  db: {},
}))

describe('Expenses Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('addExpense', () => {
    it('debe crear un gasto correctamente', async () => {
      const userId = 'test-user-1'
      const expenseData = {
        name: 'Test Expense',
        amount: 100.50,
        category: 'Alimentacion',
        subcategory: 'Supermercado',
        date: '2024-01-15',
        paymentMethod: 'Tarjeta',
      }
      const savedExpense = {
        id: 'expense-123',
        ...expenseData,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      }

      vi.spyOn(firestoreService, 'addExpense').mockResolvedValue(savedExpense)

      const result = await firestoreService.addExpense(userId, expenseData)

      expect(result).toHaveProperty('id', 'expense-123')
      expect(result.name).toBe(expenseData.name)
      expect(result.amount).toBe(expenseData.amount)
      expect(result.category).toBe(expenseData.category)
      expect(result.subcategory).toBe(expenseData.subcategory)
      expect(result.date).toBe(expenseData.date)
    })

    it('debe añadir timestamps (createdAt, updatedAt) al crear gasto', async () => {
      const userId = 'test-user-2'
      const expenseData = {
        name: 'Test Expense',
        amount: 50,
        category: 'Transporte',
        subcategory: 'Combustible',
        date: '2024-01-15',
        paymentMethod: 'Efectivo',
      }
      const savedExpense = {
        id: 'expense-456',
        ...expenseData,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      }

      vi.spyOn(firestoreService, 'addExpense').mockResolvedValue(savedExpense)

      const result = await firestoreService.addExpense(userId, expenseData)

      expect(result).toHaveProperty('createdAt')
      expect(result).toHaveProperty('updatedAt')
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
    })

    it('debe crear gasto recurrente correctamente', async () => {
      const userId = 'test-user-3'
      const expenseData = {
        name: 'Netflix',
        amount: 15.99,
        category: 'Ocio',
        subcategory: 'Streaming',
        date: '2024-01-15',
        paymentMethod: 'Tarjeta',
        isRecurring: true,
        recurringId: 'recurring-123',
      }
      const savedExpense = {
        id: 'expense-789',
        ...expenseData,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      }

      vi.spyOn(firestoreService, 'addExpense').mockResolvedValue(savedExpense)

      const result = await firestoreService.addExpense(userId, expenseData)

      expect(result.isRecurring).toBe(true)
      expect(result.recurringId).toBe('recurring-123')
    })

    it('debe manejar errores al crear gasto', async () => {
      const userId = 'test-user-4'
      const expenseData = {
        name: 'Test Expense',
        amount: 100,
        category: 'Alimentacion',
        subcategory: 'Supermercado',
        date: '2024-01-15',
        paymentMethod: 'Tarjeta',
      }

      vi.spyOn(firestoreService, 'addExpense').mockRejectedValue(
        new Error('Firebase error')
      )

      await expect(firestoreService.addExpense(userId, expenseData)).rejects.toThrow(
        'Firebase error'
      )
    })
  })

  describe('updateExpense', () => {
    it('debe actualizar un gasto correctamente', async () => {
      const userId = 'test-user-5'
      const expenseId = 'expense-123'
      const expenseData = {
        name: 'Updated Expense',
        amount: 150.75,
        category: 'Transporte',
        subcategory: 'Combustible',
        date: '2024-01-20',
        paymentMethod: 'Tarjeta',
      }
      const updatedExpense = {
        id: expenseId,
        ...expenseData,
        updatedAt: '2024-01-20T10:00:00.000Z',
      }

      vi.spyOn(firestoreService, 'updateExpense').mockResolvedValue(updatedExpense)

      const result = await firestoreService.updateExpense(userId, expenseId, expenseData)

      expect(result).toHaveProperty('id', expenseId)
      expect(result.name).toBe(expenseData.name)
      expect(result.amount).toBe(expenseData.amount)
    })

    it('debe actualizar el timestamp (updatedAt) al modificar gasto', async () => {
      const userId = 'test-user-6'
      const expenseId = 'expense-456'
      const expenseData = {
        name: 'Updated Expense',
        amount: 200,
        category: 'Alimentacion',
        subcategory: 'Restaurantes',
        date: '2024-01-20',
        paymentMethod: 'Tarjeta',
      }
      const updatedExpense = {
        id: expenseId,
        ...expenseData,
        updatedAt: '2024-01-20T10:00:00.000Z',
      }

      vi.spyOn(firestoreService, 'updateExpense').mockResolvedValue(updatedExpense)

      const result = await firestoreService.updateExpense(userId, expenseId, expenseData)

      expect(result).toHaveProperty('updatedAt')
      expect(result.updatedAt).toBeDefined()
    })

    it('debe manejar errores al actualizar gasto', async () => {
      const userId = 'test-user-7'
      const expenseId = 'expense-789'
      const expenseData = {
        name: 'Updated Expense',
        amount: 100,
        category: 'Alimentacion',
        subcategory: 'Supermercado',
        date: '2024-01-20',
        paymentMethod: 'Tarjeta',
      }

      vi.spyOn(firestoreService, 'updateExpense').mockRejectedValue(
        new Error('Firebase error')
      )

      await expect(
        firestoreService.updateExpense(userId, expenseId, expenseData)
      ).rejects.toThrow('Firebase error')
    })
  })

  describe('deleteExpense', () => {
    it('debe eliminar un gasto correctamente', async () => {
      const userId = 'test-user-8'
      const expenseId = 'expense-123'

      vi.spyOn(firestoreService, 'deleteExpense').mockResolvedValue(undefined)

      await expect(
        firestoreService.deleteExpense(userId, expenseId)
      ).resolves.not.toThrow()
    })

    it('debe manejar errores al eliminar gasto', async () => {
      const userId = 'test-user-9'
      const expenseId = 'expense-456'

      vi.spyOn(firestoreService, 'deleteExpense').mockRejectedValue(
        new Error('Firebase error')
      )

      await expect(firestoreService.deleteExpense(userId, expenseId)).rejects.toThrow(
        'Firebase error'
      )
    })
  })

  describe('getExpenses', () => {
    it('debe obtener gastos del usuario ordenados por fecha (desc)', async () => {
      const userId = 'test-user-10'
      const mockExpenses = [
        {
          id: 'expense-1',
          name: 'Expense 1',
          amount: 100,
          category: 'Alimentacion',
          subcategory: 'Supermercado',
          date: '2024-01-20',
          paymentMethod: 'Tarjeta',
        },
        {
          id: 'expense-2',
          name: 'Expense 2',
          amount: 50,
          category: 'Transporte',
          subcategory: 'Combustible',
          date: '2024-01-15',
          paymentMethod: 'Efectivo',
        },
      ]

      vi.spyOn(firestoreService, 'getExpenses').mockResolvedValue(mockExpenses)

      const result = await firestoreService.getExpenses(userId)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('expense-1')
      expect(result[1].id).toBe('expense-2')
    })

    it('debe retornar array vacío si el usuario no tiene gastos', async () => {
      const userId = 'test-user-11'

      vi.spyOn(firestoreService, 'getExpenses').mockResolvedValue([])

      const result = await firestoreService.getExpenses(userId)

      expect(result).toEqual([])
    })

    it('debe manejar errores al obtener gastos', async () => {
      const userId = 'test-user-12'

      vi.spyOn(firestoreService, 'getExpenses').mockRejectedValue(
        new Error('Firebase error')
      )

      await expect(firestoreService.getExpenses(userId)).rejects.toThrow('Firebase error')
    })
  })
})
