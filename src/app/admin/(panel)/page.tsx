"use client";

import { dashboardMetrics, orders, products, formatPrice } from "@/lib/data";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import {
  TrendingUp,
  ShoppingCart,
  Clock,
  Truck,
  AlertTriangle,
  DollarSign,
  Package,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const metrics = dashboardMetrics;

  const metricCards = [
    {
      label: "Revenue This Month",
      value: formatPrice(metrics.revenueThisMonth),
      change: `+${metrics.revenueChange}%`,
      icon: DollarSign,
      color: "text-status-success",
    },
    {
      label: "Today's Orders",
      value: metrics.todaysOrders.toString(),
      sub: formatPrice(metrics.revenueToday) + " revenue",
      icon: ShoppingCart,
      color: "text-status-info",
    },
    {
      label: "Pending Orders",
      value: metrics.pendingOrders.toString(),
      sub: "Awaiting processing",
      icon: Clock,
      color: "text-status-warning",
    },
    {
      label: "Ready for Dispatch",
      value: metrics.readyForDispatch.toString(),
      sub: "Verified & packed",
      icon: Truck,
      color: "text-accent-primary",
    },
    {
      label: "Low Stock Items",
      value: metrics.lowStockProducts.toString(),
      sub: "Need restocking",
      icon: AlertTriangle,
      color: "text-status-error",
    },
    {
      label: "Inventory Value",
      value: formatPrice(metrics.inventoryValue),
      sub: `${products.reduce((acc, p) => acc + p.variants.length, 0)} variants`,
      icon: Package,
      color: "text-asur-silver",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-display-sm font-bold text-asur-white">Dashboard</h1>
        <p className="text-body-md text-asur-silver mt-1">
          Overview of your store performance
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="bg-asur-carbon border border-asur-graphite p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-caption text-asur-slate uppercase tracking-wider">
                    {metric.label}
                  </p>
                  <p className="text-heading-lg font-bold text-asur-white mt-1">
                    {metric.value}
                  </p>
                  {metric.change && (
                    <p className="text-caption text-status-success mt-1 flex items-center gap-1">
                      <TrendingUp size={12} />
                      {metric.change} from last month
                    </p>
                  )}
                  {metric.sub && !metric.change && (
                    <p className="text-caption text-asur-slate mt-1">{metric.sub}</p>
                  )}
                </div>
                <div className={`p-2 bg-asur-steel/50 ${metric.color}`}>
                  <Icon size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders & Best Sellers */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-asur-carbon border border-asur-graphite">
          <div className="flex items-center justify-between px-5 py-4 border-b border-asur-graphite">
            <h2 className="text-heading-sm font-medium text-asur-white">
              Recent Orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-caption text-asur-silver hover:text-accent-primary transition-colors uppercase tracking-wider flex items-center gap-1"
            >
              View All <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-asur-graphite">
                  <th className="text-left px-5 py-3 text-caption text-asur-slate uppercase tracking-wider font-medium">
                    Order
                  </th>
                  <th className="text-left px-5 py-3 text-caption text-asur-slate uppercase tracking-wider font-medium">
                    Customer
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
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-asur-graphite/50 hover:bg-asur-steel/20 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-body-sm text-asur-white hover:text-accent-primary font-medium"
                      >
                        #{order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-body-sm text-asur-silver">
                      {order.customer.firstName} {order.customer.lastName}
                    </td>
                    <td className="px-5 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3">
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </td>
                    <td className="px-5 py-3 text-body-sm text-asur-white text-right font-medium">
                      {formatPrice(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Best Sellers */}
        <div className="bg-asur-carbon border border-asur-graphite">
          <div className="px-5 py-4 border-b border-asur-graphite">
            <h2 className="text-heading-sm font-medium text-asur-white">
              Best Sellers
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {products
              .filter((p) => p.tags.includes("bestseller"))
              .map((product, idx) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 py-2"
                >
                  <span className="w-6 h-6 flex items-center justify-center text-caption text-asur-slate bg-asur-steel/50">
                    {idx + 1}
                  </span>
                  <div className="w-10 h-12 bg-asur-graphite flex-shrink-0 flex items-center justify-center">
                    <span className="text-[8px] text-asur-slate">A</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm text-asur-white truncate">
                      {product.name}
                    </p>
                    <p className="text-caption text-asur-slate">
                      {formatPrice(product.variants[0].price)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
