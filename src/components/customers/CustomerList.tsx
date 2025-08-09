"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import {
  EyeIcon,
  PencilIcon,
  WrenchIcon,
} from "@heroicons/react/24/outline";
import { Customer } from "@/data/mockCustomers";

const PAGE_SIZE = 5;

export default function CustomerList() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        sort,
        order,
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      const res = await fetch(`/api/customers?${params.toString()}`);
      const data = await res.json();
      setCustomers(data.customers);
      setTotalPages(data.totalPages || 1);
      setLoading(false);
    };
    load();
  }, [search, sort, order, page]);

  const handleSort = (field: string) => {
    if (sort === field) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(field);
      setOrder("asc");
    }
  };

  const handleView = async (id: string) => {
    await fetch(`/api/customers/${id}`);
  };

  const handleEdit = async (id: string) => {
    await fetch(`/api/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify({}),
    });
  };

  const handleManage = async (id: string) => {
    await fetch(`/api/customers/${id}/manage`, {
      method: "POST",
      body: JSON.stringify({ action: "demo" }),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <Button onClick={() => router.push("/customers/manage")}>New Customer</Button>
        </div>

        <div className="bg-white p-4 rounded-md shadow-sm mb-4">
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="bg-white rounded-md shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("name")}
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("current_arr")}
                >
                  ARR
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("renewal_date")}
                >
                  Next Renewal
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("health_score")}
                >
                  Health Score
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("usage")}
                >
                  Usage %
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("nps_score")}
                >
                  NPS
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap">{c.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap">${c.current_arr.toLocaleString()}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{c.renewal_date}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{c.health_score}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{c.usage}%</td>
                    <td className="px-4 py-2 whitespace-nowrap">{c.nps_score}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(c.id)}
                          className="text-blue-600 hover:text-blue-800"
                          aria-label="View"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(c.id)}
                          className="text-green-600 hover:text-green-800"
                          aria-label="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleManage(c.id)}
                          className="text-gray-600 hover:text-gray-800"
                          aria-label="Manage"
                        >
                          <WrenchIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-4">
          <Button
            variant="secondary"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-700">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
} 