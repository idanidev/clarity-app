import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import Auth from "./components/Auth";
import { auth } from "./firebase";
import Dashboard from "./screens/Dashboard/Dashboard";

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

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <span className="text-purple-600 font-semibold text-lg">
          Cargando...
        </span>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return <Dashboard user={user} />;
};

export default App;
