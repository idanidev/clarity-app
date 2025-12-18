// src/hooks/useAuth.ts
import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  User,
} from "firebase/auth";
import { useCallback, useEffect, useState } from "react";
import { auth, googleProvider } from "../firebase";

interface BiometricResult {
  email: string;
  success: boolean;
}

interface AuthHook {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  isEmailVerified: boolean;
  biometricAvailable: boolean;
  registerBiometric: (userId: string, email: string) => Promise<Credential | null>;
  signInWithBiometric: () => Promise<BiometricResult>;
  hasBiometricCredentials: () => boolean;
  removeBiometricCredentials: () => void;
}

export const useAuth = (): AuthHook => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // Verificar disponibilidad de WebAuthn/biometría
  useEffect(() => {
    const checkBiometric = async () => {
      if (window.PublicKeyCredential) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setBiometricAvailable(available);
        } catch (err) {
          console.log("Biometric not available:", err);
          setBiometricAvailable(false);
        }
      }
    };
    checkBiometric();
  }, []);

  // Escuchar cambios de autenticación de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        console.log("🔐 useAuth.ts - Auth state changed:", {
          hasUser: !!currentUser,
          userId: currentUser?.uid,
          email: currentUser?.email,
        });

        setUser(currentUser);
        setLoading(false);
        console.log("✅ useAuth.ts - User state updated");
      },
      (error) => {
        // Manejar errores de autenticación
        console.error("❌ useAuth.ts - Auth state error:", error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    console.log("🔑 useAuth.signIn - Starting login:", { email });
    setLoading(true);
    setError(null);

    // Timeout de seguridad para evitar loading infinito
    const timeoutId = setTimeout(() => {
      console.warn("⏱️ useAuth.signIn - Timeout reached");
      setLoading(false);
      setError("auth/timeout");
    }, 10000); // 10 segundos máximo

    try {
      console.log("🔑 useAuth.signIn - Calling Firebase signInWithEmailAndPassword", {
        email,
        authApp: auth.app.name,
        authConfig: {
          apiKey: auth.app.options.apiKey?.substring(0, 10) + "...",
          projectId: auth.app.options.projectId,
          authDomain: auth.app.options.authDomain,
        },
        currentUser: auth.currentUser?.uid || "none",
      });

      // Verificar que auth esté inicializado
      if (!auth) {
        throw new Error("Auth not initialized");
      }

      // Test de conectividad antes de intentar login
      if (!navigator.onLine) {
        console.error("❌ No internet connection");
        throw new Error("No internet connection");
      }

      console.log("⏳ useAuth.signIn - Starting signInWithEmailAndPassword...");

      // Intentar la autenticación directamente
      const result = await signInWithEmailAndPassword(auth, email, password);

      console.log("✅ useAuth.signIn - signInWithEmailAndPassword completed");

      clearTimeout(timeoutId);

      // Verificar que el usuario esté realmente autenticado
      await result.user.reload();

      console.log("✅ useAuth.signIn - Firebase login successful:", {
        userId: result.user.uid,
        email: result.user.email,
        currentUser: auth.currentUser?.uid,
        emailVerified: result.user.emailVerified,
      });

      // Forzar actualización del estado
      setUser(result.user);
      setLoading(false);

      // Verificar que onAuthStateChanged se dispare
      console.log("🔍 useAuth.signIn - Waiting for onAuthStateChanged to fire...");

      return result.user;
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("❌ useAuth.signIn - Firebase login error:", {
        code: err.code,
        message: err.message,
      });
      setError(err.code || "auth/unknown-error");
      setLoading(false);
      throw err;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Enviar email de verificación en segundo plano
      try {
        await sendEmailVerification(result.user);
      } catch (verificationError) {
        console.error("Error enviando email de verificación:", verificationError);
      }

      return result.user;
    } catch (err: any) {
      setError(err.code || "auth/unknown-error");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err: any) {
      setError(err.code || "auth/unknown-error");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      setError(err.code || "auth/unknown-error");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await firebaseSignOut(auth);
      // Limpiar credenciales biométricas del localStorage
      localStorage.removeItem('biometric_credential_id');
      localStorage.removeItem('biometric_user_email');
      localStorage.removeItem('biometric_user_id');
    } catch (err: any) {
      setError(err.code || "auth/unknown-error");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    if (!user) throw new Error("No user logged in");
    setLoading(true);
    setError(null);
    try {
      await sendEmailVerification(user);
    } catch (err: any) {
      setError(err.code || "auth/unknown-error");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ============ AUTENTICACIÓN BIOMÉTRICA ============

  const registerBiometric = useCallback(async (userId: string, email: string) => {
    if (!biometricAvailable) {
      throw new Error("Biometric authentication not available");
    }

    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: "Clarity",
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: email,
          displayName: email,
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },
          { alg: -257, type: "public-key" },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
        attestation: "none",
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      });

      if (!credential) {
        throw new Error("Failed to create credential");
      }

      localStorage.setItem('biometric_credential_id', btoa(String.fromCharCode(...new Uint8Array((credential as any).rawId))));
      localStorage.setItem('biometric_user_email', email);
      localStorage.setItem('biometric_user_id', userId);

      return credential;
    } catch (err) {
      console.error("Error registrando biometría:", err);
      throw err;
    }
  }, [biometricAvailable]);

  const signInWithBiometric = useCallback(async (): Promise<BiometricResult> => {
    if (!biometricAvailable) {
      throw new Error("Biometric authentication not available");
    }

    const credentialId = localStorage.getItem('biometric_credential_id');
    const email = localStorage.getItem('biometric_user_email');

    if (!credentialId || !email) {
      throw new Error("No biometric credentials found. Please login first.");
    }

    setLoading(true);
    setError(null);

    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials: [{
          id: Uint8Array.from(atob(credentialId), c => c.charCodeAt(0)),
          type: 'public-key',
          transports: ['internal'],
        }],
        timeout: 60000,
        userVerification: "required",
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      });

      if (!assertion) {
        throw new Error("Biometric authentication failed");
      }

      return { email, success: true };
    } catch (err) {
      setError("biometric-failed");
      localStorage.removeItem('biometric_credential_id');
      localStorage.removeItem('biometric_user_email');
      localStorage.removeItem('biometric_user_id');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [biometricAvailable]);

  const hasBiometricCredentials = useCallback(() => {
    return localStorage.getItem('biometric_credential_id') !== null;
  }, []);

  const removeBiometricCredentials = useCallback(() => {
    localStorage.removeItem('biometric_credential_id');
    localStorage.removeItem('biometric_user_email');
    localStorage.removeItem('biometric_user_id');
  }, []);

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    resetPassword,
    signOut,
    resendVerificationEmail,
    isEmailVerified: user?.emailVerified ?? false,
    biometricAvailable,
    registerBiometric,
    signInWithBiometric,
    hasBiometricCredentials,
    removeBiometricCredentials,
  };
};