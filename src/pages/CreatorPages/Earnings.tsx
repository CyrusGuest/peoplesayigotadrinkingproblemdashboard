import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";

export default function Earnings() {
  const { user } = useAuth();

  return (
    <>
      <PageMeta
        title="Earnings | Influencer Management"
        description="View your earnings as a creator."
      />
      <PageBreadcrumb pageTitle="Earnings" />
      <div className="rounded-2xl border border-gray-200 bg-white md:ml-64 p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
          Earnings Overview
        </h3>
        {/* Placeholder for earnings summary and details */}
        <div className="p-4 border border-gray-200 rounded-lg bg-white dark:bg-gray-900/20">
          <p className="text-gray-500 dark:text-gray-400">Earnings details will appear here.</p>
        </div>
      </div>
    </>
  );
} 