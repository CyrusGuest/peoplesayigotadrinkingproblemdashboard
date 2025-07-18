import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
// import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { apiService, Deliverable } from "../../services/api";

const platforms = [
  { label: "Instagram", value: "instagram" },
  { label: "TikTok", value: "tiktok" },
  { label: "Twitter", value: "twitter" },
];

export default function MyDeliverables() {
  // const { user } = useAuth();
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [platform, setPlatform] = useState(platforms[0].value);
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiService.getDeliverables()
      .then(setDeliverables)
      .catch(() => setError("Failed to load deliverables."))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const newDeliverable = await apiService.submitDeliverable(platform as any, link);
      setDeliverables([newDeliverable, ...deliverables]);
      setSuccess("Deliverable submitted successfully!");
      setLink("");
      setPlatform(platforms[0].value);
    } catch (err: any) {
      setError(err.message || "Failed to submit deliverable.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta
        title="My Deliverables | Influencer Management"
        description="Submit and track your deliverables."
      />
      <PageBreadcrumb pageTitle="My Deliverables" />
      <div className="rounded-2xl border border-gray-200 bg-white md:ml-64 p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
          Submit a New Deliverable
        </h3>
        <form onSubmit={handleSubmit} className="mb-8 flex flex-col gap-4 md:flex-row md:items-end">
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
          <div className="flex-1">
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
          <button
            type="submit"
            className="rounded-lg bg-brand-500 text-white px-6 py-2 font-semibold shadow-theme-xs hover:bg-brand-600 disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </form>
        {error && <div className="mb-4 text-red-500">{error}</div>}
        {success && <div className="mb-4 text-green-600">{success}</div>}
        <h4 className="text-md font-semibold text-gray-800 dark:text-white/90 mb-2">Your Deliverables</h4>
        {loading ? (
          <div className="p-4 text-gray-500">Loading...</div>
        ) : deliverables.length === 0 ? (
          <div className="p-4 text-gray-500">No deliverables submitted yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Platform</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Link</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Submitted At</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Views</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Likes</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Comments</th>
                </tr>
              </thead>
              <tbody>
                {deliverables.map(d => (
                  <tr key={d.deliverableId} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-2 capitalize text-gray-800 dark:text-white">{d.platform}</td>
                    <td className="px-4 py-2 text-gray-800 dark:text-white">
                      <a href={d.link} target="_blank" rel="noopener noreferrer" className="text-brand-500 underline break-all">
                        {d.link}
                      </a>
                    </td>
                    <td className="px-4 py-2 text-gray-800 dark:text-white">{new Date(d.submittedAt).toLocaleString()}</td>
                    <td className="px-4 py-2 text-gray-800 dark:text-white">{d.stats?.views ?? '-'}</td>
                    <td className="px-4 py-2 text-gray-800 dark:text-white">{d.stats?.likes ?? '-'}</td>
                    <td className="px-4 py-2 text-gray-800 dark:text-white">{d.stats?.comments ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
} 