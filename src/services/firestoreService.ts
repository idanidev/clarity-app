// src/services/firestoreService.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  DocumentReference,
  DocumentSnapshot,
  GetOptions,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";
import type { 
  Expense, 
  ExpenseInput 
} from "../types/expense";
import type { 
  Categories, 
  Category, 
  Budgets,
  LegacyCategoryData 
} from "../types/category";
import type { 
  RecurringExpense, 
  Goals, 
  NotificationSettings,
  UserData
} from "../types/dashboard";

// ==================== TIPOS INTERNOS ====================

interface SubscribeOptions {
  limit?: number;
}

interface SaveCategoriesOptions {
  mergeMode?: 'smart' | 'replace' | 'merge';
}

interface OnboardingStatus {
  completed: boolean;
  completedAt: string | null;
}

interface RestoreCategoriesResult {
  success: boolean;
  message: string;
  restored: number;
  new?: number;
  updated?: number;
  total: number;
}

// ==================== HELPERS ====================

/**
 * Obtiene un documento con estrategia híbrida:
 * 1. Intenta leer del cache (rápido, funciona offline)
 * 2. Si no existe en cache, lee del servidor
 * 3. Si hay conexión, sincroniza en background
 */
const getDocHybrid = async (docRef: DocumentReference): Promise<DocumentSnapshot> => {
  try {
    // Primero intentar cache (instantáneo, funciona offline)
    const cacheOptions: GetOptions = { source: 'cache' };
    const cachedDoc = await getDoc(docRef, cacheOptions);
    
    if (cachedDoc.exists()) {
      // En background, verificar si hay actualizaciones en el servidor
      if (navigator.onLine) {
        const serverOptions: GetOptions = { source: 'server' };
        getDoc(docRef, serverOptions)
          .then((serverDoc) => {
            if (serverDoc.exists() && 
                serverDoc.metadata.hasPendingWrites === false &&
                JSON.stringify(serverDoc.data()) !== JSON.stringify(cachedDoc.data())) {
              // Datos actualizados en servidor: Firestore se encargará de sincronizar el cache
            }
          })
          .catch((err) => {
            console.warn("No se pudo verificar servidor:", err.code);
          });
      }
      
      return cachedDoc;
    }
  } catch {
    // Cache miss, continuar con servidor
  }
  
  // Si no está en cache, leer del servidor
  const serverOptions: GetOptions = { source: 'server' };
  const serverDoc = await getDoc(docRef, serverOptions);
  return serverDoc;
};

const normalizeSubcategories = (rawSubcategories: unknown): string[] => {
  if (!rawSubcategories) {
    return [];
  }

  if (Array.isArray(rawSubcategories)) {
    return rawSubcategories.filter((sub): sub is string => typeof sub === "string" && sub.trim().length > 0);
  }

  if (typeof rawSubcategories === "string") {
    return rawSubcategories.trim().length > 0 ? [rawSubcategories.trim()] : [];
  }

  if (typeof rawSubcategories === "object") {
    return Object.values(rawSubcategories as Record<string, unknown>)
      .filter((sub): sub is string => typeof sub === "string" && sub.trim().length > 0);
  }

  return [];
};

// ==================== EXPENSES ====================

export const addExpense = async (
  userId: string, 
  expenseData: Partial<ExpenseInput>
): Promise<Expense> => {
  try {
    // Validación: asegurar que amount no sea negativo
    if (expenseData.amount !== undefined && expenseData.amount < 0) {
      throw new Error("El monto del gasto no puede ser negativo");
    }

    const expensesRef = collection(db, "users", userId, "expenses");
    const docRef = await addDoc(expensesRef, {
      ...expenseData,
      amount: Math.max(0, expenseData.amount || 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...expenseData } as Expense;
  } catch (error) {
    console.error("Error adding expense:", error);
    throw error;
  }
};

export const updateExpense = async (
  userId: string, 
  expenseId: string, 
  expenseData: Partial<ExpenseInput>
): Promise<Expense> => {
  try {
    // Validación: asegurar que amount no sea negativo
    if (expenseData.amount !== undefined && expenseData.amount < 0) {
      throw new Error("El monto del gasto no puede ser negativo");
    }

    const expenseRef = doc(db, "users", userId, "expenses", expenseId);
    const updateData: Record<string, unknown> = {
      ...expenseData,
      updatedAt: new Date().toISOString(),
    };
    
    // Asegurar que amount sea >= 0 si está presente
    if (updateData.amount !== undefined) {
      updateData.amount = Math.max(0, updateData.amount as number);
    }

    await updateDoc(expenseRef, updateData);
    return { id: expenseId, ...expenseData } as Expense;
  } catch (error) {
    console.error("Error updating expense:", error);
    throw error;
  }
};

export const deleteExpense = async (userId: string, expenseId: string): Promise<void> => {
  try {
    const expenseRef = doc(db, "users", userId, "expenses", expenseId);
    await deleteDoc(expenseRef);
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
};

export const getExpenses = async (userId: string): Promise<Expense[]> => {
  try {
    const expensesRef = collection(db, "users", userId, "expenses");
    const q = query(expensesRef, orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Expense[];
  } catch (error) {
    console.error("Error getting expenses:", error);
    throw error;
  }
};

export const subscribeToExpenses = (
  userId: string, 
  callback: (expenses: Expense[]) => void, 
  options: SubscribeOptions = {}
): Unsubscribe => {
  const { limit: limitCount = 500 } = options;
  const expensesRef = collection(db, "users", userId, "expenses");
  
  const q = query(
    expensesRef,
    orderBy("date", "desc"),
    limit(limitCount)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const expenses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Expense[];
      callback(expenses);
    },
    (error) => {
      console.error("Error in expenses subscription:", error);
    }
  );
};

// ==================== RECURRING EXPENSES ====================

export const addRecurringExpense = async (
  userId: string, 
  recurringData: Partial<RecurringExpense>
): Promise<RecurringExpense> => {
  try {
    const amount = typeof recurringData.amount === 'string' 
      ? parseFloat(recurringData.amount) 
      : recurringData.amount;
      
    if (amount !== undefined && amount < 0) {
      throw new Error("El monto del gasto recurrente no puede ser negativo");
    }

    const recurringRef = collection(db, "users", userId, "recurringExpenses");
    const docRef = await addDoc(recurringRef, {
      ...recurringData,
      amount: Math.max(0, amount || 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...recurringData } as RecurringExpense;
  } catch (error) {
    console.error("Error adding recurring expense:", error);
    throw error;
  }
};

export const updateRecurringExpense = async (
  userId: string,
  recurringId: string,
  recurringData: Partial<RecurringExpense>
): Promise<RecurringExpense> => {
  try {
    const amount = typeof recurringData.amount === 'string' 
      ? parseFloat(recurringData.amount) 
      : recurringData.amount;
      
    if (amount !== undefined && amount < 0) {
      throw new Error("El monto del gasto recurrente no puede ser negativo");
    }

    const recurringRef = doc(db, "users", userId, "recurringExpenses", recurringId);
    const updateData: Record<string, unknown> = {
      ...recurringData,
      updatedAt: new Date().toISOString(),
    };
    
    if (updateData.amount !== undefined) {
      updateData.amount = Math.max(0, amount || 0);
    }

    await updateDoc(recurringRef, updateData);
    return { id: recurringId, ...recurringData } as RecurringExpense;
  } catch (error) {
    console.error("Error updating recurring expense:", error);
    throw error;
  }
};

export const deleteRecurringExpense = async (userId: string, recurringId: string): Promise<void> => {
  try {
    const recurringRef = doc(db, "users", userId, "recurringExpenses", recurringId);
    await deleteDoc(recurringRef);
  } catch (error) {
    console.error("Error deleting recurring expense:", error);
    throw error;
  }
};

export const getRecurringExpenses = async (userId: string): Promise<RecurringExpense[]> => {
  try {
    const recurringRef = collection(db, "users", userId, "recurringExpenses");
    const querySnapshot = await getDocs(recurringRef);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as RecurringExpense[];
  } catch (error) {
    console.error("Error getting recurring expenses:", error);
    throw error;
  }
};

export const subscribeToRecurringExpenses = (
  userId: string, 
  callback: (recurring: RecurringExpense[]) => void
): Unsubscribe => {
  const recurringRef = collection(db, "users", userId, "recurringExpenses");

  return onSnapshot(
    recurringRef,
    (snapshot) => {
      const recurring = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as RecurringExpense[];
      callback(recurring);
    },
    (error) => {
      console.error("Error in recurring expenses subscription:", error);
    }
  );
};

// ==================== CATEGORIES ====================

export const getCategorySubcategories = (categoryData: LegacyCategoryData | Category): string[] => {
  if (Array.isArray(categoryData)) {
    return normalizeSubcategories(categoryData);
  }

  if (categoryData && typeof categoryData === "object") {
    return normalizeSubcategories((categoryData as Category).subcategories);
  }

  return [];
};

export const getCategoryColor = (
  categoryData: LegacyCategoryData | Category | null | undefined, 
  defaultColor: string = "#8B5CF6"
): string => {
  if (!categoryData) {
    return defaultColor;
  }
  
  if (Array.isArray(categoryData)) {
    return defaultColor;
  }
  
  if (typeof categoryData === "object" && (categoryData as Category).color) {
    return (categoryData as Category).color;
  }
  
  if (typeof categoryData === "string") {
    return categoryData;
  }
  
  return defaultColor;
};

export const migrateCategoriesToNewFormat = (
  categories: Record<string, LegacyCategoryData | Category> | null | undefined
): Categories => {
  if (!categories || typeof categories !== "object") return {};

  const migrated: Categories = {};
  const defaultColors = [
    "#8B5CF6", "#3B82F6", "#EC4899", "#10B981", "#F59E0B",
    "#EF4444", "#6366F1", "#A855F7",
  ];

  let colorIndex = 0;

  Object.entries(categories).forEach(([categoryName, categoryData]) => {
    if (!categoryName) {
      return;
    }

    const normalizedSubcategories = Array.isArray(categoryData)
      ? normalizeSubcategories(categoryData)
      : normalizeSubcategories((categoryData as Category)?.subcategories);

    let color: string;
    if (categoryData && typeof categoryData === "object" && !Array.isArray(categoryData) && (categoryData as Category).color) {
      color = (categoryData as Category).color;
    } else if (Array.isArray(categoryData)) {
      color = defaultColors[colorIndex % defaultColors.length];
    } else if (categoryData && typeof categoryData === "object" && !(categoryData as Category).color) {
      color = (categoryData as Category).color || defaultColors[colorIndex % defaultColors.length];
    } else {
      color = defaultColors[colorIndex % defaultColors.length];
    }

    migrated[categoryName] = {
      ...(typeof categoryData === "object" && !Array.isArray(categoryData) ? categoryData as Category : {}),
      subcategories: Array.from(new Set(normalizedSubcategories)).sort((a, b) => a.localeCompare(b)),
      color,
    };

    colorIndex++;
  });

  return migrated;
};

export const saveCategories = async (
  userId: string, 
  categories: Categories, 
  options: SaveCategoriesOptions = {}
): Promise<Categories> => {
  try {
    if (!categories) {
      console.error("Invalid categories data provided to saveCategories: null or undefined");
      throw new Error("Invalid categories data");
    }
    
    if (Array.isArray(categories)) {
      console.error("ERROR CRÍTICO: Se intentó guardar categorías como array.");
      throw new Error("Categories cannot be an array. Must be an object.");
    }
    
    if (typeof categories !== "object") {
      console.error("Invalid categories data provided to saveCategories: not an object");
      throw new Error("Invalid categories data: must be an object");
    }

    const { mergeMode = "smart" } = options;

    let existingCategories: Categories = {};
    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const existing = userDoc.data().categories;
        if (existing) {
          existingCategories = migrateCategoriesToNewFormat(existing);
        }
      }
    } catch (readError) {
      console.warn("Could not read existing categories, proceeding with new data:", readError);
    }

    const migratedNewCategories = migrateCategoriesToNewFormat(categories);
    let finalCategories: Categories;

    if (mergeMode === "replace") {
      finalCategories = { ...migratedNewCategories };
      
      Object.keys(existingCategories).forEach((categoryName) => {
        if (!finalCategories[categoryName]) {
          finalCategories[categoryName] = existingCategories[categoryName];
        }
      });
    } else if (mergeMode === "merge") {
      finalCategories = { ...existingCategories };

      Object.entries(migratedNewCategories).forEach(([categoryName, categoryData]) => {
        if (!categoryName || !categoryData) {
          return;
        }

        const existingCategory = existingCategories[categoryName];
        const existingSubcategories = existingCategory
          ? getCategorySubcategories(existingCategory)
          : [];

        const newSubcategories = getCategorySubcategories(categoryData);
        
        const allSubcategories = Array.from(
          new Set([...existingSubcategories, ...newSubcategories])
        ).sort((a, b) => a.localeCompare(b));

        const color = categoryData.color || 
                     (existingCategory ? getCategoryColor(existingCategory) : "#8B5CF6");

        finalCategories[categoryName] = {
          subcategories: allSubcategories,
          color: color,
        };
      });
    } else {
      finalCategories = {};

      Object.entries(migratedNewCategories).forEach(([categoryName, categoryData]) => {
        if (!categoryName || !categoryData) {
          return;
        }

        const existingCategory = existingCategories[categoryName];
        const existingSubs = existingCategory ? getCategorySubcategories(existingCategory) : [];
        const newSubs = getCategorySubcategories(categoryData);
        
        const isSubset = newSubs.every((sub) => existingSubs.includes(sub));
        const isStrictSubset = isSubset && newSubs.length < existingSubs.length;
        
        if (isStrictSubset) {
          finalCategories[categoryName] = {
            subcategories: newSubs,
            color: categoryData.color || (existingCategory ? getCategoryColor(existingCategory) : "#8B5CF6"),
          };
        } else if (newSubs.length > existingSubs.length || !isSubset) {
          const allSubs = Array.from(new Set([...existingSubs, ...newSubs])).sort(
            (a, b) => a.localeCompare(b)
          );
          finalCategories[categoryName] = {
            subcategories: allSubs,
            color: categoryData.color || (existingCategory ? getCategoryColor(existingCategory) : "#8B5CF6"),
          };
        } else {
          finalCategories[categoryName] = {
            subcategories: newSubs,
            color: categoryData.color || (existingCategory ? getCategoryColor(existingCategory) : "#8B5CF6"),
          };
        }
      });
    }

    if (mergeMode !== "smart") {
      Object.keys(existingCategories).forEach((categoryName) => {
        if (!finalCategories[categoryName] && !migratedNewCategories[categoryName]) {
          console.log(`[saveCategories] Preserving existing category in ${mergeMode} mode: ${categoryName}`);
          finalCategories[categoryName] = existingCategories[categoryName];
        }
      });
    }

    Object.keys(existingCategories).forEach((categoryName) => {
      if (!finalCategories[categoryName]) {
        console.warn(
          `[saveCategories] ⚠️ Categoría "${categoryName}" será eliminada. ` +
          `Modo: ${mergeMode}. Esto es normal si el usuario la eliminó explícitamente.`
        );
      }
    });

    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      categories: finalCategories,
      updatedAt: new Date().toISOString(),
    });

    return finalCategories;
  } catch (error) {
    console.error("Error saving categories:", error);
    throw error;
  }
};

export const getUserCategories = async (userId: string): Promise<Categories | null> => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDocHybrid(userDocRef);

    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data();
    const categories = data.categories;
    
    if (categories === undefined || categories === null) {
      return null;
    }
    
    if (typeof categories !== "object" || Array.isArray(categories)) {
      console.error(`[getUserCategories] ERROR: Usuario ${userId} tiene categorías en formato inválido:`, typeof categories, Array.isArray(categories));
      return null;
    }
    
    const needsMigration = Object.values(categories).some(cat => Array.isArray(cat));
    
    if (needsMigration) {
      const finalCategories = migrateCategoriesToNewFormat(categories);
      
      const changed = JSON.stringify(finalCategories) !== JSON.stringify(categories);
      if (changed) {
        await updateDoc(userDocRef, {
          categories: finalCategories,
          updatedAt: new Date().toISOString(),
        });
      }
      
      return finalCategories;
    }

    return categories as Categories;
  } catch (error) {
    console.error(`[getUserCategories] ERROR para usuario ${userId}:`, error);
    throw error;
  }
};

export const getCategories = async (userId: string): Promise<Categories | null> => {
  return getUserCategories(userId);
};

// ==================== BUDGETS ====================

export const saveBudgets = async (userId: string, budgets: Budgets): Promise<void> => {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      budgets,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving budgets:", error);
    throw error;
  }
};

export const getUserBudgets = async (userId: string): Promise<Budgets | null> => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDocHybrid(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data().budgets || null;
    }
    return null;
  } catch (error) {
    console.error("Error getting budgets:", error);
    throw error;
  }
};

export const getBudgets = async (userId: string): Promise<Budgets | null> => {
  return getUserBudgets(userId);
};

// ==================== THEME ====================

export const saveTheme = async (userId: string, theme: 'light' | 'dark'): Promise<void> => {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      theme,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving theme:", error);
    throw error;
  }
};

export const getUserTheme = async (userId: string): Promise<'light' | 'dark'> => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDocHybrid(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data().theme || "light";
    }
    return "light";
  } catch (error) {
    console.error("Error getting theme:", error);
    return "light";
  }
};

// ==================== LANGUAGE ====================

export const saveUserLanguage = async (userId: string, language: string): Promise<void> => {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      language,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving language:", error);
    throw error;
  }
};

export const getUserLanguage = async (userId: string): Promise<string | null> => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDocHybrid(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data().language || null;
    }
    return null;
  } catch (error) {
    console.error("Error getting language:", error);
    return null;
  }
};

// ==================== CHANGELOG ====================

export const markChangelogAsSeen = async (userId: string, version: string): Promise<void> => {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      changelogSeen: version,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error marking changelog as seen:", error);
    throw error;
  }
};

export const markOnboardingAsCompleted = async (userId: string): Promise<void> => {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      onboardingCompleted: true,
      onboardingCompletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error marking onboarding as completed:", error);
    throw error;
  }
};

export const getOnboardingStatus = async (userId: string): Promise<OnboardingStatus> => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDocHybrid(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        completed: data.onboardingCompleted || false,
        completedAt: data.onboardingCompletedAt || null,
      };
    }
    return { completed: false, completedAt: null };
  } catch (error) {
    console.error("Error getting onboarding status:", error);
    return { completed: false, completedAt: null };
  }
};

export const getChangelogSeenVersion = async (userId: string): Promise<string | null> => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDocHybrid(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data().changelogSeen || null;
    }
    return null;
  } catch (error) {
    console.error("Error getting changelog seen version:", error);
    return null;
  }
};

// ==================== USER INITIALIZATION ====================

interface InitializeUserData {
  email?: string | null;
}

export const initializeUser = async (userId: string, userData: InitializeUserData): Promise<void> => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const currentData = userDoc.data();
      const updateData: Record<string, unknown> = {};
      
      if (userData.email && userData.email !== currentData.email) {
        updateData.email = userData.email;
        updateData.updatedAt = new Date().toISOString();
      }

      if (Object.keys(updateData).length > 0) {
        await updateDoc(userDocRef, updateData);
      }
      return;
    }

    await setDoc(userDocRef, {
      ...userData,
      categories: {},
      budgets: {},
      theme: "light",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error initializing user:", error);
    throw error;
  }
};

// ==================== INCOME ====================

export const saveIncome = async (userId: string, income: number | null): Promise<void> => {
  try {
    if (income === null || income === undefined) {
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, {
        income: null,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    const incomeValue = typeof income === 'string' ? parseFloat(income) : income;
    if (isNaN(incomeValue) || incomeValue < 0) {
      throw new Error("El ingreso debe ser un número positivo");
    }
    
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      income: incomeValue,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving income:", error);
    throw error;
  }
};

export const getUserIncome = async (userId: string): Promise<number | null> => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDocHybrid(userDocRef);

    if (userDoc.exists()) {
      const income = userDoc.data().income;
      if (income === undefined || income === null) {
        return null;
      }
      return income;
    }
    return null;
  } catch (error) {
    console.error("Error getting income:", error);
    throw error;
  }
};

// ==================== GOALS ====================

export const saveGoals = async (userId: string, goals: Partial<Goals>): Promise<void> => {
  try {
    const validatedGoals = { ...goals };
    
    if (validatedGoals.monthlySavingsGoal !== undefined) {
      const value = parseFloat(String(validatedGoals.monthlySavingsGoal)) || 0;
      if (value < 0) {
        throw new Error("El objetivo de ahorro mensual no puede ser negativo");
      }
      validatedGoals.monthlySavingsGoal = value;
    }
    
    if (validatedGoals.totalSavingsGoal !== undefined) {
      const value = parseFloat(String(validatedGoals.totalSavingsGoal)) || 0;
      if (value < 0) {
        throw new Error("El objetivo de ahorro total no puede ser negativo");
      }
      validatedGoals.totalSavingsGoal = value;
    }
    
    if (validatedGoals.categoryGoals) {
      Object.keys(validatedGoals.categoryGoals).forEach((category) => {
        const value = parseFloat(String(validatedGoals.categoryGoals![category])) || 0;
        if (value < 0) {
          throw new Error(`El objetivo de la categoría ${category} no puede ser negativo`);
        }
        validatedGoals.categoryGoals![category] = value;
      });
    }
    
    if (validatedGoals.longTermGoals && Array.isArray(validatedGoals.longTermGoals)) {
      validatedGoals.longTermGoals = validatedGoals.longTermGoals.map((goal) => {
        const targetAmount = parseFloat(String(goal.targetAmount)) || 0;
        const currentAmount = parseFloat(String(goal.currentAmount)) || 0;
        if (targetAmount < 0) {
          throw new Error(`El objetivo a largo plazo "${goal.name}" no puede tener un monto objetivo negativo`);
        }
        if (currentAmount < 0) {
          throw new Error(`El objetivo a largo plazo "${goal.name}" no puede tener un monto actual negativo`);
        }
        return {
          ...goal,
          targetAmount,
          currentAmount,
        };
      });
    }
    
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      goals: {
        ...validatedGoals,
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving goals:", error);
    throw error;
  }
};

export const getUserGoals = async (userId: string): Promise<Goals | null> => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDocHybrid(userDocRef);

    if (userDoc.exists()) {
      const goals = userDoc.data().goals;
      
      if (!goals) {
        return null;
      }
      
      if (goals.totalSavingsGoal !== undefined) {
        return {
          monthlySavingsGoal: goals.totalSavingsGoal || goals.monthlySavingsGoal || 0,
          totalSavingsGoal: goals.totalSavingsGoal || 0,
          categoryGoals: goals.categoryGoals || {},
          longTermGoals: goals.longTermGoals || [],
          achievements: goals.achievements || {
            totalCompleted: 0,
            streakMonths: 0,
            badges: [],
          },
          monthlyHistory: goals.monthlyHistory || {},
          createdAt: goals.createdAt || new Date().toISOString(),
          updatedAt: goals.updatedAt || new Date().toISOString(),
        };
      }
      
      const hasAnyGoal = 
        (goals.monthlySavingsGoal && goals.monthlySavingsGoal > 0) ||
        (goals.totalSavingsGoal && goals.totalSavingsGoal > 0) ||
        (goals.categoryGoals && Object.keys(goals.categoryGoals).length > 0) ||
        (goals.longTermGoals && goals.longTermGoals.length > 0);
      
      if (!hasAnyGoal) {
        return null;
      }
      
      return goals as Goals;
    }
    return null;
  } catch (error) {
    console.error("Error getting goals:", error);
    throw error;
  }
};

// ==================== NOTIFICATIONS ====================

export const saveNotificationSettings = async (
  userId: string, 
  settings: Partial<NotificationSettings>
): Promise<void> => {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      notificationSettings: {
        ...settings,
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving notification settings:", error);
    throw error;
  }
};

export const getUserNotificationSettings = async (userId: string): Promise<NotificationSettings> => {
  const defaultSettings: NotificationSettings = {
    budgetAlerts: {
      enabled: true,
      at80: true,
      at90: true,
      at100: true,
    },
    recurringReminders: {
      enabled: true,
    },
    customReminders: {
      enabled: true,
      message: "No olvides registrar tus gastos",
    },
    weeklyReminder: {
      enabled: true,
      dayOfWeek: 0,
      message: "¡No olvides registrar tus gastos de esta semana en Clarity!",
    },
    monthlyIncomeReminder: {
      enabled: true,
      dayOfMonth: 28,
    },
    pushNotifications: {
      enabled: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDocHybrid(userDocRef);

    if (userDoc.exists()) {
      const settings = userDoc.data().notificationSettings;
      return settings || defaultSettings;
    }
    return defaultSettings;
  } catch (error) {
    console.error("Error getting notification settings:", error);
    throw error;
  }
};

// ==================== RESTORE CATEGORIES FROM EXPENSES ====================

export const restoreCategoriesFromExpenses = async (userId: string): Promise<RestoreCategoriesResult> => {
  try {
    console.log(`[restoreCategoriesFromExpenses] Iniciando restauración para usuario: ${userId}`);

    const expenses = await getExpenses(userId);

    if (!expenses || expenses.length === 0) {
      console.log("[restoreCategoriesFromExpenses] No se encontraron gastos");
      return {
        success: false,
        message: "No se encontraron gastos para restaurar categorías",
        restored: 0,
        total: 0,
      };
    }

    console.log(`[restoreCategoriesFromExpenses] Se encontraron ${expenses.length} gastos`);

    const categoriesMap = new Map<string, { subcategories: Set<string> }>();

    expenses.forEach((expense) => {
      const category = expense.category;
      const subcategory = expense.subcategory;

      if (!category) {
        return;
      }

      if (!categoriesMap.has(category)) {
        categoriesMap.set(category, {
          subcategories: new Set(),
        });
      }

      if (subcategory && subcategory.trim()) {
        categoriesMap.get(category)!.subcategories.add(subcategory.trim());
      }
    });

    const restoredCategories: Categories = {};
    const defaultColors = [
      "#8B5CF6", "#3B82F6", "#EC4899", "#10B981", "#F59E0B",
      "#EF4444", "#6366F1", "#14B8A6", "#F97316", "#84CC16",
    ];

    let colorIndex = 0;
    categoriesMap.forEach((data, categoryName) => {
      restoredCategories[categoryName] = {
        subcategories: Array.from(data.subcategories).sort(),
        color: defaultColors[colorIndex % defaultColors.length],
      };
      colorIndex++;
    });

    console.log(`[restoreCategoriesFromExpenses] Categorías encontradas: ${Object.keys(restoredCategories).length}`);

    const currentCategories = await getUserCategories(userId);

    const mergedCategories: Categories = { ...currentCategories };

    let updatedCount = 0;
    let newCount = 0;

    Object.entries(restoredCategories).forEach(([categoryName, categoryData]) => {
      if (mergedCategories[categoryName]) {
        const existingSubs = Array.isArray(mergedCategories[categoryName].subcategories)
          ? mergedCategories[categoryName].subcategories
          : [];

        const newSubs = categoryData.subcategories;
        const allSubs = Array.from(new Set([...existingSubs, ...newSubs])).sort();

        mergedCategories[categoryName] = {
          ...mergedCategories[categoryName],
          subcategories: allSubs,
        };

        updatedCount++;
      } else {
        mergedCategories[categoryName] = categoryData;
        newCount++;
      }
    });

    await saveCategories(userId, mergedCategories);

    console.log(`[restoreCategoriesFromExpenses] Restauración completada: ${newCount} nuevas, ${updatedCount} actualizadas`);

    return {
      success: true,
      message: `Categorías restauradas: ${newCount} nuevas, ${updatedCount} actualizadas`,
      restored: Object.keys(restoredCategories).length,
      new: newCount,
      updated: updatedCount,
      total: Object.keys(mergedCategories).length,
    };
  } catch (error) {
    console.error("[restoreCategoriesFromExpenses] Error:", error);
    throw error;
  }
};

