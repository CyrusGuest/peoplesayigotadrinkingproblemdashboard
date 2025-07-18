import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

export default function AdminDashboard() {
  return (
    <>
      <PageMeta
        title="Admin Dashboard | Influencer Management"
        description="Admin dashboard for managing creators and campaigns"
      />
      <PageBreadcrumb pageTitle="Admin Dashboard" />
      
      <div className="rounded-2xl lg:ml-64 border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Admin Dashboard
        </h3>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Creators Management */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Creators Management
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Creators</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Active Creators</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Pending Approvals</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">0</span>
              </div>
            </div>
          </div>

          {/* Campaigns Overview */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Campaigns Overview
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Active Campaigns</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Completed Campaigns</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Budget</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">$0</span>
              </div>
            </div>
          </div>

          {/* Deliverables Tracking */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Deliverables Tracking
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Deliverables</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Pending Review</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Approved</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">0</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Quick Actions
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <button className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
              Add New Creator
            </button>
            <button className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
              Create Campaign
            </button>
            <button className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
              View Reports
            </button>
          </div>
        </div>
      </div>
    </>
  );
} 