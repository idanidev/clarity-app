import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { Route, Switch, useLocation } from 'wouter';
import { Layout } from './components/layout/Layout';
import { auth } from './firebase';
import './i18n/config';
import { AuthPage } from './pages/AuthPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { HomePage } from './pages/HomePage';
import { RecurringExpensesPage } from './pages/RecurringExpensesPage';
import { SettingsPage } from './pages/SettingsPage';
import { useExpenseStore } from './store/expenseStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function App() {
  const darkMode = useExpenseStore((state) => state.darkMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
        <AuthProvider>
          <Switch>
            <Route path="/auth" component={AuthPage} />
            <Route path="/">
              <Layout>
                <HomePage />
              </Layout>
            </Route>
            <Route path="/expenses">
              <Layout>
                <ExpensesPage />
              </Layout>
            </Route>
            <Route path="/categories">
              <Layout>
                <CategoriesPage />
              </Layout>
            </Route>
            <Route path="/budgets">
              <Layout>
                <BudgetsPage />
              </Layout>
            </Route>
            <Route path="/recurring">
              <Layout>
                <RecurringExpensesPage />
              </Layout>
            </Route>
            <Route path="/settings">
              <Layout>
                <SettingsPage />
              </Layout>
            </Route>
            <Route>404 - Not Found</Route>
          </Switch>
        </AuthProvider>
        <Toaster 
          position="top-center"
          theme={darkMode ? 'dark' : 'light'}
          richColors
        />
      </div>
    </QueryClientProvider>
  );
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (!currentUser && location.pathname !== '/auth') {
        setLocation('/auth');
      } else if (currentUser && location.pathname === '/auth') {
        setLocation('/');
      }
    });

    return () => unsubscribe();
  }, [setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-purple-600 font-medium">Cargando Clarity...</p>
        </div>
      </div>
    );
  }

  return children;
}

export default App;
