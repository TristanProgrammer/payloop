import React, { useState } from 'react';
import { useProperty } from '../contexts/PropertyContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { 
  Building2, 
  Plus, 
  MapPin, 
  Users, 
  CreditCard, 
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  Save,
  X
} from 'lucide-react';

const Properties = () => {
  const { user } = useAuth();
  const { properties, addProperty, updateProperty, deleteProperty, getTenantsForProperty, canAddProperty, getPropertyLimit } = useProperty();
  const { addNotification } = useNotifications();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    totalUnits: '',
    propertyType: 'apartment' as 'apartment' | 'house' | 'commercial',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProperty) {
        // Update existing property
        updateProperty(editingProperty, {
          ...formData,
          totalUnits: parseInt(formData.totalUnits),
        });
        addNotification({
          type: 'success',
          title: 'Property Updated',
          message: `${formData.name} has been updated successfully.`
        });
        setEditingProperty(null);
      } else {
        // Add new property
        if (!canAddProperty()) {
          addNotification({
            type: 'error',
            title: 'Property Limit Reached',
            message: `You can only add ${getPropertyLimit()} properties with your ${user?.subscriptionPlan} plan. Upgrade to add more properties.`
          });
          return;
        }

        addProperty({
          ...formData,
          totalUnits: parseInt(formData.totalUnits),
          occupiedUnits: 0,
          monthlyRevenue: 0,
          outstandingPayments: 0,
        });
        
        addNotification({
          type: 'success',
          title: 'Property Added',
          message: `${formData.name} has been added successfully.`
        });
        setShowAddForm(false);
      }
      
      setFormData({
        name: '',
        location: '',
        totalUnits: '',
        propertyType: 'apartment',
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to save property.'
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditProperty = (property: any) => {
    setFormData({
      name: property.name,
      location: property.location,
      totalUnits: property.totalUnits.toString(),
      propertyType: property.propertyType,
    });
    setEditingProperty(property.id);
    setShowAddForm(true);
  };

  const handleDeleteProperty = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This will also remove all associated tenants.`)) {
      deleteProperty(id);
      addNotification({
        type: 'success',
        title: 'Property Deleted',
        message: `${name} has been deleted successfully.`
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingProperty(null);
    setShowAddForm(false);
    setFormData({
      name: '',
      location: '',
      totalUnits: '',
      propertyType: 'apartment',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600">
            Manage your property portfolio ({properties.length}/{getPropertyLimit() === Infinity ? '∞' : getPropertyLimit()})
          </p>
        </div>
        <button
          onClick={() => {
            if (!canAddProperty()) {
              addNotification({
                type: 'error',
                title: 'Property Limit Reached',
                message: `You can only add ${getPropertyLimit()} properties with your ${user?.subscriptionPlan} plan. Upgrade to add more properties.`
              });
              return;
            }
            setShowAddForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Property
        </button>
      </div>

      {/* Property Limit Warning */}
      {!canAddProperty() && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-orange-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-orange-800">
                Property limit reached ({properties.length}/{getPropertyLimit()})
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Upgrade your plan to add more properties
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Property Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingProperty ? 'Edit Property' : 'Add New Property'}
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
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Property Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Kilimani Apartments"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Kilimani, Nairobi"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="totalUnits" className="block text-sm font-medium text-gray-700 mb-2">
                  Total Units
                </label>
                <input
                  type="number"
                  id="totalUnits"
                  name="totalUnits"
                  value={formData.totalUnits}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 12"
                  min="1"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type
                </label>
                <select
                  id="propertyType"
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
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
                {editingProperty ? 'Update Property' : 'Add Property'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Properties Grid */}
      {properties.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => {
            const tenants = getTenantsForProperty(property.id);
            const occupancyRate = (property.occupiedUnits / property.totalUnits) * 100;
            const isSampleData = property.id.startsWith('sample-');
            
            return (
              <div key={property.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                isSampleData ? 'border-orange-200 bg-orange-50' : 'border-gray-200'
              }`}>
                {isSampleData && (
                  <div className="bg-orange-100 px-4 py-2 border-b border-orange-200">
                    <p className="text-xs text-orange-700 font-medium">Sample Data - You can delete this</p>
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {property.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditProperty(property)}
                        className="p-2 text-gray-400 hover:text-blue-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteProperty(property.id, property.name)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">Occupancy</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {property.occupiedUnits}/{property.totalUnits} units
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${occupancyRate}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">Monthly Revenue</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        KES {property.monthlyRevenue.toLocaleString()}
                      </span>
                    </div>
                    
                    {property.outstandingPayments > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                          <span className="text-sm text-red-600">Outstanding</span>
                        </div>
                        <span className="text-sm font-medium text-red-600">
                          KES {property.outstandingPayments.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="border-t border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      property.propertyType === 'apartment' ? 'bg-blue-100 text-blue-800' :
                      property.propertyType === 'house' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {property.propertyType}
                    </span>
                    <button className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Properties Yet</h2>
          <p className="text-gray-600 mb-6">Get started by adding your first property</p>
          <button
            onClick={() => {
              if (!canAddProperty()) {
                addNotification({
                  type: 'error',
                  title: 'Property Limit Reached',
                  message: `You can only add ${getPropertyLimit()} properties with your ${user?.subscriptionPlan} plan.`
                });
                return;
              }
              setShowAddForm(true);
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Your First Property
          </button>
        </div>
      )}
    </div>
  );
};

export default Properties;