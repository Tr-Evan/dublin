import { lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { AdminAuthProvider, useAdminAuth } from "./auth/AdminAuth";
import { LocationSharingProvider } from "./auth/LocationSharing";
import Header from "./components/layout/Header";
import BottomNavigation from "./components/layout/BottomNavigation";

const Admin = lazy(() => import("./pages/Admin"));
const Checklist = lazy(() => import("./pages/Checklist"));
const Family = lazy(() => import("./pages/Family"));
const Home = lazy(() => import("./pages/Home"));
const Explore = lazy(() => import("./pages/Explore"));
const Visites = lazy(() => import("./pages/Visites"));
const Food = lazy(() => import("./pages/Food"));
const Pubs = lazy(() => import("./pages/Pubs"));
const DocumentVault = lazy(() => import("./components/documents/DocumentVault"));

function RouteLoader() {
  return <div className="flex min-h-[50vh] items-center justify-center gap-3 text-sm text-slate-300" role="status"><LoaderCircle size={20} className="animate-spin text-mint" />Chargement du carnet…</div>;
}

function AdminProtectedRoute({ children }) {
  const auth = useAdminAuth();
  if (auth.loading) return <div className="flex items-center justify-center gap-3 py-24 text-sm text-slate-300"><LoaderCircle size={19} className="animate-spin text-mint" />Vérification de la session…</div>;
  if (!auth.isAdmin) return <Navigate to="/admin" replace />;
  return children;
}

function AppContent() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-ink text-white">
      <Header />
      <BottomNavigation />
      <main className="mx-auto max-w-7xl px-5 pb-28 pt-8 sm:px-8 sm:pt-10 md:ml-64 md:px-10 md:pb-12 md:pt-12">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
            <Suspense fallback={<RouteLoader />}>
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/explorer" element={<Explore />} />
                <Route path="/visites" element={<Visites />} />
                <Route path="/food" element={<Food />} />
                <Route path="/pubs" element={<Pubs />} />
                <Route path="/family" element={<Family />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/documents" element={<AdminProtectedRoute><DocumentVault /></AdminProtectedRoute>} />
                <Route path="/checklist" element={<AdminProtectedRoute><Checklist /></AdminProtectedRoute>} />
                <Route path="*" element={<Home />} />
              </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="pb-24 text-center text-xs text-muted md:ml-64 md:pb-8">Enola & Evan à Dublin · octobre 2026</footer>
    </div>
  );
}

export default function App() {
  return <BrowserRouter><AdminAuthProvider><LocationSharingProvider><AppContent /></LocationSharingProvider></AdminAuthProvider></BrowserRouter>;
}
