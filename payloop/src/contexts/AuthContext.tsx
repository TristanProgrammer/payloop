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
  email?: string; // optional, fallback is phone + @propman
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user?.id) {
        await loadUserData(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.id) {
        await loadUserData(session.user.id);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (uid: string) => {
    const { data, error } = await supabase
      .from('landlords')
      .select('*')
      .eq('id', uid)
      .single();

    if (error || !data) {
      console.error('Failed to load user data', error);
      return;
    }

    const u: User = {
      id: data.id,
      businessName: data.business_name,
      ownerName: data.owner_name,
      phone: data.phone,
      email: data.email,
      subscriptionPlan: data.subscription_plan,
      subscriptionStatus: data.subscription_status,
      trialEndsAt: data.trial_ends_at ? new Date(data.trial_ends_at) : null,
      subscriptionEndsAt: data.subscription_ends_at ? new Date(data.subscription_ends_at) : null,
      createdAt: new Date(data.created_at),
    };

    setUser(u);
  };

  const login = async (phone: string, password: string) => {
    setIsLoading(true);
    try {
      const email = phone.includes('@') ? phone : `${phone}@propman.co.ke`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) throw new Error(error?.message || 'Invalid credentials');

      await loadUserData(data.user.id);
    } catch (err: any) {
      throw new Error(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    try {
      const email = userData.email || `${userData.phone}@propman.co.ke`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: userData.password,
      });

      if (authError) throw new Error(authError.message);

      const uid = authData.user?.id;
      if (!uid) throw new Error('User creation failed');

      const landlordData: LandlordInsert = {
        id: uid,
        business_name: userData.businessName,
        owner_name: userData.ownerName,
        phone: userData.phone,
        email,
        subscription_plan: 'trial',
        subscription_status: 'active',
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const { error: insertError } = await supabase
        .from('landlords')
        .insert(landlordData);

      if (insertError) throw new Error(insertError.message);

      await loadUserData(uid);
    } catch (err: any) {
      throw new Error(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const updateData: LandlordUpdate = {
        ...(updates.businessName && { business_name: updates.businessName }),
        ...(updates.ownerName && { owner_name: updates.ownerName }),
        ...(updates.phone && { phone: updates.phone }),
        ...(updates.email && { email: updates.email }),
        ...(updates.subscriptionPlan && { subscription_plan: updates.subscriptionPlan }),
        ...(updates.subscriptionStatus && { subscription_status: updates.subscriptionStatus }),
        ...(updates.trialEndsAt && { trial_ends_at: updates.trialEndsAt.toISOString() }),
        ...(updates.subscriptionEndsAt && { subscription_ends_at: updates.subscriptionEndsAt.toISOString() }),
      };

      const { error } = await supabase
        .from('landlords')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw new Error(error.message);

      setUser({ ...user, ...updates });
    } catch (err: any) {
      console.error('Update error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
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
