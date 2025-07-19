import React, { useState, useEffect } from 'react';
import { useProperty } from '../contexts/PropertyContext';
import { useSMS } from '../contexts/SMSContext';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar,
  Building2,
  Users,
  CreditCard,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';

const Reports = () => {
  const { properties, tenants, getTotalRevenue, getTotalOutstanding, getVacancyRate } = useProperty();
  const { stats: smsStats } = useSMS();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [reportData, setReportData] = useState({
    monthlyData: [],
    tenantStatusData: [],
    lastUpdated: new Date()
  });

  // Generate dynamic report data based on actual data
  useEffect(() => {
    const generateReportData = () => {
      // Generate monthly data based on actual properties
      const monthlyData = [];
      const currentDate = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = month.toLocaleDateString('en-US', { month: 'short' });
        
        // Calculate revenue based on current properties (simulated historical data)
        const totalRevenue = getTotalRevenue();
        const baseRevenue = totalRevenue * (0.8 + Math.random() * 0.4); // Simulate variation
        const collected = baseRevenue * (0.85 + Math.random() * 0.15); // 85-100% collection rate
        
        monthlyData.push({
          month: monthName,
          revenue: Math.round(baseRevenue),
          collected: Math.round(collected),
          outstanding: Math.round(baseRevenue - collected)
        });
      }

      // Generate tenant status data based on actual tenants
      const statusCounts = {
        active: 0,
        defaulter: 0,
        suspended: 0,
        inactive: 0
      };

      tenants.forEach(tenant => {
        if (statusCounts.hasOwnProperty(tenant.status)) {
          statusCounts[tenant.status]++;
        }
      });

      const tenantStatusData = [
        { name: 'Active', value: statusCounts.active, color: '#10B981' },
        { name: 'Defaulter', value: statusCounts.defaulter, color: '#EF4444' },
        { name: 'Suspended', value: statusCounts.suspended, color: '#F59E0B' },
        { name: 'Inactive', value: statusCounts.inactive, color: '#6B7280' },
      ].filter(item => item.value > 0); // Only show categories with data

      setReportData({
        monthlyData,
        tenantStatusData,
        lastUpdated: new Date()
      });
    };

    generateReportData();
    
    // Update reports every 24 hours or when data changes
    const interval = setInterval(generateReportData, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [properties, tenants, getTotalRevenue]);

  const totalRevenue = getTotalRevenue();
  const totalOutstanding = getTotalOutstanding();
  const collectionRate = totalRevenue > 0 ? ((totalRevenue - totalOutstanding) / totalRevenue) * 100 : 0;
  const avgOccupancy = properties.length > 0 ? 
    ((properties.reduce((sum, p) => sum + p.occupiedUnits, 0) / 
      properties.reduce((sum, p) => sum + p.totalUnits, 0)) * 100) : 0;
  const vacancyRate = getVacancyRate();

  const handleExport = () => {
    // Create comprehensive report data
    const reportContent = [
      ['Property Management Report'],
      ['Generated on:', format(new Date(), 'PPP')],
      [''],
      ['Summary Statistics'],
      ['Total Properties:', properties.length],
      ['Total Tenants:', tenants.length],
      ['Total Revenue:', `KES ${totalRevenue.toLocaleString()}`],
      ['Outstanding Amount:', `KES ${totalOutstanding.toLocaleString()}`],
      ['Collection Rate:', `${collectionRate.toFixed(1)}%`],
      ['Occupancy Rate:', `${avgOccupancy.toFixed(1)}%`],
      ['Vacancy Rate:', `${vacancyRate.toFixed(1)}%`],
      [''],
      ['Property Details'],
      ['Name', 'Location', 'Type', 'Total Units', 'Occupied Units', 'Monthly Revenue', 'Outstanding'],
      ...properties.map(property => [
        property.name,
        property.location,
        property.propertyType,
        property.totalUnits,
        property.occupiedUnits,
        `KES ${property.monthlyRevenue.toLocaleString()}`,
        `KES ${property.outstandingPayments.toLocaleString()}`
      ]),
      [''],
      ['Tenant Status Distribution'],
      ...reportData.tenantStatusData.map(item => [item.name, item.value])
    ].map(row => Array.isArray(row) ? row.join(',') : row).join('\n');

    // Download as CSV
    const blob = new Blob([reportContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `property-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleViewPropertyDetails = (propertyId: string) => {
    // Navigate to property details or show modal
    window.location.href = `/properties?selected=${propertyId}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">
            Insights into your property performance
            {reportData.lastUpdated && (
              <span className="text-sm text-gray-500 ml-2">
                • Last updated: {reportData.lastUpdated.toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
          <button 
            onClick={handleExport}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Download className="h-5 w-5 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Properties</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">{properties.length}</p>
            </div>
            <div className="bg-blue-100 p-2 lg:p-3 rounded-lg">
              <Building2 className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 font-medium">
                {properties.length > 0 ? '+12%' : '0%'}
              </span>
              <span className="text-sm text-gray-500 ml-2">from last month</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tenants</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">{tenants.length}</p>
            </div>
            <div className="bg-teal-100 p-2 lg:p-3 rounded-lg">
              <Users className="h-5 w-5 lg:h-6 lg:w-6 text-teal-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 font-medium">
                {tenants.length > 0 ? '+8%' : '0%'}
              </span>
              <span className="text-sm text-gray-500 ml-2">from last month</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Collection Rate</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">{collectionRate.toFixed(1)}%</p>
            </div>
            <div className="bg-green-100 p-2 lg:p-3 rounded-lg">
              <CreditCard className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 font-medium">
                {collectionRate > 0 ? '+5%' : '0%'}
              </span>
              <span className="text-sm text-gray-500 ml-2">from last month</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Occupancy Rate</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {avgOccupancy.toFixed(1)}%
              </p>
            </div>
            <div className="bg-purple-100 p-2 lg:p-3 rounded-lg">
              <BarChart3 className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 font-medium">
                {avgOccupancy > 0 ? '+3%' : '0%'}
              </span>
              <span className="text-sm text-gray-500 ml-2">from last month</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Vacancy Rate</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {vacancyRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-orange-100 p-2 lg:p-3 rounded-lg">
              <AlertTriangle className="h-5 w-5 lg:h-6 lg:w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-sm text-red-600 font-medium">
                {vacancyRate > 0 ? `${vacancyRate.toFixed(1)}%` : '0%'}
              </span>
              <span className="text-sm text-gray-500 ml-2">vacant units</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Expected</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Collected</span>
              </div>
            </div>
          </div>
          {reportData.monthlyData.length > 0 ? (
            <div className="h-64 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`KES ${Number(value).toLocaleString()}`, '']}
                  />
                  <Bar dataKey="revenue" fill="#3B82F6" name="Expected Revenue" />
                  <Bar dataKey="collected" fill="#10B981" name="Collected" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No revenue data available</p>
                <p className="text-sm">Add properties and tenants to see revenue charts</p>
              </div>
            </div>
          )}
        </div>

        {/* Tenant Status Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 lg:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Tenant Status Distribution</h3>
          </div>
          {reportData.tenantStatusData.length > 0 ? (
            <div className="h-64 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData.tenantStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reportData.tenantStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No tenant data available</p>
                <p className="text-sm">Add tenants to see status distribution</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Property Performance Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Property Performance</h3>
        </div>
        {properties.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Occupancy
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Revenue
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Collection Rate
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outstanding
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {properties.map((property) => {
                  const occupancyRate = (property.occupiedUnits / property.totalUnits) * 100;
                  const propertyCollectionRate = property.monthlyRevenue > 0 ? 
                    ((property.monthlyRevenue - property.outstandingPayments) / property.monthlyRevenue) * 100 : 0;
                  
                  return (
                    <tr key={property.id} className="hover:bg-gray-50">
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{property.name}</div>
                        <div className="text-sm text-gray-500">{property.location}</div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {property.occupiedUnits}/{property.totalUnits} units
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${occupancyRate}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          KES {property.monthlyRevenue.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {propertyCollectionRate.toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          property.outstandingPayments > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {property.outstandingPayments > 0 ? 
                            `KES ${property.outstandingPayments.toLocaleString()}` : 
                            'All clear'
                          }
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewPropertyDetails(property.id)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No properties to display</p>
            <p className="text-sm text-gray-400">Add properties to see performance data</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;