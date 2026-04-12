"use client";

import { useState } from "react";
import type { UserResponse } from "@/types";
import { useAdminUsers } from "@/hooks/useApi";
import { adminApi } from "@/lib/api";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Pagination } from "@/components/common/Pagination";
import { formatDate } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/hooks/useApi";
import { toast } from "sonner";
import { ShieldCheck, ShieldOff, User, Users, UserCheck, UserX } from "lucide-react";

export default function AdminUsersPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useAdminUsers(page);
  const qc = useQueryClient();
  const [toggling, setToggling] = useState<string | null>(null);

  const users = (data?.content || []).map((user) => {
    const isAdmin = user.roles.includes("ROLE_ADMIN");
    return {
      ...user,
      isActive: isAdmin ? true : user.isActive,
    };
  });

  const totalUsers = data?.totalElements || 0;
  const activeUsers = users.filter((user) => user.isActive).length;
  const disabledUsers = users.filter((user) => !user.isActive).length;

  const handleToggle = async (userId: string, currentStatus: boolean) => {
    setToggling(userId);
    try {
      const response = await adminApi.toggleUserStatus(userId);
      const updatedUser = response.data.data;

      qc.setQueryData(QUERY_KEYS.adminUsers(page), (current: typeof data | undefined) => {
        if (!current) return current;

        return {
          ...current,
          content: current.content.map((user: UserResponse) =>
            user.id === userId ? updatedUser : user
          ),
        };
      });

      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(`User ${currentStatus ? "disabled" : "enabled"} successfully`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update user status");
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_32%),linear-gradient(135deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Customer Access</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Users</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage customer access, monitor account status and keep admin control simple and secure.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
            {totalUsers} total users
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">All users</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{totalUsers}</p>
              </div>
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{activeUsers}</p>
              </div>
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <UserCheck className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Disabled</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{disabledUsers}</p>
              </div>
              <div className="rounded-2xl bg-rose-100 p-3 text-rose-700">
                <UserX className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {isLoading ? (
        <LoadingSpinner />
      ) : !data || users.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No users found</div>
      ) : (
        <>
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left p-4 font-medium text-slate-500">User</th>
                    <th className="text-left p-4 font-medium text-slate-500">Role</th>
                    <th className="text-left p-4 font-medium text-slate-500">Joined</th>
                    <th className="text-left p-4 font-medium text-slate-500">Status</th>
                    <th className="text-left p-4 font-medium text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-xs font-bold text-blue-700">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.roles.includes("ROLE_ADMIN")
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        }`}>
                          {user.roles.includes("ROLE_ADMIN") ? (
                            <><ShieldCheck className="h-3 w-3" /> Admin</>
                          ) : (
                            <><User className="h-3 w-3" /> User</>
                          )}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                        }`}>
                          {user.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="p-4">
                        {!user.roles.includes("ROLE_ADMIN") && (
                          <button
                            onClick={() => handleToggle(user.id, user.isActive)}
                            disabled={toggling === user.id}
                            className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-50 font-medium ${
                              user.isActive
                                ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50"
                                : "bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-950/50"
                            }`}
                          >
                            {toggling === user.id ? (
                              <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : user.isActive ? (
                              <><ShieldOff className="h-3 w-3" /> Disable</>
                            ) : (
                              <><ShieldCheck className="h-3 w-3" /> Enable</>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
