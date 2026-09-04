import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Outlet,
} from "react-router-dom";
import { AppShell } from "@astryxdesign/core/AppShell";
import { TopNav, TopNavHeading, TopNavItem } from "@astryxdesign/core/TopNav";
import { LinkProvider } from "@astryxdesign/core/Link";
import { VStack } from "@astryxdesign/core/Stack";
import { Spinner } from "@astryxdesign/core/Spinner";
import { RoutedLink } from "./router-link";
import { currentUser, signIn } from "./auth";
import AddExpensePage from "./pages/AddExpensePage";
import ExpenseListPage from "./pages/ExpenseListPage";
import EditExpensePage from "./pages/EditExpensePage";
import TotalsPage from "./pages/TotalsPage";
import CategoriesPage from "./pages/CategoriesPage";
import EditCategoryPage from "./pages/EditCategoryPage";
import CallbackPage from "./pages/CallbackPage";

const NAV_ITEMS = [
  { label: "Add Expense", href: "/" },
  { label: "Expenses", href: "/expenses" },
  { label: "Totals", href: "/totals" },
  { label: "Categories", href: "/categories" },
];

function AppChrome() {
  const location = useLocation();
  return (
    <AppShell
      topNav={
        <TopNav
          label="Primary"
          heading={<TopNavHeading heading="SMJ Expenses" />}
        >
          {NAV_ITEMS.map((item) => (
            <TopNavItem
              key={item.href}
              label={item.label}
              href={item.href}
              isSelected={location.pathname === item.href}
            />
          ))}
        </TopNav>
      }
      contentPadding={4}
    >
      <Outlet />
    </AppShell>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    currentUser().then((user) => {
      if (cancelled) return;
      if (user) {
        setIsReady(true);
      } else {
        // Leaves the app via a full redirect; nothing else to do here.
        void signIn();
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isReady) {
    return (
      <VStack height="100dvh" hAlign="center" vAlign="center">
        <Spinner size="lg" label="Signing in…" />
      </VStack>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <LinkProvider component={RoutedLink}>
        <Routes>
          <Route path="/callback" element={<CallbackPage />} />
          {/* AppChrome renders <Outlet/>, so every nested route below shares
              the same navbar and sits behind the sign-in gate. */}
          <Route
            element={
              <AuthGate>
                <AppChrome />
              </AuthGate>
            }
          >
            <Route index element={<AddExpensePage />} />
            <Route path="expenses" element={<ExpenseListPage />} />
            <Route path="expenses/:expenseId" element={<EditExpensePage />} />
            <Route path="totals" element={<TotalsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="categories/new" element={<EditCategoryPage />} />
            <Route
              path="categories/:categoryId"
              element={<EditCategoryPage />}
            />
          </Route>
        </Routes>
      </LinkProvider>
    </BrowserRouter>
  );
}
