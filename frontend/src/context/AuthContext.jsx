import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { getSupabaseRedirectUrl, isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

const API_URL = 'http://localhost:5000/api';
const LOCAL_ACCOUNTS_KEY = 'localAuthAccounts';
const LOCAL_PROFILE_PATCHES_KEY = 'localProfilePatches';

const normalizeExternalUrl = (value) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  if (/^data:/i.test(trimmed)) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  return `https://${trimmed}`;
};

const readProfilePatches = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_PROFILE_PATCHES_KEY) || '{}');
  } catch {
    return {};
  }
};

const writeProfilePatches = (patches) => {
  localStorage.setItem(LOCAL_PROFILE_PATCHES_KEY, JSON.stringify(patches));
};

const applyProfilePatch = (userData) => {
  const email = userData?.email?.toLowerCase();
  if (!email) return userData;
  const patch = readProfilePatches()[email];
  return patch ? { ...userData, ...patch } : userData;
};

const normalizeUser = (userData, extras = {}) => {
  const patchedUser = applyProfilePatch({
    ...userData,
    authProvider: extras.authProvider || userData.authProvider || 'email',
    avatar: extras.avatar || userData.avatar || userData.name?.charAt(0)?.toUpperCase() || 'U',
    avatarUrl: normalizeExternalUrl(extras.avatarUrl || userData.avatarUrl || ''),
  });

  return {
    ...patchedUser,
    avatarUrl: normalizeExternalUrl(patchedUser.avatarUrl || ''),
  };
};

const readLocalAccounts = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || '[]');
  } catch {
    return [];
  }
};

const writeLocalAccounts = (accounts) => {
  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
};

const createLocalEmailUser = ({ name, email, password, adminSecret }) => ({
  _id: `local-${email}`,
  name,
  email,
  password,
  role: adminSecret === 'admin777' ? 'admin' : 'user',
  isPremium: adminSecret === 'admin777',
  token: `local-email-token-${Date.now()}`,
  authProvider: 'email',
  avatarUrl: '',
});

const createLocalGoogleUser = (googleAccount) => ({
  _id: `google-${googleAccount.email || 'local-user'}`,
  name: googleAccount.name || 'Google User',
  email: googleAccount.email || 'google.user@example.com',
  role: googleAccount.adminSecret === 'admin777' ? 'admin' : 'user',
  isPremium: googleAccount.adminSecret === 'admin777',
  token: `local-google-token-${Date.now()}`,
  authProvider: 'google',
  avatarUrl: googleAccount.avatarUrl || '',
});

const mapSupabaseUser = (authUser, profile) => ({
  _id: authUser.id,
  name: profile?.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
  email: authUser.email || '',
  role: profile?.role || authUser.user_metadata?.role || 'user',
  isPremium: Boolean(profile?.is_premium),
  token: authUser.id,
  authProvider: profile?.auth_provider || authUser.app_metadata?.provider || 'email',
  avatarUrl: normalizeExternalUrl(
    profile?.avatar_url ||
      authUser.user_metadata?.avatar_url ||
      authUser.user_metadata?.picture ||
      ''
  ),
});

const ensureSupabaseProfile = async (authUser, extras = {}) => {
  if (!supabase) return null;

  const defaultProfile = {
    id: authUser.id,
    email: authUser.email,
    full_name:
      extras.name ||
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      authUser.email?.split('@')[0] ||
      'User',
    role: extras.role || authUser.user_metadata?.role || 'user',
    is_premium: Boolean(extras.isPremium),
    avatar_url: normalizeExternalUrl(
      extras.avatarUrl ||
        authUser.user_metadata?.avatar_url ||
        authUser.user_metadata?.picture ||
        ''
    ),
    auth_provider: extras.authProvider || authUser.app_metadata?.provider || 'email',
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(defaultProfile, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const saveUser = (userData, extras = {}) => {
    const normalizedUser = normalizeUser(userData, extras);
    setUser(normalizedUser);
    localStorage.setItem('userInfo', JSON.stringify(normalizedUser));
    return normalizedUser;
  };

  const persistLocalAccountPatch = (currentUser, updates) => {
    const accounts = readLocalAccounts();
    const updatedAccounts = accounts.map((account) =>
      account.email?.toLowerCase() === currentUser.email?.toLowerCase() ? { ...account, ...updates } : account
    );
    writeLocalAccounts(updatedAccounts);
  };

  const persistProfilePatch = (email, updates) => {
    if (!email) return;
    const patches = readProfilePatches();
    patches[email.toLowerCase()] = {
      ...(patches[email.toLowerCase()] || {}),
      ...updates,
    };
    writeProfilePatches(patches);
  };

  useEffect(() => {
    let mounted = true;

    const bootstrapAuth = async () => {
      if (isSupabaseConfigured && supabase) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (mounted && session?.user) {
          try {
            const profile = await ensureSupabaseProfile(session.user);
            saveUser(mapSupabaseUser(session.user, profile));
          } catch {
            saveUser(mapSupabaseUser(session.user));
          }
        }

        if (mounted) setLoading(false);
        return;
      }

      const userInfo = localStorage.getItem('userInfo');
      if (userInfo && mounted) {
        setUser(JSON.parse(userInfo));
      }
      if (mounted) setLoading(false);
    };

    bootstrapAuth();

    if (isSupabaseConfigured && supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return;

        if (session?.user) {
          try {
            const profile = await ensureSupabaseProfile(session.user);
            saveUser(mapSupabaseUser(session.user, profile));
          } catch {
            saveUser(mapSupabaseUser(session.user));
          }
        } else {
          setUser(null);
          localStorage.removeItem('userInfo');
        }
        setLoading(false);
      });

      return () => {
        mounted = false;
        data.subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email, password) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const profile = await ensureSupabaseProfile(data.user);
        saveUser(mapSupabaseUser(data.user, profile));
        return { success: true };
      } catch (error) {
        return { success: false, message: error.message || 'Ошибка входа через Supabase' };
      }
    }

    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      saveUser(response.data, { authProvider: 'email' });
      return { success: true };
    } catch (error) {
      if (!error.response) {
        const localAccount = readLocalAccounts().find(
          (account) => account.email.toLowerCase() === email.toLowerCase() && account.password === password
        );

        if (localAccount) {
          saveUser(localAccount, {
            authProvider: localAccount.authProvider || 'email',
            avatar: localAccount.name?.charAt(0)?.toUpperCase() || 'U',
            avatarUrl: localAccount.avatarUrl || '',
          });
          return { success: true, fallback: true };
        }
      }

      return { success: false, message: error.response?.data?.message || 'Server error during login' };
    }
  };

  const register = async (name, email, password, adminSecret) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const role = adminSecret === 'admin777' ? 'admin' : 'user';
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getSupabaseRedirectUrl('/profile'),
            data: {
              full_name: name,
              role,
            },
          },
        });

        if (error) throw error;
        if (data.user) {
          const profile = await ensureSupabaseProfile(data.user, {
            name,
            role,
            authProvider: 'email',
          });
          saveUser(mapSupabaseUser(data.user, profile));
        }
        return { success: true };
      } catch (error) {
        return { success: false, message: error.message || 'Ошибка регистрации через Supabase' };
      }
    }

    try {
      const response = await axios.post(`${API_URL}/auth/register`, { name, email, password, adminSecret });
      saveUser(response.data, { authProvider: 'email' });
      return { success: true };
    } catch (error) {
      if (!error.response) {
        const existingLocalAccount = readLocalAccounts().find(
          (account) => account.email.toLowerCase() === email.toLowerCase()
        );

        if (existingLocalAccount) {
          return { success: false, message: 'This email is already registered locally.' };
        }

        const localUser = createLocalEmailUser({ name, email, password, adminSecret });
        writeLocalAccounts([...readLocalAccounts(), localUser]);
        saveUser(localUser, {
          authProvider: 'email',
          avatar: localUser.name?.charAt(0)?.toUpperCase() || 'U',
          avatarUrl: localUser.avatarUrl || '',
        });
        return { success: true, fallback: true };
      }

      return { success: false, message: error.response?.data?.message || 'Server error during registration' };
    }
  };

  const googleLogin = async (googleAccount = {}) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: getSupabaseRedirectUrl('/profile'),
          },
        });

        if (error) throw error;
        return { success: true };
      } catch (error) {
        return { success: false, message: error.message || 'Google Auth Failed' };
      }
    }

    try {
      const mockGoogleData = {
        name: googleAccount.name || 'Google User',
        email: googleAccount.email || 'google.user@cineluxe.app',
        adminSecret: googleAccount.adminSecret || '',
      };

      const response = await axios.post(`${API_URL}/auth/google`, mockGoogleData);
      saveUser(response.data, {
        authProvider: 'google',
        avatar: googleAccount.avatar || response.data.name?.charAt(0)?.toUpperCase() || 'G',
        avatarUrl: googleAccount.avatarUrl || '',
      });
      return { success: true };
    } catch (error) {
      if (!error.response) {
        const localGoogleUser = createLocalGoogleUser(googleAccount);
        saveUser(localGoogleUser, {
          authProvider: 'google',
          avatar: googleAccount.avatar || localGoogleUser.name?.charAt(0)?.toUpperCase() || 'G',
          avatarUrl: googleAccount.avatarUrl || '',
        });
        return { success: true, fallback: true };
      }

      return { success: false, message: error.response?.data?.message || 'Google Auth Failed' };
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return { success: false };

    const normalizedUpdates = {
      ...updates,
      avatarUrl: updates.avatarUrl !== undefined ? normalizeExternalUrl(updates.avatarUrl) : user.avatarUrl || '',
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          id: user._id,
          email: user.email,
          full_name: normalizedUpdates.name || user.name,
          avatar_url: normalizedUpdates.avatarUrl,
          role: normalizedUpdates.role || user.role,
          is_premium: normalizedUpdates.isPremium ?? user.isPremium,
          auth_provider: user.authProvider,
        };

        const { data, error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' }).select().single();
        if (error) throw error;

        const updatedUser = saveUser(
          {
            ...user,
            name: data.full_name,
            role: data.role,
            isPremium: data.is_premium,
            avatarUrl: data.avatar_url,
          },
          {
            authProvider: user.authProvider,
            avatar: user.avatar,
            avatarUrl: data.avatar_url,
          }
        );

        return { success: true, user: updatedUser };
      } catch {
        return { success: false };
      }
    }

    persistProfilePatch(user.email, normalizedUpdates);

    const updatedUser = saveUser(
      { ...user, ...normalizedUpdates },
      {
        authProvider: user.authProvider,
        avatar: user.avatar,
        avatarUrl: normalizedUpdates.avatarUrl,
      }
    );

    persistLocalAccountPatch(user, normalizedUpdates);
    return { success: true, user: updatedUser };
  };

  const upgradeToPremium = async () => {
    if (!user) return;

    if (isSupabaseConfigured && supabase) {
      await updateProfile({ isPremium: true });
      return;
    }

    if (user.token) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.post(`${API_URL}/subscriptions/checkout`, {}, config);
        const updatedUser = saveUser({ ...user, isPremium: true });
        persistLocalAccountPatch(user, { isPremium: true, avatarUrl: updatedUser.avatarUrl || '' });
        persistProfilePatch(user.email, { isPremium: true, avatarUrl: updatedUser.avatarUrl || '' });
      } catch {
        const updatedUser = saveUser({ ...user, isPremium: true });
        persistLocalAccountPatch(user, { isPremium: true, avatarUrl: updatedUser.avatarUrl || '' });
        persistProfilePatch(user.email, { isPremium: true, avatarUrl: updatedUser.avatarUrl || '' });
      }
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('userInfo');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, googleLogin, updateProfile, logout, upgradeToPremium, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
