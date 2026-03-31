import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

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
  avatarUrl: googleAccount.avatarUrl || '',
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
    setLoading(false);
  }, []);

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

  const login = async (email, password) => {
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

  const updateProfile = (updates) => {
    if (!user) return { success: false };

    const normalizedUpdates = {
      ...updates,
      avatarUrl: updates.avatarUrl !== undefined ? normalizeExternalUrl(updates.avatarUrl) : user.avatarUrl || '',
    };

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
    if (user && user.token) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.post(`${API_URL}/subscriptions/checkout`, {}, config);
        const updatedUser = saveUser({ ...user, isPremium: true });
        persistLocalAccountPatch(user, { isPremium: true, avatarUrl: updatedUser.avatarUrl || '' });
        persistProfilePatch(user.email, { isPremium: true, avatarUrl: updatedUser.avatarUrl || '' });
      } catch (error) {
        console.error('Subscription failed', error);
        const updatedUser = saveUser({ ...user, isPremium: true });
        persistLocalAccountPatch(user, { isPremium: true, avatarUrl: updatedUser.avatarUrl || '' });
        persistProfilePatch(user.email, { isPremium: true, avatarUrl: updatedUser.avatarUrl || '' });
      }
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userInfo');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, googleLogin, updateProfile, logout, upgradeToPremium, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
