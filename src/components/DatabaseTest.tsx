'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useAuth } from '@/components/auth/AuthProvider';

interface Customer {
  id: string;
  name: string;
  industry: string;
  arr_value: number;
  health_score: number;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export default function DatabaseTest() {
  const { user, profile, loading: authLoading } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [updateLog, setUpdateLog] = useState<string[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Add log entry
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setUpdateLog(prev => [`${timestamp}: ${message}`, ...prev.slice(0, 9)]);
  };

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching customers...');
      addLog('Fetching customers from database...');

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customers:', error);
        setError(error.message);
        addLog(`Error fetching customers: ${error.message}`);
        return;
      }

      console.log('Customers fetched:', data);
      setCustomers(data || []);
      addLog(`Fetched ${data?.length || 0} customers`);
    } catch (err) {
      console.error('Exception fetching customers:', err);
      setError('Failed to fetch customers');
      addLog('Exception while fetching customers');
    } finally {
      setLoading(false);
    }
  };

  // Add new customer
  const addCustomer = async () => {
    if (!newCustomerName.trim() || !profile?.company_id) {
      addLog('Error: Missing customer name or company ID');
      return;
    }

    try {
      setIsAdding(true);
      addLog(`Adding new customer: ${newCustomerName}`);

      const { data, error } = await supabase
        .from('customers')
        .insert([
          {
            name: newCustomerName.trim(),
            industry: 'Technology',
            arr_value: Math.floor(Math.random() * 500000) + 50000, // Random ARR between 50K-550K
            health_score: Math.floor(Math.random() * 40) + 60, // Random score between 60-100
            company_id: profile.company_id,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding customer:', error);
        addLog(`Error adding customer: ${error.message}`);
        return;
      }

      console.log('Customer added:', data);
      addLog(`Customer '${newCustomerName}' added successfully`);
      setNewCustomerName('');
      
      // Don't manually update state - let real-time subscription handle it
    } catch (err) {
      console.error('Exception adding customer:', err);
      addLog('Exception while adding customer');
    } finally {
      setIsAdding(false);
    }
  };

  // Update customer health score
  const updateCustomerHealth = async (customerId: string, currentScore: number) => {
    const newScore = currentScore === 100 ? 60 : currentScore + 10;
    
    try {
      addLog(`Updating customer health score to ${newScore}`);

      const { error } = await supabase
        .from('customers')
        .update({ 
          health_score: newScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId);

      if (error) {
        console.error('Error updating customer:', error);
        addLog(`Error updating customer: ${error.message}`);
        return;
      }

      addLog(`Customer health score updated to ${newScore}`);
    } catch (err) {
      console.error('Exception updating customer:', err);
      addLog('Exception while updating customer');
    }
  };

  // Delete customer
  const deleteCustomer = async (customerId: string, customerName: string) => {
    if (!confirm(`Delete customer "${customerName}"?`)) return;

    try {
      addLog(`Deleting customer: ${customerName}`);

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) {
        console.error('Error deleting customer:', error);
        addLog(`Error deleting customer: ${error.message}`);
        return;
      }

      addLog(`Customer '${customerName}' deleted successfully`);
    } catch (err) {
      console.error('Exception deleting customer:', err);
      addLog('Exception while deleting customer');
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (user && profile?.company_id) {
      fetchCustomers();
    }
  }, [user, profile]);

  // Real-time subscription
  useEffect(() => {
    if (!user || !profile?.company_id) return;

    console.log('Setting up real-time subscription for customers');
    addLog('Setting up real-time database subscription...');

    const channel = supabase
      .channel('customer-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers',
          filter: `company_id=eq.${profile.company_id}`,
        },
        (payload) => {
          console.log('Real-time customer change:', payload);
          
          const eventType = payload.eventType;
          const newRecord = payload.new as Customer;
          const oldRecord = payload.old as Customer;

          if (eventType === 'INSERT') {
            addLog(`Real-time: Customer '${newRecord.name}' added`);
            setCustomers(prev => [newRecord, ...prev]);
          } else if (eventType === 'UPDATE') {
            addLog(`Real-time: Customer '${newRecord.name}' updated`);
            setCustomers(prev => 
              prev.map(customer => 
                customer.id === newRecord.id ? newRecord : customer
              )
            );
          } else if (eventType === 'DELETE') {
            addLog(`Real-time: Customer deleted`);
            setCustomers(prev => 
              prev.filter(customer => customer.id !== oldRecord.id)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          addLog('Real-time subscription active ✓');
        } else if (status === 'CHANNEL_ERROR') {
          addLog('Real-time subscription error ✗');
        }
      });

    return () => {
      console.log('Cleaning up real-time subscription');
      addLog('Cleaning up real-time subscription...');
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

  if (authLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold text-red-600 mb-2">❌ Authentication Required</h2>
        <p className="text-gray-600">Please log in to test database functionality.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Auth Status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-green-600 mb-4">✅ Authentication Status</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>User Email:</strong> {user.email}
          </div>
          <div>
            <strong>Profile Name:</strong> {profile?.full_name || 'Not set'}
          </div>
          <div>
            <strong>First Name:</strong> {profile?.first_name || 'Not parsed'}
          </div>
          <div>
            <strong>Company ID:</strong> {profile?.company_id || 'Not set'}
          </div>
        </div>
      </div>

      {/* Add Customer */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Add Test Customer</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCustomerName}
            onChange={(e) => setNewCustomerName(e.target.value)}
            placeholder="Customer name"
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isAdding}
          />
          <button
            onClick={addCustomer}
            disabled={isAdding || !newCustomerName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isAdding ? 'Adding...' : 'Add Customer'}
          </button>
        </div>
      </div>

      {/* Customers List */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Customers ({customers.length})</h3>
          <button
            onClick={fetchCustomers}
            disabled={loading}
            className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 text-sm"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No customers found. Add one above to test real-time updates!
          </div>
        ) : (
          <div className="space-y-3">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
              >
                <div>
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-sm text-gray-500">
                    {customer.industry} • ${customer.arr_value.toLocaleString()} ARR • 
                    Health: {customer.health_score}%
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateCustomerHealth(customer.id, customer.health_score)}
                    className="px-2 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                  >
                    Update Health
                  </button>
                  <button
                    onClick={() => deleteCustomer(customer.id, customer.name)}
                    className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Real-time Log */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Real-time Activity Log</h3>
        <div className="bg-gray-50 p-3 rounded-md max-h-60 overflow-y-auto">
          {updateLog.length === 0 ? (
            <div className="text-gray-500 text-sm">No activity yet...</div>
          ) : (
            <div className="space-y-1">
              {updateLog.map((log, index) => (
                <div key={index} className="text-sm font-mono">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}