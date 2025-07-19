import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type PropertyRow = Database['public']['Tables']['properties']['Row'];
type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
type PropertyUpdate = Database['public']['Tables']['properties']['Update'];
type TenantRow = Database['public']['Tables']['tenants']['Row'];
type TenantInsert = Database['public']['Tables']['tenants']['Insert'];
type TenantUpdate = Database['public']['Tables']['tenants']['Update'];
type PaymentRow = Database['public']['Tables']['payments']['Row'];
type PaymentInsert = Database['public']['Tables']['payments']['Insert'];

interface Property {
  id: string;
  name: string;
  location: string;
  totalUnits: number;
  propertyType: 'apartment' | 'house' | 'commercial';
  occupiedUnits: number;
  monthlyRevenue: number;
  outstandingPayments: number;
  createdAt: Date;
}

interface Tenant {
  id: string;
  propertyId: string;
  unitNumber: string;
  name: string;
  phone: string;
  email: string;
  rentAmount: number;
  dueDate: number; // day of month
  moveInDate: Date;
  status: 'active' | 'inactive' | 'suspended' | 'defaulter';
  lastPaymentDate?: Date;
  outstandingAmount: number;
}

interface Payment {
  id: string;
  tenantId: string;
  amount: number;
  paymentDate: Date;
  method: 'mpesa' | 'bank' | 'cash';
  reference?: string;
  status: 'paid' | 'pending' | 'failed';
}

interface PropertyContextType {
  properties: Property[];
  tenants: Tenant[];
  payments: Payment[];
  selectedPropertyId: string | null;
  setSelectedPropertyId: (id: string | null) => void;
  addProperty: (property: Omit<Property, 'id' | 'createdAt'>) => void;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  addTenant: (tenant: Omit<Tenant, 'id'>) => void;
  updateTenant: (id: string, updates: Partial<Tenant>) => void;
  deleteTenant: (id: string) => void;
  addPayment: (payment: Omit<Payment, 'id'>) => void;
  getTenantsForProperty: (propertyId: string) => Tenant[];
  getTotalProperties: () => number;
  getTotalUnits: () => number;
  getTotalRevenue: () => number;
  getTotalOutstanding: () => number;
  getVacancyRate: () => number;
  getRecentTenants: (limit?: number) => Tenant[];
  getDefaulterTenants: () => Tenant[];
  getRecentPayments: (limit?: number) => Payment[];
  canAddProperty: () => boolean;
  getPropertyLimit: () => number;
  clearAllData: () => void;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
};

export const PropertyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false });

      if (propertiesError) throw propertiesError;

      const mappedProperties: Property[] = propertiesData?.map((p: PropertyRow) => ({
        id: p.id,
        name: p.name,
        location: p.location,
        totalUnits: p.total_units,
        propertyType: p.property_type,
        occupiedUnits: p.occupied_units,
        monthlyRevenue: p.monthly_revenue,
        outstandingPayments: p.outstanding_payments,
        createdAt: new Date(p.created_at),
      })) || [];

      setProperties(mappedProperties);

      // Load tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false });

      if (tenantsError) throw tenantsError;

      const mappedTenants: Tenant[] = tenantsData?.map((t: TenantRow) => ({
        id: t.id,
        propertyId: t.property_id,
        unitNumber: t.unit_number,
        name: t.name,
        phone: t.phone,
        email: t.email || '',
        rentAmount: t.rent_amount,
        dueDate: t.due_date,
        moveInDate: new Date(t.move_in_date),
        status: t.status,
        lastPaymentDate: t.last_payment_date ? new Date(t.last_payment_date) : undefined,
        outstandingAmount: t.outstanding_amount,
      })) || [];

      setTenants(mappedTenants);

      // Load payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      const mappedPayments: Payment[] = paymentsData?.map((p: PaymentRow) => ({
        id: p.id,
        tenantId: p.tenant_id,
        amount: p.amount,
        paymentDate: new Date(p.payment_date),
        method: p.method,
        reference: p.reference || '',
        status: p.status,
      })) || [];

      setPayments(mappedPayments);

      // Set selected property to first property if none selected
      if (mappedProperties.length > 0 && !selectedPropertyId) {
        setSelectedPropertyId(mappedProperties[0].id);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const getPropertyLimit = (): number => {
    if (!user) return 0;
    switch (user.subscriptionPlan) {
      case 'starter': return 1;
      case 'growth': return 5;
      case 'enterprise': return Infinity;
      case 'trial': return 2; // Allow 2 properties during trial
      default: return 0;
    }
  };

  const canAddProperty = (): boolean => {
    const limit = getPropertyLimit();
    return properties.length < limit;
  };

  const addProperty = async (property: Omit<Property, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');
    
    if (!canAddProperty()) {
      throw new Error(`You can only add ${getPropertyLimit()} properties with your current plan`);
    }

    try {
      const propertyData: PropertyInsert = {
        landlord_id: user.id,
        name: property.name,
        location: property.location,
        total_units: property.totalUnits,
        property_type: property.propertyType,
        occupied_units: property.occupiedUnits,
        monthly_revenue: property.monthlyRevenue,
        outstanding_payments: property.outstandingPayments,
      };

      const { data, error } = await supabase
        .from('properties')
        .insert(propertyData)
        .select()
        .single();

      if (error) throw error;

      const newProperty: Property = {
        id: data.id,
        name: data.name,
        location: data.location,
        totalUnits: data.total_units,
        propertyType: data.property_type,
        occupiedUnits: data.occupied_units,
        monthlyRevenue: data.monthly_revenue,
        outstandingPayments: data.outstanding_payments,
        createdAt: new Date(data.created_at),
      };

      setProperties(prev => [...prev, newProperty]);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to add property');
    }
  };

  const updateProperty = async (id: string, updates: Partial<Property>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const updateData: PropertyUpdate = {};
      
      if (updates.name) updateData.name = updates.name;
      if (updates.location) updateData.location = updates.location;
      if (updates.totalUnits) updateData.total_units = updates.totalUnits;
      if (updates.propertyType) updateData.property_type = updates.propertyType;
      if (updates.occupiedUnits !== undefined) updateData.occupied_units = updates.occupiedUnits;
      if (updates.monthlyRevenue !== undefined) updateData.monthly_revenue = updates.monthlyRevenue;
      if (updates.outstandingPayments !== undefined) updateData.outstanding_payments = updates.outstandingPayments;

      const { error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', id)
        .eq('landlord_id', user.id);

      if (error) throw error;

      setProperties(prev => 
        prev.map(property => 
          property.id === id ? { ...property, ...updates } : property
        )
      );
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update property');
    }
  };

  const deleteProperty = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id)
        .eq('landlord_id', user.id);

      if (error) throw error;

      setProperties(prev => prev.filter(property => property.id !== id));
      setTenants(prev => prev.filter(tenant => tenant.propertyId !== id));
      
      if (selectedPropertyId === id) {
        const remainingProperties = properties.filter(p => p.id !== id);
        setSelectedPropertyId(remainingProperties[0]?.id || null);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete property');
    }
  };

  const addTenant = async (tenant: Omit<Tenant, 'id'>) => {
    if (!user) throw new Error('User not authenticated');

    const property = properties.find(p => p.id === tenant.propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    const currentTenants = tenants.filter(t => t.propertyId === tenant.propertyId);
    if (currentTenants.length >= property.totalUnits) {
      throw new Error(`Cannot add more tenants. Property has ${property.totalUnits} units and ${currentTenants.length} tenants.`);
    }

    try {
      const tenantData: TenantInsert = {
        landlord_id: user.id,
        property_id: tenant.propertyId,
        unit_number: tenant.unitNumber,
        name: tenant.name,
        phone: tenant.phone,
        email: tenant.email || null,
        rent_amount: tenant.rentAmount,
        due_date: tenant.dueDate,
        move_in_date: tenant.moveInDate.toISOString().split('T')[0],
        status: tenant.status,
        last_payment_date: tenant.lastPaymentDate?.toISOString().split('T')[0] || null,
        outstanding_amount: tenant.outstandingAmount,
      };

      const { data, error } = await supabase
        .from('tenants')
        .insert(tenantData)
        .select()
        .single();

      if (error) throw error;

      const newTenant: Tenant = {
        id: data.id,
        propertyId: data.property_id,
        unitNumber: data.unit_number,
        name: data.name,
        phone: data.phone,
        email: data.email || '',
        rentAmount: data.rent_amount,
        dueDate: data.due_date,
        moveInDate: new Date(data.move_in_date),
        status: data.status,
        lastPaymentDate: data.last_payment_date ? new Date(data.last_payment_date) : undefined,
        outstandingAmount: data.outstanding_amount,
      };

      setTenants(prev => [...prev, newTenant]);
      
      // Update property occupancy and revenue
      await updateProperty(tenant.propertyId, {
        occupiedUnits: currentTenants.length + 1,
        monthlyRevenue: property.monthlyRevenue + tenant.rentAmount
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to add tenant');
    }
  };

  const updateTenant = async (id: string, updates: Partial<Tenant>) => {
    if (!user) throw new Error('User not authenticated');

    const tenant = tenants.find(t => t.id === id);
    if (!tenant) return;

    try {
      const updateData: TenantUpdate = {};
      
      if (updates.unitNumber) updateData.unit_number = updates.unitNumber;
      if (updates.name) updateData.name = updates.name;
      if (updates.phone) updateData.phone = updates.phone;
      if (updates.email !== undefined) updateData.email = updates.email || null;
      if (updates.rentAmount !== undefined) updateData.rent_amount = updates.rentAmount;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
      if (updates.moveInDate) updateData.move_in_date = updates.moveInDate.toISOString().split('T')[0];
      if (updates.status) updateData.status = updates.status;
      if (updates.lastPaymentDate) updateData.last_payment_date = updates.lastPaymentDate.toISOString().split('T')[0];
      if (updates.outstandingAmount !== undefined) updateData.outstanding_amount = updates.outstandingAmount;

      const { error } = await supabase
        .from('tenants')
        .update(updateData)
        .eq('id', id)
        .eq('landlord_id', user.id);

      if (error) throw error;

      const oldRentAmount = tenant.rentAmount;
      const newRentAmount = updates.rentAmount || oldRentAmount;
      const rentDifference = newRentAmount - oldRentAmount;

      setTenants(prev => 
        prev.map(t => 
          t.id === id ? { ...t, ...updates } : t
        )
      );

      // Update property revenue if rent amount changed
      if (rentDifference !== 0) {
        const property = properties.find(p => p.id === tenant.propertyId);
        if (property) {
          await updateProperty(property.id, {
            monthlyRevenue: property.monthlyRevenue + rentDifference
          });
        }
      }

      // Update property outstanding if outstanding amount changed
      if (updates.outstandingAmount !== undefined) {
        const property = properties.find(p => p.id === tenant.propertyId);
        if (property) {
          const propertyTenants = tenants.filter(t => t.propertyId === property.id);
          const totalOutstanding = propertyTenants.reduce((sum, t) => {
            if (t.id === id) {
              return sum + (updates.outstandingAmount || 0);
            }
            return sum + t.outstandingAmount;
          }, 0);
          
          await updateProperty(property.id, {
            outstandingPayments: totalOutstanding
          });
        }
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update tenant');
    }
  };

  const deleteTenant = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    const tenant = tenants.find(t => t.id === id);
    if (!tenant) return;

    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', id)
        .eq('landlord_id', user.id);

      if (error) throw error;

      setTenants(prev => prev.filter(t => t.id !== id));
      
      // Update property occupancy and revenue
      const property = properties.find(p => p.id === tenant.propertyId);
      if (property) {
        await updateProperty(property.id, {
          occupiedUnits: Math.max(0, property.occupiedUnits - 1),
          monthlyRevenue: Math.max(0, property.monthlyRevenue - tenant.rentAmount),
          outstandingPayments: Math.max(0, property.outstandingPayments - tenant.outstandingAmount)
        });
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete tenant');
    }
  };

  const addPayment = async (payment: Omit<Payment, 'id'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const paymentData: PaymentInsert = {
        tenant_id: payment.tenantId,
        landlord_id: user.id,
        amount: payment.amount,
        payment_date: payment.paymentDate.toISOString(),
        method: payment.method,
        reference: payment.reference || null,
        status: payment.status,
      };

      const { data, error } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single();

      if (error) throw error;

      const newPayment: Payment = {
        id: data.id,
        tenantId: data.tenant_id,
        amount: data.amount,
        paymentDate: new Date(data.payment_date),
        method: data.method,
        reference: data.reference || '',
        status: data.status,
      };

      setPayments(prev => [...prev, newPayment]);

      // Update tenant status and outstanding amount if payment is successful
      if (payment.status === 'paid') {
        const tenant = tenants.find(t => t.id === payment.tenantId);
        if (tenant) {
          const newOutstanding = Math.max(0, tenant.outstandingAmount - payment.amount);
          await updateTenant(payment.tenantId, {
            lastPaymentDate: payment.paymentDate,
            outstandingAmount: newOutstanding,
            status: newOutstanding === 0 ? 'active' : tenant.status
          });
        }
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to add payment');
    }
  };

  const getTenantsForProperty = (propertyId: string) => {
    return tenants.filter(tenant => tenant.propertyId === propertyId);
  };

  const getTotalProperties = () => properties.length;
  const getTotalUnits = () => properties.reduce((sum, prop) => sum + prop.totalUnits, 0);
  const getTotalRevenue = () => properties.reduce((sum, prop) => sum + prop.monthlyRevenue, 0);
  const getTotalOutstanding = () => properties.reduce((sum, prop) => sum + prop.outstandingPayments, 0);
  
  const getVacancyRate = (): number => {
    const totalUnits = getTotalUnits();
    const occupiedUnits = properties.reduce((sum, prop) => sum + prop.occupiedUnits, 0);
    return totalUnits > 0 ? ((totalUnits - occupiedUnits) / totalUnits) * 100 : 0;
  };

  const getRecentTenants = (limit: number = 5): Tenant[] => {
    const filteredTenants = selectedPropertyId 
      ? tenants.filter(t => t.propertyId === selectedPropertyId)
      : tenants;
    
    return filteredTenants
      .sort((a, b) => b.moveInDate.getTime() - a.moveInDate.getTime())
      .slice(0, limit);
  };

  const getDefaulterTenants = (): Tenant[] => {
    return tenants.filter(t => t.status === 'defaulter');
  };

  const getRecentPayments = (limit: number = 10): Payment[] => {
    return payments
      .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())
      .slice(0, limit);
  };

  const clearAllData = async () => {
    if (!user) return;

    try {
      // Delete all user data from Supabase
      await supabase.from('payments').delete().eq('landlord_id', user.id);
      await supabase.from('tenants').delete().eq('landlord_id', user.id);
      await supabase.from('properties').delete().eq('landlord_id', user.id);
      
      // Clear local state
      setProperties([]);
      setTenants([]);
      setPayments([]);
      setSelectedPropertyId(null);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  };

  return (
    <PropertyContext.Provider value={{
      properties,
      tenants,
      payments,
      selectedPropertyId,
      setSelectedPropertyId,
      addProperty,
      updateProperty,
      deleteProperty,
      addTenant,
      updateTenant,
      deleteTenant,
      addPayment,
      getTenantsForProperty,
      getTotalProperties,
      getTotalUnits,
      getTotalRevenue,
      getTotalOutstanding,
      getVacancyRate,
      getRecentTenants,
      getDefaulterTenants,
      getRecentPayments,
      canAddProperty,
      getPropertyLimit,
      clearAllData,
    }}>
      {children}
    </PropertyContext.Provider>
  );
};