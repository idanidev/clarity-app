import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import Auth from "./screens/Auth/Auth";
import { auth } from "./firebase";
import Dashboard from "./screens/Dashboard/Dashboard";
import { LanguageProvider, useTranslation } from "./contexts/LanguageContext";
import { saveUserLanguage } from "./services/firestoreService";
import { fadeIn, getTransition } from "./config/framerMotion";

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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={getTransition('fast')}
        >
          <LoadingScreen />
        </motion.div>
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider user={user} onLanguageChange={handleLanguageChange}>
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div
            key="auth"
            {...fadeIn}
            transition={getTransition('smooth')}
          >
            <Auth />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            {...fadeIn}
            transition={getTransition('smooth')}
          >
            <Dashboard user={user} />
          </motion.div>
        )}
      </AnimatePresence>
    </LanguageProvider>
  );
};

export default App;
