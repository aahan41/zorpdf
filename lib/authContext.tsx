'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  full_name: string | null;
  mobile: string | null;
  phone: string | null;
  email: string | null;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string | null;
}

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] =
    useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  /*
   * ========================================================
   * LOAD PROFILE
   * ========================================================
   */

  const loadProfile = async (
    userId: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          `
          id,
          full_name,
          mobile,
          phone,
          email,
          is_admin,
          is_banned,
          created_at
          `
        )
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error(
          'Profile loading error:',
          error
        );

        setProfile(null);
        return;
      }

      if (!data) {
        setProfile(null);
        return;
      }

      setProfile({
        id: data.id,
        full_name: data.full_name ?? null,
        mobile: data.mobile ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        is_admin: data.is_admin === true,
        is_banned: data.is_banned === true,
        created_at: data.created_at ?? null,
      });
    } catch (error) {
      console.error(
        'Profile loading exception:',
        error
      );

      setProfile(null);
    }
  };

  /*
   * ========================================================
   * REFRESH PROFILE
   * ========================================================
   */

  const refreshProfile = async () => {
    try {
      const {
        data: {
          user: currentUser,
        },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        setUser(null);
        setProfile(null);
        return;
      }

      setUser(currentUser);

      await loadProfile(currentUser.id);
    } catch (error) {
      console.error(
        'Refresh profile error:',
        error
      );
    }
  };

  /*
   * ========================================================
   * INITIAL AUTH CHECK
   * ========================================================
   */

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: {
            session,
          },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (!session?.user) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setUser(session.user);

        await loadProfile(session.user.id);

        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error(
          'Auth initialization error:',
          error
        );

        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    /*
     * ======================================================
     * AUTH STATE LISTENER
     * ======================================================
     */

    const {
      data: {
        subscription,
      },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        if (!session?.user) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setUser(session.user);

        /*
         * Delay profile query slightly so that
         * Supabase auth state has completely settled.
         */
        setTimeout(async () => {
          if (!mounted) return;

          await loadProfile(session.user.id);

          if (mounted) {
            setLoading(false);
          }
        }, 0);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /*
   * ========================================================
   * SIGN OUT
   * ========================================================
   */

  const signOut = async () => {
    try {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        console.error(
          'Sign out error:',
          error
        );
      }
    } finally {
      setUser(null);
      setProfile(null);
    }
  };

  /*
   * ========================================================
   * PROVIDER
   * ========================================================
   */

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/*
 * ==========================================================
 * USE AUTH HOOK
 * ==========================================================
 */

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside an AuthProvider'
    );
  }

  return context;
}
