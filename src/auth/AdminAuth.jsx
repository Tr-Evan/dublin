import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabaseClient";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) return undefined;
    let current = true;

    const checkAdmin = async (nextSession) => {
      if (!current) return;
      setSession(nextSession);
      setError("");
      if (!nextSession) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from("trip_admins")
        .select("user_id")
        .eq("user_id", nextSession.user.id)
        .maybeSingle();
      if (!current) return;
      if (queryError) {
        let previouslyVerified = false;
        if (navigator.onLine === false) {
          try {
            previouslyVerified = localStorage.getItem("dublin-v2:admin-user-id") === nextSession.user.id;
          } catch {
            previouslyVerified = false;
          }
        }
        setIsAdmin(previouslyVerified);
        setError(previouslyVerified ? "" : `Vérification des droits impossible : ${queryError.message}`);
      } else {
        setIsAdmin(Boolean(data));
        try {
          if (data) localStorage.setItem("dublin-v2:admin-user-id", nextSession.user.id);
          else localStorage.removeItem("dublin-v2:admin-user-id");
        } catch {
          if (!data) setError("Le navigateur ne permet pas de conserver l'état de connexion hors ligne.");
        }
      }
      setLoading(false);
    };

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError && current) {
        setError(`Impossible de restaurer la session : ${sessionError.message}`);
        setLoading(false);
        return;
      }
      void checkAdmin(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      queueMicrotask(() => void checkAdmin(nextSession));
    });
    return () => {
      current = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({
    session,
    isAdmin,
    loading,
    error,
    async signIn(email, password) {
      if (!supabase) throw new Error("Configurez Supabase avant la connexion.");
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw new Error(signInError.message);
    },
    async signOut() {
      if (!supabase) return;
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw new Error(signOutError.message);
    },
  }), [session, isAdmin, loading, error]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const auth = useContext(AdminAuthContext);
  if (!auth) throw new Error("useAdminAuth doit être utilisé dans AdminAuthProvider.");
  return auth;
}
