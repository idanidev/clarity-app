// src/services/firestoreService.js
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { db } from "../firebase";

// ==================== EXPENSES ====================

export const addExpense = async (userId, expenseData) => {
  try {
    const expensesRef = collection(db, "users", userId, "expenses");
    const docRef = await addDoc(expensesRef, {
      ...expenseData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...expenseData };
  } catch (error) {
    console.error("Error adding expense:", error);
    throw error;
  }
};

export const updateExpense = async (userId, expenseId, expenseData) => {
  try {
    const expenseRef = doc(db, "users", userId, "expenses", expenseId);
    await updateDoc(expenseRef, {
      ...expenseData,
      updatedAt: new Date().toISOString(),
    });
    return { id: expenseId, ...expenseData };
  } catch (error) {
    console.error("Error updating expense:", error);
    throw error;
  }
};

export const deleteExpense = async (userId, expenseId) => {
  try {
    const expenseRef = doc(db, "users", userId, "expenses", expenseId);
    await deleteDoc(expenseRef);
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
};

export const getExpenses = async (userId) => {
  try {
    const expensesRef = collection(db, "users", userId, "expenses");
    const q = query(expensesRef, orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting expenses:", error);
    throw error;
  }
};

export const subscribeToExpenses = (userId, callback) => {
  const expensesRef = collection(db, "users", userId, "expenses");
  const q = query(expensesRef, orderBy("date", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const expenses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(expenses);
    },
    (error) => {
      console.error("Error in expenses subscription:", error);
    }
  );
};

// ==================== RECURRING EXPENSES ====================

export const addRecurringExpense = async (userId, recurringData) => {
  try {
    const recurringRef = collection(db, "users", userId, "recurringExpenses");
    const docRef = await addDoc(recurringRef, {
      ...recurringData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...recurringData };
  } catch (error) {
    console.error("Error adding recurring expense:", error);
    throw error;
  }
};

export const updateRecurringExpense = async (
  userId,
  recurringId,
  recurringData
) => {
  try {
    const recurringRef = doc(
      db,
      "users",
      userId,
      "recurringExpenses",
      recurringId
    );
    await updateDoc(recurringRef, {
      ...recurringData,
      updatedAt: new Date().toISOString(),
    });
    return { id: recurringId, ...recurringData };
  } catch (error) {
    console.error("Error updating recurring expense:", error);
    throw error;
  }
};

export const deleteRecurringExpense = async (userId, recurringId) => {
  try {
    const recurringRef = doc(
      db,
      "users",
      userId,
      "recurringExpenses",
      recurringId
    );
    await deleteDoc(recurringRef);
  } catch (error) {
    console.error("Error deleting recurring expense:", error);
    throw error;
  }
};

export const getRecurringExpenses = async (userId) => {
  try {
    const recurringRef = collection(db, "users", userId, "recurringExpenses");
    // Traer TODOS los gastos recurrentes (activos e inactivos)
    const querySnapshot = await getDocs(recurringRef);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting recurring expenses:", error);
    throw error;
  }
};

export const subscribeToRecurringExpenses = (userId, callback) => {
  const recurringRef = collection(db, "users", userId, "recurringExpenses");
  // Traer TODOS los gastos recurrentes (activos e inactivos)

  return onSnapshot(
    recurringRef,
    (snapshot) => {
      const recurring = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(recurring);
    },
    (error) => {
      console.error("Error in recurring expenses subscription:", error);
    }
  );
};

// ==================== CATEGORIES ====================

// Helper functions for category structure compatibility
export const getCategorySubcategories = (categoryData) => {
  if (Array.isArray(categoryData)) {
    // Old format: ["Sub1", "Sub2"]
    return categoryData;
  }
  if (categoryData && categoryData.subcategories) {
    // New format: { subcategories: ["Sub1", "Sub2"], color: "#..." }
    return categoryData.subcategories;
  }
  return [];
};

export const getCategoryColor = (categoryData, defaultColor = "#8B5CF6") => {
  if (Array.isArray(categoryData)) {
    // Old format: return default color
    return defaultColor;
  }
  if (categoryData && categoryData.color) {
    return categoryData.color;
  }
  return defaultColor;
};

export const migrateCategoriesToNewFormat = (categories) => {
  if (!categories) return {};
  
  const migrated = {};
  const defaultColors = [
    "#8B5CF6", // purple
    "#3B82F6", // blue
    "#EC4899", // pink
    "#10B981", // green
    "#F59E0B", // amber
    "#EF4444", // red
    "#6366F1", // indigo
    "#A855F7", // violet
  ];
  
  let colorIndex = 0;
  
  Object.entries(categories).forEach(([categoryName, categoryData]) => {
    if (Array.isArray(categoryData)) {
      // Old format: migrate to new format
      migrated[categoryName] = {
        subcategories: categoryData,
        color: defaultColors[colorIndex % defaultColors.length],
      };
      colorIndex++;
    } else if (categoryData && typeof categoryData === 'object') {
      // Already in new format or partially migrated
      migrated[categoryName] = {
        subcategories: categoryData.subcategories || [],
        color: categoryData.color || defaultColors[colorIndex % defaultColors.length],
      };
      colorIndex++;
    }
  });
  
  return migrated;
};

export const saveCategories = async (userId, categories) => {
  try {
    // Ensure categories are in new format
    const migratedCategories = migrateCategoriesToNewFormat(categories);
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      categories: migratedCategories,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving categories:", error);
    throw error;
  }
};

export const getUserCategories = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const categories = userDoc.data().categories || null;
      // Migrate to new format if needed
      return categories ? migrateCategoriesToNewFormat(categories) : null;
    }
    return null;
  } catch (error) {
    console.error("Error getting categories:", error);
    throw error;
  }
};

export const getCategories = async (userId) => {
  return getUserCategories(userId);
};

// ==================== BUDGETS ====================

export const saveBudgets = async (userId, budgets) => {
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

export const getUserBudgets = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data().budgets || null;
    }
    return null;
  } catch (error) {
    console.error("Error getting budgets:", error);
    throw error;
  }
};

export const getBudgets = async (userId) => {
  return getUserBudgets(userId);
};

// ==================== THEME ====================

export const saveTheme = async (userId, theme) => {
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

export const getUserTheme = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

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

export const saveUserLanguage = async (userId, language) => {
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

export const getUserLanguage = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

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

export const markChangelogAsSeen = async (userId, version) => {
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

export const getChangelogSeenVersion = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

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

export const initializeUser = async (userId, userData) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    const defaultCategories = {
      Alimentacion: {
        subcategories: ["Supermercado", "Restaurantes", "Cafeterias"],
        color: "#8B5CF6",
      },
      Transporte: {
        subcategories: ["Combustible", "Transporte publico", "Taxi"],
        color: "#3B82F6",
      },
      Vivienda: {
        subcategories: ["Alquiler", "Hipoteca", "Suministros"],
        color: "#EC4899",
      },
      Ocio: {
        subcategories: ["Streaming", "Deportes", "Hobbies"],
        color: "#10B981",
      },
      Salud: {
        subcategories: ["Medico", "Farmacia", "Gimnasio"],
        color: "#F59E0B",
      },
      Compras: {
        subcategories: ["Ropa", "Electronica", "Otros"],
        color: "#EF4444",
      },
      Educacion: {
        subcategories: ["Cursos", "Libros", "Material"],
        color: "#6366F1",
      },
    };

    if (userDoc.exists()) {
      const updateData = {
        ...userData,
        updatedAt: new Date().toISOString(),
      };

      const currentData = userDoc.data();
      if (!currentData.categories) {
        updateData.categories = defaultCategories;
      }
      if (!currentData.budgets) {
        updateData.budgets = {};
      }
      if (!currentData.theme) {
        updateData.theme = "light";
      }

      await updateDoc(userDocRef, updateData);
      return;
    }

    await setDoc(userDocRef, {
      ...userData,
      categories: defaultCategories,
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
