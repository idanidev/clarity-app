// src/services/goalsService.ts

import type { 
  Goals, 
  Badge, 
  LongTermGoal, 
  MonthlyHistory,
  MonthlyHistoryEntry,
  LongTermGoalProgress,
  MonthComparison,
  CompletedGoalNotification
} from '../types/dashboard';

/**
 * Servicio para gestión de objetivos y logros
 * Calcula badges, rachas, comparaciones y detecta objetivos completados
 */

// ==================== BADGES ====================

export const BADGES: Record<string, Badge> = {
  FIRST_SAVER: {
    id: "first-saver",
    name: "🎯 Primer Ahorrador",
    description: "Completa tu primer objetivo mensual",
    condition: "completeFirstMonthlyGoal",
  },
  MONTH_MASTER: {
    id: "month-master",
    name: "⭐ Maestro del Mes",
    description: "Cumple tu objetivo mensual",
    condition: "completeMonthlyGoal",
  },
  STREAK_3: {
    id: "streak-3",
    name: "🔥 Racha de 3",
    description: "Cumple objetivos 3 meses seguidos",
    condition: "threeMonthsStreak",
  },
  STREAK_6: {
    id: "streak-6",
    name: "💎 Racha de 6",
    description: "Cumple objetivos 6 meses seguidos",
    condition: "sixMonthsStreak",
  },
  BIG_SAVER: {
    id: "big-saver",
    name: "💰 Gran Ahorrador",
    description: "Ahorra más de €1,000 en un mes",
    condition: "saveOver1000",
  },
  EARLY_BIRD: {
    id: "early-bird",
    name: "🐦 Madrugador",
    description: "Cumple tu objetivo antes del día 15",
    condition: "completeGoalByDay15",
  },
  OVERACHIEVER: {
    id: "overachiever",
    name: "🚀 Súper Cumplidor",
    description: "Cumple tu objetivo al 150% o más",
    condition: "overachieveGoal",
  },
};

// ==================== INTERFACES INTERNAS ====================

interface HistoryEntry extends MonthlyHistoryEntry {
  month: string;
}

// ==================== CÁLCULO DE BADGES ====================

/**
 * Calcula los badges que el usuario debería tener basado en su historial
 */
export const calculateBadges = (
  goals: Goals | null,
  monthlyHistory: MonthlyHistory | undefined,
  income: number,
  currentMonthExpenses: number
): Badge[] => {
  const badges: Badge[] = [];
  
  if (!goals) return badges;
  
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const daysPassed = today.getDate();

  // Obtener historial como array ordenado
  const historyEntries: HistoryEntry[] = Object.entries(monthlyHistory || {})
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => ({ month: key, ...value }));

  // 1. FIRST_SAVER - Primer objetivo completado
  const completedMonths = historyEntries.filter((h) => h.completed);
  if (completedMonths.length >= 1) {
    badges.push(BADGES.FIRST_SAVER);
  }

  // 2. MONTH_MASTER - Objetivo mensual completado
  if (historyEntries.length > 0) {
    const lastEntry = historyEntries[historyEntries.length - 1];
    if (lastEntry.completed) {
      badges.push(BADGES.MONTH_MASTER);
    }
  }

  // 3. STREAK_3 - 3 meses seguidos
  let currentStreak = 0;
  for (let i = historyEntries.length - 1; i >= 0; i--) {
    if (historyEntries[i].completed) {
      currentStreak++;
    } else {
      break;
    }
  }
  if (currentStreak >= 3) {
    badges.push(BADGES.STREAK_3);
  }

  // 4. STREAK_6 - 6 meses seguidos
  if (currentStreak >= 6) {
    badges.push(BADGES.STREAK_6);
  }

  // 5. BIG_SAVER - Ahorrar más de €1,000
  const monthlySavings = income - currentMonthExpenses;
  if (monthlySavings >= 1000) {
    badges.push(BADGES.BIG_SAVER);
  }

  // 6. EARLY_BIRD - Completar objetivo antes del día 15
  const monthlySavingsGoal = goals.monthlySavingsGoal || 0;
  if (monthlySavingsGoal > 0 && daysPassed <= 15) {
    if (monthlySavings >= monthlySavingsGoal) {
      badges.push(BADGES.EARLY_BIRD);
    }
  }

  // 7. OVERACHIEVER - Cumplir objetivo al 150% o más
  if (monthlySavingsGoal > 0) {
    const percentage = (monthlySavings / monthlySavingsGoal) * 100;
    if (percentage >= 150) {
      badges.push(BADGES.OVERACHIEVER);
    }
  }

  return badges;
};

// ==================== CÁLCULO DE RACHA ====================

/**
 * Calcula la racha actual de meses cumpliendo objetivos
 */
export const calculateStreak = (monthlyHistory: MonthlyHistory | undefined): number => {
  const historyEntries: HistoryEntry[] = Object.entries(monthlyHistory || {})
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => ({ month: key, ...value }));

  let streak = 0;
  for (let i = historyEntries.length - 1; i >= 0; i--) {
    if (historyEntries[i].completed) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

// ==================== COMPARACIÓN CON MES ANTERIOR ====================

/**
 * Compara el mes actual con el mes anterior
 */
export const compareWithPreviousMonth = (
  monthlyHistory: MonthlyHistory | undefined,
  currentMonthSavings: number
): MonthComparison | null => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  // Obtener mes anterior
  let prevYear = currentYear;
  let prevMonth = currentMonth - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = currentYear - 1;
  }
  const prevMonthKey = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;

  const prevMonthData = monthlyHistory?.[prevMonthKey];

  if (!prevMonthData) {
    return null;
  }

  const difference = currentMonthSavings - prevMonthData.savings;
  const percentage = prevMonthData.savings > 0 ? (difference / prevMonthData.savings) * 100 : 0;

  return {
    previousSavings: prevMonthData.savings,
    difference,
    percentage,
    isBetter: difference > 0,
  };
};

// ==================== ACTUALIZACIÓN DE HISTORIAL ====================

/**
 * Actualiza el historial mensual con los datos del mes actual
 */
export const updateMonthlyHistory = (
  goals: Goals | null,
  income: number,
  currentMonthExpenses: number
): MonthlyHistory => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

  const monthlySavings = income - currentMonthExpenses;
  const monthlyGoal = goals?.monthlySavingsGoal || 0;
  const completed = monthlyGoal > 0 && monthlySavings >= monthlyGoal;

  return {
    ...(goals?.monthlyHistory || {}),
    [currentMonthKey]: {
      savings: monthlySavings,
      goal: monthlyGoal,
      completed,
      updatedAt: new Date().toISOString(),
    },
  };
};

// ==================== OBJETIVOS A LARGO PLAZO ====================

/**
 * Calcula si un objetivo a largo plazo está completo
 */
export const isLongTermGoalComplete = (goal: LongTermGoal): boolean => {
  return goal.currentAmount >= goal.targetAmount;
};

/**
 * Calcula cuánto falta para completar un objetivo a largo plazo
 */
export const getLongTermGoalProgress = (goal: LongTermGoal | null): LongTermGoalProgress => {
  if (!goal) {
    return {
      progress: 0,
      remaining: 0,
      daysRemaining: null,
      monthlyContribution: 0,
      isOnTrack: false,
    };
  }
  
  const targetAmount = goal.targetAmount || 0;
  const currentAmount = goal.currentAmount || 0;
  const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
  const remaining = Math.max(0, targetAmount - currentAmount);
  
  const daysRemaining = goal.targetDate 
    ? Math.max(0, Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : null;
    
  const monthlyContribution = daysRemaining && daysRemaining > 30 
    ? remaining / (daysRemaining / 30)
    : goal.monthlyContribution || 0;

  return {
    progress: Math.min(progress, 100),
    remaining,
    daysRemaining,
    monthlyContribution,
    isOnTrack: daysRemaining !== null && daysRemaining > 0 
      ? (remaining / daysRemaining) * 30 <= (goal.monthlyContribution || 0) 
      : false,
  };
};

// ==================== DETECCIÓN DE OBJETIVOS COMPLETADOS ====================

/**
 * Detecta objetivos recién completados (para mostrar celebraciones)
 */
export const detectNewlyCompletedGoals = (
  oldGoals: Goals | null,
  newGoals: Goals | null
): CompletedGoalNotification[] => {
  const completed: CompletedGoalNotification[] = [];

  // Verificar objetivo mensual
  if (oldGoals && newGoals) {
    const oldHistory = oldGoals.monthlyHistory || {};
    const newHistory = newGoals.monthlyHistory || {};
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

    const oldEntry = oldHistory[currentMonthKey];
    const newEntry = newHistory[currentMonthKey];

    if (newEntry?.completed && (!oldEntry || !oldEntry.completed)) {
      completed.push({
        type: "monthly",
        name: "Objetivo Mensual",
        amount: newEntry.savings,
        goal: newEntry.goal,
      });
    }
  }

  // Verificar objetivos a largo plazo
  if (newGoals?.longTermGoals) {
    newGoals.longTermGoals.forEach((goal) => {
      if (goal.status === "active" && isLongTermGoalComplete(goal)) {
        const wasCompleted = oldGoals?.longTermGoals?.find((g) => g.id === goal.id)?.status === "completed";
        if (!wasCompleted) {
          completed.push({
            type: "longTerm",
            name: goal.name,
            amount: goal.currentAmount,
            goal: goal.targetAmount,
          });
        }
      }
    });
  }

  return completed;
};

