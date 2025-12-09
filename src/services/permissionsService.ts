// src/services/permissionsService.ts
// Servicio para gestionar preferencias de permisos en Firestore

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface PermissionsPreferences {
  onboardingCompleted: boolean;
  onboardingCompletedAt?: string;
  microphoneDeniedAt?: number;
  notificationsDeniedAt?: number;
  askLaterUntil?: number; // Timestamp hasta cuando no preguntar
  lastShownAt?: number;
}

const PERMISSIONS_PREFS_KEY = 'clarity_permissions_preferences';
const COOLDOWN_DAYS = 7;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

/**
 * Obtener preferencias de permisos del usuario
 */
export const getPermissionsPreferences = async (
  userId: string
): Promise<PermissionsPreferences> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const data = userDoc.data();
    
    return {
      onboardingCompleted: data?.permissionsPreferences?.onboardingCompleted || false,
      onboardingCompletedAt: data?.permissionsPreferences?.onboardingCompletedAt,
      microphoneDeniedAt: data?.permissionsPreferences?.microphoneDeniedAt,
      notificationsDeniedAt: data?.permissionsPreferences?.notificationsDeniedAt,
      askLaterUntil: data?.permissionsPreferences?.askLaterUntil,
      lastShownAt: data?.permissionsPreferences?.lastShownAt,
    };
  } catch (error) {
    console.error('Error getting permissions preferences:', error);
    return {
      onboardingCompleted: false,
    };
  }
};

/**
 * Guardar preferencias de permisos
 */
export const savePermissionsPreferences = async (
  userId: string,
  preferences: Partial<PermissionsPreferences>
): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    const currentPrefs = userDoc.exists()
      ? (userDoc.data()?.permissionsPreferences || {})
      : {};
    
    const updatedPrefs: PermissionsPreferences = {
      ...currentPrefs,
      ...preferences,
    };
    
    if (userDoc.exists()) {
      await updateDoc(userDocRef, {
        permissionsPreferences: updatedPrefs,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await setDoc(userDocRef, {
        permissionsPreferences: updatedPrefs,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error saving permissions preferences:', error);
    throw error;
  }
};

/**
 * Marcar onboarding de permisos como completado
 */
export const markPermissionsOnboardingCompleted = async (
  userId: string
): Promise<void> => {
  await savePermissionsPreferences(userId, {
    onboardingCompleted: true,
    onboardingCompletedAt: new Date().toISOString(),
  });
};

/**
 * Marcar "más tarde" - no preguntar por 7 días
 */
export const markAskLater = async (userId: string): Promise<void> => {
  await savePermissionsPreferences(userId, {
    askLaterUntil: Date.now() + COOLDOWN_MS,
    lastShownAt: Date.now(),
  });
};

/**
 * Verificar si se debe mostrar el onboarding
 */
export const shouldShowPermissionsOnboarding = async (
  userId: string
): Promise<boolean> => {
  const prefs = await getPermissionsPreferences(userId);
  
  // Si ya completó el onboarding, no mostrar
  if (prefs.onboardingCompleted) {
    return false;
  }
  
  // Si eligió "más tarde", verificar si pasó el cooldown
  if (prefs.askLaterUntil) {
    const now = Date.now();
    if (now < prefs.askLaterUntil) {
      return false; // Todavía en cooldown
    }
  }
  
  return true;
};

/**
 * Marcar permiso como denegado
 */
export const markPermissionDenied = async (
  userId: string,
  permission: 'microphone' | 'notifications'
): Promise<void> => {
  const update: Partial<PermissionsPreferences> = {
    [`${permission}DeniedAt`]: Date.now(),
  };
  
  await savePermissionsPreferences(userId, update);
};

