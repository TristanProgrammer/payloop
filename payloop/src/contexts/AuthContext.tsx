import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type LandlordRow = Database['public']['Tables']['landlords']['Row'];
type LandlordInsert = Database['public']['Tables']['landlords']['Insert'];
type LandlordUpdate = Database['public']['Tables']['landlords']['Update'];

interface User {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  subscriptionPlan: 'trial' | 'starter' | 'growth' | 'enterprise';
  subscriptionStatus: 'active' | 'suspended' | 'cancelled';
  trialEndsAt: Date | null;
  subscriptionEndsAt: Date | null;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isLoading: boolean;
}

interface RegisterData {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        await loadUserData(session.user.id);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      const { data: landlord, error } = await supabase
        .from('landlords')
        .select('*')
        .eq('uid', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading user data:', error);
        return;
      }

      if (landlord) {
        const userData: User = {
          id: landlord.id,
          businessName: landlord.business_name,
          ownerName: landlord.owner_name,
          phone: landlord.phone,
          email: landlord.email,
          subscriptionPlan: landlord.subscription_plan,
          subscriptionStatus: landlord.subscription_status,
          trialEndsAt: landlord.trial_ends_at ? new Date(landlord.trial_ends_at) : null,
          subscriptionEndsAt: landlord.subscription_ends_at ? new Date(landlord.subscription_ends_at) : null,
          createdAt: new Date(landlord.created_at),
        };
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const login = async (phone: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // For demo purposes, we'll use email/password auth with Supabase
      // In production, you might want to implement phone-based auth
      const email = phone.includes('@') ? phone : `${phone}@propman.co.ke`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        await loadUserData(data.user.id);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    setIsLoading(true);
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (authData.user) {
        // Create landlord record
        const landlordData: LandlordInsert = {
          id: authData.user.id,
          business_name: userData.businessName,
          owner_name: userData.ownerName,
          phone: userData.phone,
          email: userData.email,
          subscription_plan: 'trial',
          subscription_status: 'active',
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };

        const { error: insertError } = await supabase
          .from('landlords')
          .insert(landlordData);

        if (insertError) {
          throw new Error(insertError.message);
        }

        await loadUserData(authData.user.id);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user || !session) return;

    setIsLoading(true);
    try {
      const updateData: LandlordUpdate = {};
      
      if (updates.businessName) updateData.business_name = updates.businessName;
      if (updates.ownerName) updateData.owner_name = updates.ownerName;
      if (updates.phone) updateData.phone = updates.phone;
      if (updates.email) updateData.email = updates.email;
      if (updates.subscriptionPlan) updateData.subscription_plan = updates.subscriptionPlan;
      if (updates.subscriptionStatus) updateData.subscription_status = updates.subscriptionStatus;
      if (updates.trialEndsAt) updateData.trial_ends_at = updates.trialEndsAt.toISOString();
      if (updates.subscriptionEndsAt) updateData.subscription_ends_at = updates.subscriptionEndsAt.toISOString();

      const { error } = await supabase
        .from('landlords')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        throw new Error(error.message);
      }

      // Update local user state
      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      updateUser,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};