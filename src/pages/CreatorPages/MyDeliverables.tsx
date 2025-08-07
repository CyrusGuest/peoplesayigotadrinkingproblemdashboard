import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
// import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { apiService, Deliverable } from "../../services/api";
import { showToast } from "../../utils/toast";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import { Modal } from "../../components/ui/modal";

const platforms = [
  { label: "Instagram", value: "instagram" },
  { label: "TikTok", value: "tiktok" },

];

export default function MyDeliverables() {
  // const { user } = useAuth();
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState(platforms[0].value);
  const [link, setLink] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Payment request modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [requestingPayment, setRequestingPayment] = useState(false);
  
  // Refresh stats state
  const [refreshingStats, setRefreshingStats] = useState<string | null>(null);

  useEffect(() => {
    loadDeliverables();
  }, []);

  const loadDeliverables = () => {
    setLoading(true);
    apiService.getDeliverables()
      .then(setDeliverables)
      .catch(() => showToast.error("Failed to load deliverables."))
      .finally(() => setLoading(false));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newDeliverable = await apiService.submitDeliverable(platform as 'tiktok' | 'instagram', link, title, description);
      setDeliverables([newDeliverable, ...deliverables]);
      showToast.success("Content submitted successfully!");
      setLink("");
      setTitle("");
      setDescription("");
      setPlatform(platforms[0].value);
      
      // Suggest payment request after successful submission
      setTimeout(() => {
        showToast.info("💰 Ready to get paid? Request payment for your content!");
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit deliverable.";
      showToast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestPayment = (deliverable: Deliverable) => {
    setSelectedDeliverable(deliverable);
    
    // Smart payment amount suggestion based on platform and performance
    const suggestedAmount = getSuggestedPaymentAmount(deliverable);
    setPaymentAmount(suggestedAmount.toString());
    setPaymentNotes(`Payment request for ${deliverable.platform} content: "${deliverable.title || 'Content'}"`);
    setShowPaymentModal(true);
  };

  const getSuggestedPaymentAmount = (deliverable: Deliverable): number => {
    // Base rates by platform
    const baseRates = {
      instagram: 50,
      tiktok: 40,
  
    };
    
    let baseAmount = baseRates[deliverable.platform] || 40;
    
    // Performance bonus calculation
    if (deliverable.stats) {
      const engagement = (deliverable.stats.likes || 0) + (deliverable.stats.comments || 0);
      const views = deliverable.stats.views || 1;
      const engagementRate = engagement / views;
      
      // High engagement bonus (>5% engagement rate)
      if (engagementRate > 0.05) {
        baseAmount += 20;
      }
      // Viral content bonus (>10K views)
      if (views > 10000) {
        baseAmount += 30;
      }
    }
    
    return Math.min(baseAmount, 200); // Cap at $200 for auto-suggestions
  };

  const submitPaymentRequest = async () => {
    if (!selectedDeliverable || !paymentAmount) {
      showToast.error("Please enter a payment amount");
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount < 1 || amount > 1000) {
      showToast.error("Payment amount must be between $1 and $1,000");
      return;
    }

    setRequestingPayment(true);
    try {
      await apiService.createPaymentRequest({
        amountRequested: amount,
        deliverableIds: [selectedDeliverable.deliverableId],
        notes: paymentNotes,
      });

      showToast.success(`Payment request for ${formatCurrency(amount)} submitted! 🎉`);
      setShowPaymentModal(false);
      setSelectedDeliverable(null);
      setPaymentAmount("");
      setPaymentNotes("");
      
      // Refresh deliverables to update payment status
      loadDeliverables();
    } catch (error) {
      console.error('Failed to create payment request:', error);
      showToast.error('Failed to submit payment request');
    } finally {
      setRequestingPayment(false);
    }
  };

  const handleRefreshStats = async (deliverable: Deliverable) => {
    // Check if platform is supported
    const supportedPlatforms = ['tiktok', 'instagram'];
    if (!supportedPlatforms.includes(deliverable.platform)) {
      showToast.error(`Statistics refresh not supported for ${deliverable.platform} content`);
      return;
    }

    try {
      setRefreshingStats(deliverable.deliverableId);
      await apiService.refreshDeliverableStats(deliverable.deliverableId);
      
      showToast.success('Stats refresh started! You can monitor progress in the sidebar.');
      
      // Optional: Refresh deliverables after a short delay to show updated stats
      setTimeout(() => {
        loadDeliverables();
      }, 2000);
      
    } catch (error) {
      console.error('Error refreshing stats:', error);
      showToast.error('Failed to start stats refresh. Please try again.');
    } finally {
      setRefreshingStats(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const hasPaymentRequest = () => {
    // This would ideally check against payment requests, but for now we'll use a simple heuristic
    // In a real app, you'd fetch payment requests and check if this deliverable has an active request
    return false; // Placeholder - you'd implement actual logic here
  };

  const getPerformanceLevel = (deliverable: Deliverable) => {
    if (!deliverable.stats) return null;
    
    const engagement = (deliverable.stats.likes || 0) + (deliverable.stats.comments || 0);
    const views = deliverable.stats.views || 1;
    const engagementRate = engagement / views;
    
    if (engagementRate > 0.05 || views > 10000) return "high";
    if (engagementRate > 0.02 || views > 1000) return "medium";
    return "low";
  };

  return (
    <>
      <PageMeta
        title="My Content | Frontline"
        description="Submit and manage your content"
      />
      <PageBreadcrumb pageTitle="My Content" />
      <div className="rounded-2xl border border-gray-200 bg-white md:ml-64 p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
          📤 Submit New Content
        </h3>
        <form onSubmit={handleSubmit} className="mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-white">Platform</label>
              <select
                className="rounded-lg border border-gray-300 px-3 py-2 w-full dark:bg-gray-900 dark:border-gray-700 dark:text-white text-gray-800"
                value={platform}
                onChange={e => setPlatform(e.target.value)}
                required
              >
                {platforms.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-white">Social Media Link</label>
              <input
                type="url"
                className="rounded-lg border border-gray-300 px-3 py-2 w-full dark:bg-gray-900 dark:border-gray-700 dark:text-white text-gray-800"
                placeholder="https://www.instagram.com/reel/..."
                value={link}
                onChange={e => setLink(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-white">Content Title/Caption</label>
            <input
              type="text"
              className="rounded-lg border border-gray-300 px-3 py-2 w-full dark:bg-gray-900 dark:border-gray-700 dark:text-white text-gray-800"
              placeholder="Enter the title or caption of your content..."
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-white">Additional Description (Optional)</label>
            <textarea
              className="rounded-lg border border-gray-300 px-3 py-2 w-full dark:bg-gray-900 dark:border-gray-700 dark:text-white text-gray-800"
              placeholder="Add any additional context or description..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-brand-500 text-white px-6 py-2 font-semibold shadow-theme-xs hover:bg-brand-600 disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "📤 Submit Content"}
            </button>
          </div>
        </form>

        <h4 className="text-md font-semibold text-gray-800 dark:text-white/90 mb-4">
          💰 Your Content & Earnings
        </h4>
        {loading ? (
          <div className="p-4 text-gray-500">Loading your content...</div>
        ) : deliverables.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">No content yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Submit your first piece of content above to start earning!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Content</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Performance</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Submitted</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Get Paid</th>
                </tr>
              </thead>
              <tbody>
                {deliverables.map(d => {
                  const performanceLevel = getPerformanceLevel(d);
                  const suggestedAmount = getSuggestedPaymentAmount(d);
                  
                  return (
                    <tr key={d.deliverableId} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="px-4 py-3 text-gray-800 dark:text-white">
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl mt-1">
                            {d.platform === 'tiktok' ? '🎵' : d.platform === 'instagram' ? '📷' : '🐦'}
                          </span>
                          <div className="min-w-0 flex-1">
                            {d.title && (
                              <p className="font-medium text-sm mb-1 line-clamp-2">{d.title}</p>
                            )}
                            <p className="text-xs text-gray-600 dark:text-gray-400 capitalize mb-1">
                              {d.platform}
                            </p>
                            <a 
                              href={d.link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-brand-500 underline text-xs hover:text-brand-600"
                            >
                              View Content →
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-800 dark:text-white">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-3 text-xs">
                            <span>👁️ {d.stats?.views?.toLocaleString() ?? '-'}</span>
                            <span>❤️ {d.stats?.likes?.toLocaleString() ?? '-'}</span>
                            <span>💬 {d.stats?.comments?.toLocaleString() ?? '-'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            {performanceLevel && (
                              <Badge 
                                size="sm" 
                                color={performanceLevel === 'high' ? 'success' : performanceLevel === 'medium' ? 'warning' : 'info'}
                              >
                                {performanceLevel === 'high' ? '🔥 Hot' : performanceLevel === 'medium' ? '📈 Good' : '👍 Okay'}
                              </Badge>
                            )}
                            <button
                              onClick={() => handleRefreshStats(d)}
                              disabled={refreshingStats === d.deliverableId}
                              className="text-xs text-brand-500 hover:text-brand-600 disabled:opacity-50 ml-2"
                              title="Refresh stats"
                            >
                              {refreshingStats === d.deliverableId ? '🔄' : '↻'}
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-800 dark:text-white text-sm">
                        {new Date(d.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {hasPaymentRequest() ? (
                          <Badge color="warning" size="sm">Payment Pending</Badge>
                        ) : (
                          <div className="space-y-2">
                            <Button
                              size="sm"
                              onClick={() => handleRequestPayment(d)}
                              className="w-full"
                            >
                              💰 Request {formatCurrency(suggestedAmount)}
                            </Button>
                            {performanceLevel === 'high' && (
                              <p className="text-xs text-green-600 dark:text-green-400">
                                🎉 High performance bonus!
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Payment Request Modal */}
        {showPaymentModal && selectedDeliverable && (
          <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)}>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                💰 Request Payment
              </h2>
              
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl">
                    {selectedDeliverable.platform === 'tiktok' ? '🎵' : selectedDeliverable.platform === 'instagram' ? '📷' : '🐦'}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedDeliverable.title || 'Your Content'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {selectedDeliverable.platform} • {new Date(selectedDeliverable.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {selectedDeliverable.stats && (
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>👁️ {selectedDeliverable.stats.views?.toLocaleString() ?? 0}</span>
                    <span>❤️ {selectedDeliverable.stats.likes?.toLocaleString() ?? 0}</span>
                    <span>💬 {selectedDeliverable.stats.comments?.toLocaleString() ?? 0}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-white">
                    Payment Amount
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    step="1"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 w-full dark:bg-gray-900 dark:border-gray-700 dark:text-white text-gray-800"
                    placeholder="Enter amount in USD"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    💡 Amount suggested based on platform and performance
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-white">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 w-full dark:bg-gray-900 dark:border-gray-700 dark:text-white text-gray-800"
                    placeholder="Add any notes about this payment request..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPaymentModal(false)}
                  disabled={requestingPayment}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={submitPaymentRequest}
                  disabled={requestingPayment || !paymentAmount}
                >
                  {requestingPayment ? 'Submitting...' : `Request ${formatCurrency(parseFloat(paymentAmount || '0'))}`}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </>
  );
} 