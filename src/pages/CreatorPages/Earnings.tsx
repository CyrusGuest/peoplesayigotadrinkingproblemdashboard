import React, { useState, useEffect } from 'react';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";
import { apiService, PaymentRequest, Deliverable } from "../../services/api";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import { showToast } from "../../utils/toast";

interface EarningsData {
  totalEarned: number;
  thisMonthEarned: number;
  pendingAmount: number;
  nextPayoutDate: string | null;
  monthlyBreakdown: Array<{
    month: string;
    amount: number;
    payments: number;
  }>;
  recentPayments: PaymentRequest[];
  performanceBonus: number;
}

export default function Earnings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);

  useEffect(() => {
    loadEarningsData();
  }, []);

  const loadEarningsData = async () => {
    try {
      setLoading(true);
      const [paymentRequests, deliverables] = await Promise.all([
        apiService.getPaymentRequests(),
        apiService.getDeliverables(),
      ]);

      // Calculate earnings metrics
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      // Total earned (paid requests)
      const paidRequests = paymentRequests.filter(pr => pr.status === 'paid');
      const totalEarned = paidRequests.reduce((sum, pr) => sum + pr.amountRequested, 0);

      // This month earned
      const thisMonthPaid = paidRequests.filter(pr => {
        const paymentDate = new Date(pr.createdAt);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
      });
      const thisMonthEarned = thisMonthPaid.reduce((sum, pr) => sum + pr.amountRequested, 0);

      // Pending amount
      const pendingRequests = paymentRequests.filter(pr => pr.status === 'pending' || pr.status === 'approved');
      const pendingAmount = pendingRequests.reduce((sum, pr) => sum + pr.amountRequested, 0);

      // Next payout date (estimate - typically 7-14 days for approved payments)
      const approvedRequests = paymentRequests.filter(pr => pr.status === 'approved');
      let nextPayoutDate = null;
      if (approvedRequests.length > 0) {
        const oldestApproved = approvedRequests.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )[0];
        const estimatedPayout = new Date(oldestApproved.createdAt);
        estimatedPayout.setDate(estimatedPayout.getDate() + 7); // 7 days processing time
        nextPayoutDate = estimatedPayout.toISOString();
      }

      // Monthly breakdown (last 6 months)
      const monthlyBreakdown = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(currentYear, currentMonth - i, 1);
        const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        const monthPayments = paidRequests.filter(pr => {
          const paymentDate = new Date(pr.createdAt);
          return paymentDate.getMonth() === monthDate.getMonth() && 
                 paymentDate.getFullYear() === monthDate.getFullYear();
        });
        
        monthlyBreakdown.push({
          month: monthName,
          amount: monthPayments.reduce((sum, pr) => sum + pr.amountRequested, 0),
          payments: monthPayments.length
        });
      }

      // Performance bonus calculation (based on content engagement)
      const totalEngagement = deliverables.reduce((sum, d) => 
        sum + (d.stats?.likes || 0) + (d.stats?.comments || 0), 0
      );
      const avgEngagement = deliverables.length > 0 ? totalEngagement / deliverables.length : 0;
      const performanceBonus = Math.round(avgEngagement * 0.01); // $0.01 per engagement point

      // Recent payments (last 5)
      const recentPayments = paymentRequests
        .filter(pr => pr.status === 'paid')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      setEarnings({
        totalEarned,
        thisMonthEarned,
        pendingAmount,
        nextPayoutDate,
        monthlyBreakdown,
        recentPayments,
        performanceBonus
      });

    } catch (error) {
      console.error('Failed to load earnings data:', error);
      showToast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntilPayout = (dateString: string) => {
    const payoutDate = new Date(dateString);
    const today = new Date();
    const diffTime = payoutDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (loading) {
    return (
      <>
        <PageMeta title="My Earnings | Frontline" description="Track your earnings and payments" />
        <PageBreadcrumb pageTitle="My Earnings" />
        <div className="flex items-center justify-center py-12 lg:ml-64">
          <div className="text-gray-500 dark:text-gray-400">Loading your earnings...</div>
        </div>
      </>
    );
  }

  if (!earnings) {
    return (
      <>
        <PageMeta title="My Earnings | Frontline" description="Track your earnings and payments" />
        <PageBreadcrumb pageTitle="My Earnings" />
        <div className="lg:ml-64 p-6">
          <div className="text-center py-8">
            <div className="text-red-500">Failed to load earnings data</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="My Earnings | Frontline" description="Track your earnings and payments" />
      <PageBreadcrumb pageTitle="My Earnings" />
      
      <div className="space-y-6 lg:ml-64 p-6">
        {/* Hero Earnings Card */}
        <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {formatCurrency(earnings.totalEarned)}
              </h1>
              <p className="text-green-100 text-lg">Total Earned</p>
              <p className="text-green-200 text-sm mt-1">
                🎉 You've earned {formatCurrency(earnings.thisMonthEarned)} this month!
              </p>
            </div>
            <div className="text-right">
              <div className="text-6xl opacity-20">💰</div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pending Money */}
          <ComponentCard title="">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {formatCurrency(earnings.pendingAmount)}
              </h3>
              <p className="text-orange-600 dark:text-orange-400 font-medium">Pending Payment</p>
              {earnings.nextPayoutDate && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Next payout in {getDaysUntilPayout(earnings.nextPayoutDate)} days
                </p>
              )}
            </div>
          </ComponentCard>

          {/* This Month */}
          <ComponentCard title="">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {formatCurrency(earnings.thisMonthEarned)}
              </h3>
              <p className="text-blue-600 dark:text-blue-400 font-medium">This Month</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Great work! Keep it up 🚀
              </p>
            </div>
          </ComponentCard>

          {/* Performance Bonus */}
          <ComponentCard title="">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {formatCurrency(earnings.performanceBonus)}
              </h3>
              <p className="text-purple-600 dark:text-purple-400 font-medium">Bonus Potential</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Based on engagement
              </p>
            </div>
          </ComponentCard>
        </div>

        {/* Quick Actions */}
        <ComponentCard title="Need Money Faster?">
          <div className="p-6">
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => window.location.href = '/payment-requests'}>
                💰 Request Payment
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/my-deliverables'}>
                📤 Submit More Content
              </Button>
              {earnings.pendingAmount > 0 && (
                <Button variant="outline" onClick={() => showToast.info('Contact support for payment status')}>
                  ❓ Check Payment Status
                </Button>
              )}
            </div>
          </div>
        </ComponentCard>

        {/* Monthly Breakdown */}
        <ComponentCard title="Monthly Earnings Breakdown">
          <div className="p-6">
            <div className="space-y-4">
              {earnings.monthlyBreakdown.map((month, index) => (
                <div key={month.month} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                        {month.month.split(' ')[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{month.month}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {month.payments} payment{month.payments !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(month.amount)}
                    </p>
                    {index === earnings.monthlyBreakdown.length - 1 && month.amount > 0 && (
                      <Badge color="success" size="sm">Current</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ComponentCard>

        {/* Recent Payments */}
        <ComponentCard title="Recent Payments">
          <div className="p-6">
            {earnings.recentPayments.length > 0 ? (
              <div className="space-y-3">
                {earnings.recentPayments.map((payment) => (
                  <div key={payment.requestId} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                        <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Payment Received
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(payment.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        +{formatCurrency(payment.amountRequested)}
                      </p>
                      <Badge color="success" size="sm">Paid</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">💸</div>
                <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">No payments yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Submit content and request payments to start earning!
                </p>
                <Button onClick={() => window.location.href = '/my-deliverables'}>
                  Submit Your First Content
                </Button>
              </div>
            )}
          </div>
        </ComponentCard>

        {/* Helpful Tips */}
        <ComponentCard title="💡 Earning Tips">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">📈 Boost Your Earnings</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  High-engagement content can earn performance bonuses. Focus on content that gets lots of likes and comments!
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">⚡ Faster Payments</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Submit payment requests right after posting content. Payments typically process within 7-14 days.
                </p>
              </div>
            </div>
          </div>
        </ComponentCard>
      </div>
    </>
  );
} 