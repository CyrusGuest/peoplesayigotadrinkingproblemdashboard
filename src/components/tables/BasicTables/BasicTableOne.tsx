import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";

import Badge from "../../ui/badge/Badge";
import { useEffect, useState } from "react";
import { apiService, User } from "../../../services/api";
import { Link } from "react-router";

export default function BasicTableOne() {
  const [creators, setCreators] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiService.getAllUsers()
      .then(users => {
        // Filter to only show creators
        const creatorUsers = users.filter(user => user.role === 'creator');
        setCreators(creatorUsers);
      })
      .catch(() => setError("Failed to load creators."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="p-8 text-center text-gray-500">Loading creators...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="p-8 text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-b border-gray-100">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
              >
                Creator
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
              >
                Email
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
              >
                Role
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
              >
                Join Date
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
              >
                Status
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100">
            {creators.length === 0 ? (
              <TableRow>
                <TableCell className="px-5 py-8 text-center text-gray-500">
                  <div className="col-span-5">No creators found.</div>
                </TableCell>
              </TableRow>
            ) : (
              creators.map((creator) => (
                <TableRow className="cursor-pointer">
                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 overflow-hidden rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-600 font-medium text-sm">
                          {creator.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm">
                          {creator.name}
                        </span>
                        <span className="block text-gray-500 text-theme-xs">
                          ID: {creator.userId}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm">
                    {creator.email}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm">
                    <Badge
                      size="sm"
                      color="info"
                    >
                      {creator.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm">
                    {new Date(creator.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm">
                    <Badge
                      size="sm"
                      color="success"
                    >
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm">
                    <Link
                      to={`/creator/${creator.userId}`}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-brand-600 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100 hover:border-brand-300 transition-colors duration-200"
                    >
                      View Details
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
