import React, { useState, useEffect } from 'react';
import { apiService, PaymentRequest, Deliverable } from '../../services/api';
import ComponentCard from '../../components/common/ComponentCard';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import Button from '../../components/ui/button/Button';
import Badge from '../../components/ui/badge/Badge';
import { Modal } from '../../components/ui/modal';
import TextArea from '../../components/form/input/TextArea';
import { showToast } from '../../utils/toast';

export default function PaymentRequests() {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [requestDetails, setRequestDetails] = useState<Record<string, unknown> | null>(null);

  // New request form state
  const [newRequest, setNewRequest] = useState({
    amountRequested: '',
    deliverableIds: [] as string[],
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requestsData, deliverablesData] = await Promise.all([
        apiService.getPaymentRequests(),
        apiService.getDeliverables(),
      ]);
      setPaymentRequests(requestsData);
      setDeliverables(deliverablesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast.error('Failed to load payment requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    try {
      if (!newRequest.amountRequested || !newRequest.deliverableIds.length) {
        showToast.error('Please fill in all required fields');
        return;
      }

      const amount = parseFloat(newRequest.amountRequested);
      if (amount < 1 || amount > 10000) {
        showToast.error('Amount must be between $1.00 and $10,000.00');
        return;
      }

      await apiService.createPaymentRequest({
        amountRequested: amount,
        deliverableIds: newRequest.deliverableIds,
        notes: newRequest.notes,
      });

      showToast.success('Payment request submitted successfully');
      setShowNewRequestModal(false);
      setNewRequest({ amountRequested: '', deliverableIds: [], notes: '' });
      loadData();
    } catch (error) {
      console.error('Failed to create payment request:', error);
      showToast.error('Failed to submit payment request');
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

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this payment request?')) {
      return;
    }

    try {
      await apiService.cancelPaymentRequest(requestId);
      showToast.success('Payment request cancelled successfully');
      loadData();
    } catch (error) {
      console.error('Failed to cancel payment request:', error);
      showToast.error('Failed to cancel payment request');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading payment requests...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:ml-64">
      <PageBreadcrumb pageTitle="Get Paid" />
      
      <ComponentCard
        title={
          <div className="flex items-center justify-between w-full">
            <span>💰 Get Paid</span>
            <Button
              onClick={() => setShowNewRequestModal(true)}
              size="sm"
              className="px-3 py-1 text-xs"
            >
              💰 Request Payment
            </Button>
          </div>
        }
      >
        {paymentRequests.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Ready to get paid?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Request payment for your content and start earning money! 💸
            </p>
            <Button onClick={() => setShowNewRequestModal(true)}>
              Request Your First Payment
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Notes</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paymentRequests.map((request) => (
                  <tr key={request.requestId} className="border-b border-gray-50 dark:border-gray-800">
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
                          variant="outline"                          onClick={() => handleViewDetails(request)}
                        >
                          View
                        </Button>
                        {request.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"                            onClick={() => handleCancelRequest(request.requestId)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ComponentCard>

      {/* New Payment Request Modal */}
      <Modal
        isOpen={showNewRequestModal}        onClose={() => setShowNewRequestModal(false)}
      >
        <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-[700px] mx-4 max-h-[90vh] overflow-y-auto">
          <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Request Payment
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount Requested (USD)
            </label>
            <input
              type="number"
              min="1"
              max="10000"
              step="0.01"
              value={newRequest.amountRequested}              onChange={(e) => setNewRequest(prev => ({ ...prev, amountRequested: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter amount (1.00 - 10,000.00)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Deliverables
            </label>
            <select
              multiple
              value={newRequest.deliverableIds}              onChange={(e) => {
                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                setNewRequest(prev => ({ ...prev, deliverableIds: selectedOptions }));
              }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {deliverables.map(d => (
                <option key={d.deliverableId} value={d.deliverableId}>
                  {d.platform} - {d.link.substring(0, 50)}...
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <TextArea
              value={newRequest.notes}              onChange={(value) => setNewRequest(prev => ({ ...prev, notes: value }))}
              placeholder="Add any additional context for this payment request..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"              onClick={() => setShowNewRequestModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRequest}
              disabled={!newRequest.amountRequested || !newRequest.deliverableIds.length}            >
              Submit Request
            </Button>
          </div>
          </div>
        </div>
      </Modal>

      {/* Payment Request Details Modal */}
      <Modal
        isOpen={showDetailsModal}        onClose={() => setShowDetailsModal(false)}
      >
        <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-[700px] mx-4 max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Payment Request Details
          </h3>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Created Date
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {formatDate(selectedRequest.createdAt)}
                </p>
              </div>
            </div>

            {selectedRequest.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Your Notes
                </label>
                <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded">
                  {selectedRequest.notes}
                </p>
              </div>
            )}

            {selectedRequest.adminNotes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Admin Notes
                </label>
                <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded">
                  {selectedRequest.adminNotes}
                </p>
              </div>
            )}

            {selectedRequest.denialReason && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Denial Reason
                </label>
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                  {selectedRequest.denialReason}
                </p>
              </div>
            )}

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
                          variant="outline"                          onClick={() => {
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

            <div className="flex justify-end">
              <Button
                variant="outline"                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
        </div>
      </Modal>
    </div>
  );
} 