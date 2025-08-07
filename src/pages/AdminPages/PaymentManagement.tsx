import { useState, useEffect } from 'react';
import { apiService, PaymentRequest, Deliverable } from '../../services/api';

import ComponentCard from '../../components/common/ComponentCard';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import Button from '../../components/ui/button/Button';
import Badge from '../../components/ui/badge/Badge';
import { Modal } from '../../components/ui/modal';
import TextArea from '../../components/form/input/TextArea';
import { showToast } from '../../utils/toast';

interface PaymentRequestDetails {
  paymentRequest: PaymentRequest;
  deliverables: Deliverable[];
  auditLogs: Array<{
    logId: string;
    requestId: string;
    userId: string;
    userRole: 'admin' | 'creator';
    action: string;
    timestamp: string;
    details: Record<string, unknown>;
  }>;
}

interface PaymentAnalytics {
  totalRequests: number;
  pendingRequests: number;
  totalAmountPaid: number;
  monthlyRequests: number;
  averagePaymentAmount: number;
}

export default function PaymentManagement() {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [requestDetails, setRequestDetails] = useState<PaymentRequestDetails | null>(null);
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);

  // Form states
  const [approveForm, setApproveForm] = useState({
    paymentMethod: '',
    amountPaid: '',
    transactionId: '',
    adminNotes: '',
  });

  const [denyForm, setDenyForm] = useState({
    denialReason: '',
    adminNotes: '',
  });

  const [holdForm, setHoldForm] = useState({
    adminNotes: '',
  });

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [creatorFilter, setCreatorFilter] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requestsData, analyticsData] = await Promise.all([
        apiService.getPaymentRequests(),
        apiService.getPaymentAnalytics(),
      ]);
      setPaymentRequests(requestsData);
      setAnalytics(analyticsData as unknown as PaymentAnalytics);
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast.error('Failed to load payment requests');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (request: PaymentRequest) => {
    try {
      const details = await apiService.getPaymentRequestDetails(request.requestId);
      setRequestDetails(details);
      setSelectedRequest(request);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Failed to load request details:', error);
      showToast.error('Failed to load request details');
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      if (!approveForm.paymentMethod || !approveForm.amountPaid || !approveForm.transactionId) {
        showToast.error('Please fill in all required fields');
        return;
      }

      await apiService.approvePaymentRequest(selectedRequest.requestId, {
        paymentMethod: approveForm.paymentMethod,
        amountPaid: parseFloat(approveForm.amountPaid),
        transactionId: approveForm.transactionId,
        adminNotes: approveForm.adminNotes,
      });

      showToast.success('Payment request approved and processed successfully');
      setShowApproveModal(false);
      setApproveForm({ paymentMethod: '', amountPaid: '', transactionId: '', adminNotes: '' });
      loadData();
    } catch (error) {
      console.error('Failed to approve payment request:', error);
      showToast.error('Failed to approve payment request');
    }
  };

  const handleDeny = async () => {
    if (!selectedRequest) return;

    try {
      if (!denyForm.denialReason) {
        showToast.error('Please provide a denial reason');
        return;
      }

      await apiService.denyPaymentRequest(selectedRequest.requestId, {
        denialReason: denyForm.denialReason,
        adminNotes: denyForm.adminNotes,
      });

      showToast.success('Payment request denied successfully');
      setShowDenyModal(false);
      setDenyForm({ denialReason: '', adminNotes: '' });
      loadData();
    } catch (error) {
      console.error('Failed to deny payment request:', error);
      showToast.error('Failed to deny payment request');
    }
  };

  const handleHold = async () => {
    if (!selectedRequest) return;

    try {
      await apiService.putPaymentRequestOnHold(selectedRequest.requestId, {
        adminNotes: holdForm.adminNotes,
      });

      showToast.success('Payment request put on hold successfully');
      setShowHoldModal(false);
      setHoldForm({ adminNotes: '' });
      loadData();
    } catch (error) {
      console.error('Failed to put payment request on hold:', error);
      showToast.error('Failed to put payment request on hold');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'paid': return 'success';
      case 'denied': return 'error';
      case 'on_hold': return 'info';
      default: return 'primary';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredRequests = paymentRequests.filter(request => {
    if (statusFilter !== 'all' && request.status !== statusFilter) return false;
    if (creatorFilter && !request.creatorName.toLowerCase().includes(creatorFilter.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading payment management...</div>
      </div>
    );
  }

  const pendingPayments = paymentRequests.filter(pr => pr.status === 'pending');
  const standardPayments = pendingPayments.filter(pr => pr.amountRequested <= 500); // Define "standard" as <= $500
  const largePayments = pendingPayments.filter(pr => pr.amountRequested > 500);

  // Creator Health Monitor calculations based on payment patterns
  const getCreatorHealthData = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Get unique creators from payment requests
    const uniqueCreators = [...new Set(paymentRequests.map(pr => pr.creatorId))];
    
    // Inactive creators (no payment requests in 30+ days)
    const inactiveCreators = uniqueCreators.filter(creatorId => {
      const recentRequests = paymentRequests.filter(pr => 
        pr.creatorId === creatorId && new Date(pr.createdAt) >= thirtyDaysAgo
      );
      return recentRequests.length === 0;
    });
    
    // High earners (creators with multiple recent payments)
    const highEarners = uniqueCreators.filter(creatorId => {
      const recentRequests = paymentRequests.filter(pr => 
        pr.creatorId === creatorId && 
        new Date(pr.createdAt) >= sevenDaysAgo && 
        pr.status === 'paid'
      );
      const totalEarnings = recentRequests.reduce((sum, pr) => sum + pr.amountRequested, 0);
      return totalEarnings > 1000; // High earner threshold
    });
    
    // At-risk creators (pending payments for too long)
    const atRiskCreators = uniqueCreators.filter(creatorId => {
      const oldPendingRequests = paymentRequests.filter(pr => 
        pr.creatorId === creatorId && 
        pr.status === 'pending' && 
        new Date(pr.createdAt) < sevenDaysAgo
      );
      return oldPendingRequests.length > 0;
    });
    
    return {
      inactive: inactiveCreators.length,
      highEarners: highEarners.length,
      atRisk: atRiskCreators.length,
      total: uniqueCreators.length
    };
  };

  const creatorHealth = getCreatorHealthData();

  const handleQuickApprove = async (requestId: string, amount: number) => {
    try {
      await apiService.approvePaymentRequest(requestId, {
        paymentMethod: 'bank_transfer',
        amountPaid: amount,
        transactionId: `AUTO_${Date.now()}`,
        adminNotes: 'Quick approved - standard payment',
      });
      showToast.success('Payment approved successfully');
      loadData();
    } catch (error) {
      console.error('Failed to quick approve payment:', error);
      showToast.error('Failed to approve payment');
    }
  };

  const handleBulkApprove = async () => {
    if (!confirm(`Approve all ${standardPayments.length} standard payments?`)) return;
    
    try {
      const promises = standardPayments.map(payment => 
        apiService.approvePaymentRequest(payment.requestId, {
          paymentMethod: 'bank_transfer',
          amountPaid: payment.amountRequested,
          transactionId: `BULK_${Date.now()}_${payment.requestId.slice(-6)}`,
          adminNotes: 'Bulk approved - standard payment',
        })
      );
      await Promise.all(promises);
      showToast.success(`Successfully approved ${standardPayments.length} payments`);
      loadData();
    } catch (error) {
      console.error('Failed to bulk approve payments:', error);
      showToast.error('Failed to bulk approve payments');
    }
  };

  return (
    <div className="space-y-6 lg:ml-64">
      <PageBreadcrumb pageTitle="Payment Management" />
      
      {/* Payment Queue Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Payment Queue</h1>
            <p className="text-green-100">
              {pendingPayments.length} payments awaiting approval • {formatCurrency(pendingPayments.reduce((sum, p) => sum + p.amountRequested, 0))} total value
            </p>
          </div>
          {standardPayments.length > 0 && (
            <Button 
              onClick={handleBulkApprove}
              className="bg-white text-green-600 hover:bg-gray-100"
            >
              Quick Approve All Standard ({standardPayments.length})
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <ComponentCard title="Pending Requests">
            <div className="p-2 text-center">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg inline-block mb-3">
                <span className="text-2xl">⏳</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.pendingRequests}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Approval</p>
            </div>
          </ComponentCard>
          
          <ComponentCard title="Total Paid">
            <div className="p-2 text-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg inline-block mb-3">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(analytics.totalAmountPaid)}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
            </div>
          </ComponentCard>
          
          <ComponentCard title="This Month">
            <div className="p-2 text-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg inline-block mb-3">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.monthlyRequests}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
            </div>
          </ComponentCard>
          
          <ComponentCard title="Average Payment">
            <div className="p-2 text-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg inline-block mb-3">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(analytics.averagePaymentAmount)}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Payment</p>
            </div>
          </ComponentCard>
        </div>
      )}

      {/* Priority Payment Queue & Creator Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Creator Health Monitor - Always show */}
        <ComponentCard title="⚡ Creator Health Monitor">
          <div className="p-2">
            <div className="space-y-4">
              {/* Inactive Creators Alert */}
              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 dark:text-orange-400 text-sm">😴</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Inactive</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">30+ days</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {creatorHealth.inactive}
                  </span>
                  {creatorHealth.inactive > 0 && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.location.href = '/user-management'}
                    >
                      Review
                    </Button>
                  )}
                </div>
              </div>

              {/* High Earners */}
              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 dark:text-purple-400 text-sm">⭐</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">High Earners</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">$1K+ this week</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {creatorHealth.highEarners}
                  </span>
                  {creatorHealth.highEarners > 0 && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.location.href = '/creators'}
                    >
                      View
                    </Button>
                  )}
                </div>
              </div>

              {/* At Risk Creators */}
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <span className="text-red-600 dark:text-red-400 text-sm">⚠️</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">At Risk</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Overdue payments</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-red-600 dark:text-red-400">
                    {creatorHealth.atRisk}
                  </span>
                  {creatorHealth.atRisk > 0 && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.location.href = '/payment-management?filter=pending'}
                    >
                      Fix
                    </Button>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Creators</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {creatorHealth.total}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ComponentCard>

        {/* Standard Payments - Quick Approve */}
        {pendingPayments.length > 0 && standardPayments.length > 0 && (
          <ComponentCard title="🚀 Quick Approve - Standard Payments" className="max-h-96 overflow-y-auto w-full col-span-2">
            <div className="p-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {standardPayments.length} Standard Payments
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Payments ≤ $500 • {formatCurrency(standardPayments.reduce((sum, p) => sum + p.amountRequested, 0))} total
                  </p>
                </div>
                <Button onClick={handleBulkApprove} className="bg-green-600 text-white hover:bg-green-700">
                  Approve All
                </Button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {standardPayments.map((payment) => (
                  <div key={payment.requestId} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <span className="text-green-600 dark:text-green-400 font-bold">
                          {payment.creatorName?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {payment.creatorName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency(payment.amountRequested)}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">Standard</p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleQuickApprove(payment.requestId, payment.amountRequested)}
                        className="bg-green-600 text-white hover:bg-green-700"
                      >
                        ✓ Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ComponentCard>
        )}

        {/* Large Payments - Needs Review */}
        {pendingPayments.length > 0 && largePayments.length > 0 && (
          <ComponentCard title="⚠️ Large Payments - Review Required">
            <div className="p-2">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {largePayments.length} Large Payments
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Payments &gt; $500 • {formatCurrency(largePayments.reduce((sum, p) => sum + p.amountRequested, 0))} total
                </p>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {largePayments.map((payment) => (
                  <div key={payment.requestId} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 dark:text-orange-400 font-bold">
                          {payment.creatorName?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {payment.creatorName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency(payment.amountRequested)}
                        </p>
                        <p className="text-xs text-orange-600 dark:text-orange-400">Needs Review</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewDetails(payment)}
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ComponentCard>
        )}
      </div>

      {/* Payment Requests Table with integrated filters */}
      <ComponentCard title="Payment Requests">
        <div className="p-2">
          {/* Integrated Filters */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
                <option value="denied">Denied</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Creator Name
              </label>
              <input
                type="text"
                value={creatorFilter}
                onChange={(e) => setCreatorFilter(e.target.value)}
                placeholder="Filter by creator name"
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            {/* Results Summary */}
            <div className="flex items-end">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {filteredRequests.length === paymentRequests.length 
                  ? `${filteredRequests.length} total requests`
                  : `${filteredRequests.length} of ${paymentRequests.length} requests`
                }
              </div>
            </div>
          </div>

          {/* Table Content */}
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">No payment requests found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {statusFilter !== 'all' ? `No ${statusFilter} requests` : 'No payment requests have been submitted yet'}
              </p>
              {(statusFilter !== 'all' || creatorFilter) && (
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setCreatorFilter('');
                  }}
                  className="mt-2 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Creator</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Notes</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.requestId} className="border-b border-gray-50 dark:border-gray-800">
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        <div>
                          <p className="font-medium">{request.creatorName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{request.creatorId.slice(-8)}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">{formatDate(request.createdAt)}</td>
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{formatCurrency(request.amountRequested)}</td>
                      <td className="py-3 px-4">
                        <Badge color={getStatusColor(request.status)}>
                          {request.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {request.notes || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"                            onClick={() => handleViewDetails(request)}
                          >
                            View
                          </Button>
                          {request.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowApproveModal(true);
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowDenyModal(true);
                                }}
                              >
                                Deny
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowHoldModal(true);
                                }}
                              >
                                Hold
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </ComponentCard>

      {/* Payment Request Details Modal */}
      <Modal
        isOpen={showDetailsModal}        onClose={() => setShowDetailsModal(false)}
      >
      <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="max-w-3xl mx-auto rounded-lg">
          <div className="flex w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white my-4">
              Payment Request Details
            </h3>
            <div className="flex ml-auto h-10 my-auto">
              <Button
                variant="outline"                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
          {requestDetails && selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Request ID
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedRequest.requestId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Creator
                  </label>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedRequest.creatorName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{selectedRequest.creatorId}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <Badge color={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount Requested
                  </label>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {formatCurrency(selectedRequest.amountRequested)}
                  </p>
                </div>
              </div>

              {/* Payment Details Section - Show when payment has been processed */}
              {(selectedRequest.status === 'paid' || selectedRequest.status === 'approved') && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                    Payment Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedRequest.paymentMethod && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Payment Method
                        </label>
                        <p className="text-sm text-gray-900 dark:text-white font-medium">
                          {selectedRequest.paymentMethod}
                        </p>
                      </div>
                    )}
                    {selectedRequest.amountPaid && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Amount Paid
                        </label>
                        <p className="text-lg font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(selectedRequest.amountPaid)}
                        </p>
                      </div>
                    )}
                    {selectedRequest.transactionId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Transaction ID
                        </label>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded flex-1">
                            {selectedRequest.transactionId}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"                            onClick={() => {
                              navigator.clipboard.writeText(selectedRequest.transactionId!);
                              // You could add a toast notification here
                            }}
                            className="px-2 py-1 text-xs"
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                    )}
                    {selectedRequest.paymentDate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Payment Date
                        </label>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {formatDate(selectedRequest.paymentDate)}
                        </p>
                      </div>
                    )}
                    {selectedRequest.processedBy && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Processed By
                        </label>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedRequest.processedBy}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Notes Section */}
              {selectedRequest.adminNotes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Admin Notes
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/20 p-3 rounded border-l-4 border-blue-500">
                    {selectedRequest.adminNotes}
                  </p>
                </div>
              )}

              {selectedRequest.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Creator Notes
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    {selectedRequest.notes}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Associated Deliverables ({requestDetails.deliverables.length})
                </label>
                <div className="space-y-2">
                  {requestDetails.deliverables.map((deliverable: Deliverable) => (
                    <div key={deliverable.deliverableId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {deliverable.platform} Deliverable
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {deliverable.link}
                        </p>
                        {deliverable.stats && (
                          <div className="flex space-x-4 mt-1 text-xs text-gray-500">
                            <span>Views: {deliverable.stats.views?.toLocaleString() || 0}</span>
                            <span>Likes: {deliverable.stats.likes?.toLocaleString() || 0}</span>
                            <span>Comments: {deliverable.stats.comments?.toLocaleString() || 0}</span>
                          </div>
                        )}
                      </div>
                      <Badge color="info">{deliverable.platform}</Badge>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
        </div>
      </Modal>

      {/* Approve Payment Modal */}
      <Modal
        isOpen={showApproveModal}        onClose={() => setShowApproveModal(false)}
      >
        <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-[700px] mx-4 max-h-[90vh] overflow-y-auto">
          <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Approve & Process Payment
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Method
            </label>
            <select
              value={approveForm.paymentMethod}              onChange={(e) => setApproveForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select payment method</option>
              <option value="Crypto">Crypto</option>
              <option value="PayPal">PayPal</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount Paid (USD)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={approveForm.amountPaid}              onChange={(e) => setApproveForm(prev => ({ ...prev, amountPaid: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter actual amount paid"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Transaction ID
            </label>
            <input
              type="text"
              value={approveForm.transactionId}              onChange={(e) => setApproveForm(prev => ({ ...prev, transactionId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter transaction reference"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Admin Notes (Optional)
            </label>
            <TextArea
              value={approveForm.adminNotes}              onChange={(value) => setApproveForm(prev => ({ ...prev, adminNotes: value }))}
              placeholder="Add any internal notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"              onClick={() => setShowApproveModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={!approveForm.paymentMethod || !approveForm.amountPaid || !approveForm.transactionId}            >
              Approve & Pay
            </Button>
          </div>
          </div>
        </div>
      </Modal>

      {/* Deny Payment Modal */}
      <Modal
        isOpen={showDenyModal}        onClose={() => setShowDenyModal(false)}
      >
        <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-[700px] mx-4 max-h-[90vh] overflow-y-auto">
          <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Deny Payment Request
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Denial Reason *
            </label>
            <TextArea
              value={denyForm.denialReason}              onChange={(value) => setDenyForm(prev => ({ ...prev, denialReason: value }))}
              placeholder="Explain why this payment request is being denied..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Admin Notes (Optional)
            </label>
            <TextArea
              value={denyForm.adminNotes}              onChange={(value) => setDenyForm(prev => ({ ...prev, adminNotes: value }))}
              placeholder="Add any internal notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"              onClick={() => setShowDenyModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeny}
              disabled={!denyForm.denialReason}            >
              Deny Request
            </Button>
          </div>
          </div>
        </div>
      </Modal>

      {/* Hold Payment Modal */}
      <Modal
        isOpen={showHoldModal}        onClose={() => setShowHoldModal(false)}
      >
        <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-[700px] mx-4 max-h-[90vh] overflow-y-auto">
          <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Put Payment Request On Hold
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Admin Notes (Optional)
            </label>
            <TextArea
              value={holdForm.adminNotes}              onChange={(value) => setHoldForm(prev => ({ ...prev, adminNotes: value }))}
              placeholder="Explain why this request is being put on hold..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"              onClick={() => setShowHoldModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleHold}            >
              Put On Hold
            </Button>
          </div>
          </div>
        </div>
      </Modal>
    </div>
  );
} 