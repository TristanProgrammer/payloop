import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type PaymentConfirmationRow = Database['public']['Tables']['payment_confirmations']['Row'];
type PaymentConfirmationInsert = Database['public']['Tables']['payment_confirmations']['Insert'];
type PaymentConfirmationUpdate = Database['public']['Tables']['payment_confirmations']['Update'];

interface PaymentConfirmation {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  planSelected: 'starter' | 'growth' | 'enterprise';
  transactionCode: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: Date;
  rejectedAt?: Date;
  adminNotes?: string;
}

interface PaymentContextType {
  paymentConfirmations: PaymentConfirmation[];
  submitPaymentConfirmation: (confirmation: Omit<PaymentConfirmation, 'id' | 'userId' | 'timestamp' | 'status'>) => void;
  approvePayment: (confirmationId: string, adminNotes?: string) => void;
  rejectPayment: (confirmationId: string, adminNotes?: string) => void;
  getUserPaymentStatus: (userId: string) => PaymentConfirmation | null;
  getPendingConfirmations: () => PaymentConfirmation[];
  hasActiveSubscription: (userId: string) => boolean;
  canSubmitNewPayment: (userId: string) => boolean;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUser } = useAuth();
  const [paymentConfirmations, setPaymentConfirmations] = useState<PaymentConfirmation[]>([]);

  useEffect(() => {
    if (user) {
      loadPaymentConfirmations();
    }
  }, [user]);

  const loadPaymentConfirmations = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_confirmations')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const mappedConfirmations: PaymentConfirmation[] = data?.map((p: PaymentConfirmationRow) => ({
        id: p.id,
        userId: p.user_id,
        fullName: p.full_name,
        phone: p.phone,
        planSelected: p.plan_selected,
        transactionCode: p.transaction_code,
        timestamp: new Date(p.timestamp),
        status: p.status,
        approvedAt: p.approved_at ? new Date(p.approved_at) : undefined,
        rejectedAt: p.rejected_at ? new Date(p.rejected_at) : undefined,
        adminNotes: p.admin_notes || undefined,
      })) || [];

      setPaymentConfirmations(mappedConfirmations);
    } catch (error) {
      console.error('Error loading payment confirmations:', error);
    }
  };

  const hasActiveSubscription = (userId: string): boolean => {
    const latestPayment = paymentConfirmations
      .filter(p => p.userId === userId && p.status === 'approved')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
    
    if (!latestPayment) return false;
    
    // Check if subscription is still valid (within 30 days of approval)
    const expiryDate = new Date(latestPayment.approvedAt!);
    expiryDate.setDate(expiryDate.getDate() + 30);
    
    return expiryDate > new Date();
  };

  const canSubmitNewPayment = (userId: string): boolean => {
    // Check if user has an active subscription
    if (hasActiveSubscription(userId)) {
      return false; // Cannot submit new payment if already has active subscription
    }
    
    // Check if user has a pending payment
    const pendingPayment = paymentConfirmations.find(
      p => p.userId === userId && p.status === 'pending'
    );
    
    return !pendingPayment; // Can submit if no pending payment
  };

  const submitPaymentConfirmation = async (confirmation: Omit<PaymentConfirmation, 'id' | 'userId' | 'timestamp' | 'status'>) => {
    if (!user) return;

    // Check if user can submit new payment
    if (!canSubmitNewPayment(user.id)) {
      throw new Error('You already have an active subscription or pending payment confirmation.');
    }

    try {
      const confirmationData: PaymentConfirmationInsert = {
        user_id: user.id,
        full_name: confirmation.fullName,
        phone: confirmation.phone,
        plan_selected: confirmation.planSelected,
        transaction_code: confirmation.transactionCode,
        status: 'pending',
      };

      const { data, error } = await supabase
        .from('payment_confirmations')
        .insert(confirmationData)
        .select()
        .single();

      if (error) throw error;

      const newConfirmation: PaymentConfirmation = {
        id: data.id,
        userId: data.user_id,
        fullName: data.full_name,
        phone: data.phone,
        planSelected: data.plan_selected,
        transactionCode: data.transaction_code,
        timestamp: new Date(data.timestamp),
        status: data.status,
        approvedAt: data.approved_at ? new Date(data.approved_at) : undefined,
        rejectedAt: data.rejected_at ? new Date(data.rejected_at) : undefined,
        adminNotes: data.admin_notes || undefined,
      };

      setPaymentConfirmations(prev => [...prev, newConfirmation]);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to submit payment confirmation');
    }
  };

  const approvePayment = async (confirmationId: string, adminNotes?: string) => {
    const confirmation = paymentConfirmations.find(p => p.id === confirmationId);
    if (!confirmation) return;

    try {
      const approvalDate = new Date();
      const expiryDate = new Date(approvalDate);
      expiryDate.setDate(expiryDate.getDate() + 30); // 30 days from approval

      // Update confirmation status in database
      const { error: confirmationError } = await supabase
        .from('payment_confirmations')
        .update({
          status: 'approved',
          approved_at: approvalDate.toISOString(),
          admin_notes: adminNotes || null,
        })
        .eq('id', confirmationId);

      if (confirmationError) throw confirmationError;

      // Update user subscription in database
      const { error: userError } = await supabase
        .from('landlords')
        .update({
          subscription_plan: confirmation.planSelected,
          subscription_status: 'active',
          subscription_ends_at: expiryDate.toISOString(),
        })
        .eq('id', confirmation.userId);

      if (userError) throw userError;

      // Update local state
      setPaymentConfirmations(prev =>
        prev.map(p =>
          p.id === confirmationId
            ? {
                ...p,
                status: 'approved' as const,
                approvedAt: approvalDate,
                adminNotes,
              }
            : p
        )
      );

      // Update user subscription if this is the current user
      if (user && confirmation.userId === user.id) {
        updateUser({
          subscriptionPlan: confirmation.planSelected,
          subscriptionStatus: 'active',
          subscriptionEndsAt: expiryDate,
        });
      }
    } catch (error: any) {
      console.error('Error approving payment:', error);
      throw new Error(error.message || 'Failed to approve payment');
    }
  };

  const rejectPayment = async (confirmationId: string, adminNotes?: string) => {
    try {
      const rejectionDate = new Date();

      // Update confirmation status in database
      const { error } = await supabase
        .from('payment_confirmations')
        .update({
          status: 'rejected',
          rejected_at: rejectionDate.toISOString(),
          admin_notes: adminNotes || null,
        })
        .eq('id', confirmationId);

      if (error) throw error;

      // Update local state
      setPaymentConfirmations(prev =>
        prev.map(p =>
          p.id === confirmationId
            ? {
                ...p,
                status: 'rejected' as const,
                rejectedAt: rejectionDate,
                adminNotes,
              }
            : p
        )
      );
    } catch (error: any) {
      console.error('Error rejecting payment:', error);
      throw new Error(error.message || 'Failed to reject payment');
    }
  };

  const getUserPaymentStatus = (userId: string): PaymentConfirmation | null => {
    return paymentConfirmations
      .filter(p => p.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0] || null;
  };

  const getPendingConfirmations = (): PaymentConfirmation[] => {
    return paymentConfirmations
      .filter(p => p.status === 'pending')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  return (
    <PaymentContext.Provider value={{
      paymentConfirmations,
      submitPaymentConfirmation,
      approvePayment,
      rejectPayment,
      getUserPaymentStatus,
      getPendingConfirmations,
      hasActiveSubscription,
      canSubmitNewPayment,
    }}>
      {children}
    </PaymentContext.Provider>
  );
};