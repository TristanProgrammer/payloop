import React, { useState } from 'react';
import { useProperty } from '../contexts/PropertyContext';
import { useNotifications } from '../contexts/NotificationContext';
import { 
  Users, 
  Plus, 
  Phone, 
  Mail, 
  Calendar,
  CreditCard,
  AlertCircle,
  Edit,
  Trash2,
  Search,
  Save,
  X
} from 'lucide-react';

const Tenants = () => {
  const { properties, tenants, addTenant, updateTenant, deleteTenant, getTenantsForProperty, selectedPropertyId } = useProperty();
  const { addNotification } = useNotifications();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [formData, setFormData] = useState({
    propertyId: selectedPropertyId || '',
    unitNumber: '',
    name: '',
    phone: '',
    email: '',
    rentAmount: '',
    dueDate: '',
    moveInDate: '',
    status: 'active' as 'active' | 'inactive' | 'suspended' | 'defaulter',
  });

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.phone.includes(searchTerm) ||
                         tenant.unitNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    const matchesProperty = propertyFilter === 'all' || tenant.propertyId === propertyFilter;
    return matchesSearch && matchesStatus && matchesProperty;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTenant) {
        // Update existing tenant
        updateTenant(editingTenant, {
          ...formData,
          rentAmount: parseInt(formData.rentAmount),
          dueDate: parseInt(formData.dueDate),
          moveInDate: new Date(formData.moveInDate),
        });
        addNotification({
          type: 'success',
          title: 'Tenant Updated',
          message: `${formData.name} has been updated successfully.`
        });
        setEditingTenant(null);
      } else {
        // Add new tenant
        addTenant({
          ...formData,
          rentAmount: parseInt(formData.rentAmount),
          dueDate: parseInt(formData.dueDate),
          moveInDate: new Date(formData.moveInDate),
          outstandingAmount: 0,
        });
        addNotification({
          type: 'success',
          title: 'Tenant Added',
          message: `${formData.name} has been added successfully.`
        });
        setShowAddForm(false);
      }
      
      setFormData({
        propertyId: selectedPropertyId || '',
        unitNumber: '',
        name: '',
        phone: '',
        email: '',
        rentAmount: '',
        dueDate: '',
        moveInDate: '',
        status: 'active',
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to save tenant.'
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditTenant = (tenant: any) => {
    setFormData({
      propertyId: tenant.propertyId,
      unitNumber: tenant.unitNumber,
      name: tenant.name,
      phone: tenant.phone,
      email: tenant.email || '',
      rentAmount: tenant.rentAmount.toString(),
      dueDate: tenant.dueDate.toString(),
      moveInDate: tenant.moveInDate.toISOString().split('T')[0],
      status: tenant.status,
    });
    setEditingTenant(tenant.id);
    setShowAddForm(true);
  };

  const handleDeleteTenant = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete tenant "${name}"?`)) {
      deleteTenant(id);
      addNotification({
        type: 'success',
        title: 'Tenant Deleted',
        message: `${name} has been deleted successfully.`
      });
    }
  };

  const handleStatusChange = (tenantId: string, newStatus: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      updateTenant(tenantId, { status: newStatus as any });
      addNotification({
        type: 'success',
        title: 'Status Updated',
        message: `${tenant.name}'s status has been changed to ${newStatus}.`
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingTenant(null);
    setShowAddForm(false);
    setFormData({
      propertyId: selectedPropertyId || '',
      unitNumber: '',
      name: '',
      phone: '',
      email: '',
      rentAmount: '',
      dueDate: '',
      moveInDate: '',
      status: 'active',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'defaulter':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-600">Manage your tenant relationships</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Tenant
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Properties</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="defaulter">Defaulter</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add/Edit Tenant Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingTenant ? 'Edit Tenant' : 'Add New Tenant'}
            </h2>
            <button
              onClick={handleCancelEdit}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700 mb-2">
                  Property
                </label>
                <select
                  id="propertyId"
                  name="propertyId"
                  value={formData.propertyId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Property</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="unitNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Number
                </label>
                <input
                  type="text"
                  id="unitNumber"
                  name="unitNumber"
                  value={formData.unitNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., A1, B2"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., John Doe"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+254712345678"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>
              
              <div>
                <label htmlFor="rentAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Rent (KES)
                </label>
                <input
                  type="number"
                  id="rentAmount"
                  name="rentAmount"
                  value={formData.rentAmount}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="30000"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date (Day of Month)
                </label>
                <input
                  type="number"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5"
                  min="1"
                  max="31"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="moveInDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Move-in Date
                </label>
                <input
                  type="date"
                  id="moveInDate"
                  name="moveInDate"
                  value={formData.moveInDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {editingTenant && (
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                    <option value="defaulter">Defaulter</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingTenant ? 'Update Tenant' : 'Add Tenant'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tenants List */}
      {filteredTenants.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                All Tenants ({filteredTenants.length})
              </h3>
              <div className="text-sm text-gray-500">
                {propertyFilter !== 'all' && (
                  <span>Filtered by: {properties.find(p => p.id === propertyFilter)?.name}</span>
                )}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property & Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rent Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTenants.map((tenant) => {
                  const property = properties.find(p => p.id === tenant.propertyId);
                  const isSampleData = tenant.id.startsWith('sample-');
                  return (
                    <tr key={tenant.id} className={`hover:bg-gray-50 ${
                      isSampleData ? 'bg-orange-50' : ''
                    }`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <Users className="h-5 w-5 text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {tenant.name}
                              {isSampleData && (
                                <span className="ml-2 text-xs text-orange-600 font-medium">(Sample)</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              Moved in: {tenant.moveInDate.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{property?.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">Unit {tenant.unitNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900 mb-1">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {tenant.phone}
                        </div>
                        {tenant.email && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            {tenant.email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          KES {tenant.rentAmount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          Due: {tenant.dueDate}th of month
                        </div>
                        {tenant.outstandingAmount > 0 && (
                          <div className="text-sm text-red-600 font-medium">
                            Outstanding: KES {tenant.outstandingAmount.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={tenant.status}
                          onChange={(e) => handleStatusChange(tenant.id, e.target.value)}
                          className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusColor(tenant.status)}`}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                          <option value="defaulter">Defaulter</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditTenant(tenant)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteTenant(tenant.id, tenant.name)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Tenants Found</h2>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== 'all' || propertyFilter !== 'all'
              ? 'No tenants match your search criteria'
              : 'Get started by adding your first tenant'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && propertyFilter === 'all' && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Tenant
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Tenants;