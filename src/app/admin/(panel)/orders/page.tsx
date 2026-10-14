"use client";

import { orders, formatPrice } from "@/lib/data";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { Search, Filter } from "lucide-react";
import Link from "next/link";

export default function OrdersPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-display-sm font-bold text-asur-white">Orders</h1>
          <p className="text-body-md text-asur-silver mt-1">
            Manage and track all orders
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-asur-slate" />
          <input
            type="text"
            placeholder="Search orders..."
            className="w-full bg-asur-carbon border border-asur-graphite pl-9 pr-4 py-2.5 text-body-sm text-asur-white placeholder:text-asur-slate focus:outline-none focus:border-asur-iron"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 border border-asur-graphite text-body-sm text-asur-silver hover:text-asur-white hover:border-asur-iron transition-colors">
          <Filter size={14} />
          Filter
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto no-scrollbar border-b border-asur-graphite">
        {["All", "Pending", "Processing", "Ready for Dispatch", "Dispatched", "Cancelled"].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2.5 text-body-sm whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === "All"
                ? "text-asur-white border-accent-primary"
                : "text-asur-slate hover:text-asur-silver border-transparent"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-asur-carbon border border-asur-graphite overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-asur-graphite">
                <th className="text-left px-5 py-3 text-caption text-asur-slate uppercase tracking-wider font-medium">
                  Order
                </th>
                <th className="text-left px-5 py-3 text-caption text-asur-slate uppercase tracking-wider font-medium">
                  Date
                </th>
                <th className="text-left px-5 py-3 text-caption text-asur-slate uppercase tracking-wider font-medium">
                  Customer
                </th>
                <th className="text-left px-5 py-3 text-caption text-asur-slate uppercase tracking-wider font-medium">
                  Items
                </th>
                <th className="text-left px-5 py-3 text-caption text-asur-slate uppercase tracking-wider font-medium">
                  Status
                </th>
                <th className="text-left px-5 py-3 text-caption text-asur-slate uppercase tracking-wider font-medium">
                  Payment
                </th>
                <th className="text-right px-5 py-3 text-caption text-asur-slate uppercase tracking-wider font-medium">
                  Total
                </th>
                <th className="text-right px-5 py-3 text-caption text-asur-slate uppercase tracking-wider font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-asur-graphite/50 hover:bg-asur-steel/10 transition-colors"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-body-sm text-asur-white hover:text-accent-primary font-medium"
                    >
                      #{order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-body-sm text-asur-silver">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-body-sm text-asur-white">
                        {order.customer.firstName} {order.customer.lastName}
                      </p>
                      <p className="text-caption text-asur-slate">{order.customer.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-body-sm text-asur-silver">
                    {order.items.reduce((acc, item) => acc + item.quantity, 0)} items
                  </td>
                  <td className="px-5 py-4">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-5 py-4">
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </td>
                  <td className="px-5 py-4 text-body-sm text-asur-white text-right font-medium">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-caption text-asur-silver hover:text-asur-white uppercase tracking-wider transition-colors"
                      >
                        View
                      </Link>
                      {(order.status === "processing" || order.status === "ready_for_dispatch") && (
                        <Link
                          href={`/admin/dispatch/${order.id}`}
                          className="text-caption text-accent-primary hover:text-accent-highlight uppercase tracking-wider transition-colors"
                        >
                          Dispatch
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
