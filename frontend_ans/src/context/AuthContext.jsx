import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('kyc_current_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const signup = (username, password) => {
    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      return { success: false, message: 'Username and password are required.' };
    }

    try {
      const existingUsersStr = localStorage.getItem('kyc_users');
      const users = existingUsersStr ? JSON.parse(existingUsersStr) : [];

      const userExists = users.some(u => u.username.toLowerCase() === trimmedUser.toLowerCase());
      if (userExists) {
        return { success: false, message: 'Username is already registered. Please sign in instead.' };
      }

      const newUser = { username: trimmedUser, password };
      users.push(newUser);
      localStorage.setItem('kyc_users', JSON.stringify(users));

      // Auto sign-in
      const sessionUser = { username: trimmedUser };
      localStorage.setItem('kyc_current_user', JSON.stringify(sessionUser));
      setUser(sessionUser);

      return { success: true };
    } catch {
      return { success: false, message: 'An error occurred during account creation.' };
    }
  };

  const signin = (username, password) => {
    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      return { success: false, message: 'Please enter both username and password.' };
    }

    try {
      const existingUsersStr = localStorage.getItem('kyc_users');
      const users = existingUsersStr ? JSON.parse(existingUsersStr) : [];

      const matchedUser = users.find(
        u => u.username.toLowerCase() === trimmedUser.toLowerCase() && u.password === password
      );

      if (!matchedUser) {
        return { success: false, message: 'Invalid username or password.' };
      }

      const sessionUser = { username: matchedUser.username };
      localStorage.setItem('kyc_current_user', JSON.stringify(sessionUser));
      setUser(sessionUser);

      return { success: true };
    } catch {
      return { success: false, message: 'An error occurred during sign in.' };
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('kyc_current_user');
      localStorage.removeItem('kyc_verification_store_v2');
      sessionStorage.removeItem('kyc_verification_store_v2');
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('kyc_workflow_step_') || key.startsWith('kyc_steps_')) {
          localStorage.removeItem(key);
        }
      });
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('kyc_workflow_step_') || key.startsWith('kyc_steps_') || key.startsWith('kyc_')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (err) {
      console.error('Error clearing storage on logout:', err);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signup, signin, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
