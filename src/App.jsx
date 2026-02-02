import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import Auth from "./components/Auth";
import { auth } from "./firebase";
import Dashboard from "./screens/Dashboard/Dashboard";
import { LanguageProvider, useTranslation } from "./contexts/LanguageContext";
import {
  saveUserLanguage,
  checkAndProcessRecurringExpenses,
} from "./services/firestoreService";

const LoadingScreen = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <span className="text-purple-600 font-semibold text-lg">
        {t("common.loading")}
      </span>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setInitializing(false);

      if (currentUser) {
        // Check for recurring expenses when user logs in
        checkAndProcessRecurringExpenses(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLanguageChange = async (language) => {
    if (user) {
      try {
        await saveUserLanguage(user.uid, language);
      } catch (error) {
        console.error("Error saving language:", error);
      }
    }
  };

  if (initializing) {
    return (
      <LanguageProvider user={null} onLanguageChange={handleLanguageChange}>
        <LoadingScreen />
      </LanguageProvider>
    );
  }

  if (!user) {
    return (
      <LanguageProvider user={user} onLanguageChange={handleLanguageChange}>
        <Auth />
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider user={user} onLanguageChange={handleLanguageChange}>
      <Dashboard user={user} />
    </LanguageProvider>
  );
};

export default App;
