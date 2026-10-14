"use client";

import { useParams } from "next/navigation";
import { orders, formatPrice } from "@/lib/data";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Printer, Truck, Package } from "lucide-react";
import Link from "next/link";

export default function OrderDetailPage() {
  const params = useParams();
  const order = orders.find((o) => o.id === params.id);

  if (!order) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-body-md text-asur-silver">Order not found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/orders"
          className="p-2 text-asur-silver hover:text-asur-white transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-display-sm font-bold text-asur-white">
              Order #{order.orderNumber}
            </h1>
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
          <p className="text-body-sm text-asur-silver mt-1">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <span className="flex items-center gap-2">
              <Printer size={14} />
              Print Slip
            </span>
          </Button>
          {order.status === "processing" && (
            <Link href={`/admin/dispatch/${order.id}`}>
              <Button size="sm">
                <span className="flex items-center gap-2">
                  <Truck size={14} />
                  Start Dispatch
                </span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-asur-carbon border border-asur-graphite">
            <div className="px-5 py-4 border-b border-asur-graphite flex items-center gap-2">
              <Package size={16} className="text-asur-slate" />
              <h2 className="text-heading-sm font-medium text-asur-white">
                Order Items
              </h2>
            </div>
            <div className="divide-y divide-asur-graphite/50">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-14 h-16 bg-asur-graphite flex-shrink-0 flex items-center justify-center">
                    <span className="text-[9px] text-asur-slate">ASUR</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-asur-white">
                      {item.productName}
                    </p>
                    <p className="text-caption text-asur-slate mt-0.5">
                      Size: {item.size} • Color: {item.color.name} • SKU: {item.variantSku}
                    </p>
                    <p className="text-caption text-asur-slate">
                      Barcode: {item.variantBarcode}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-body-sm text-asur-white font-medium">
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                    <p className="text-body-sm text-asur-silver">
                      {formatPrice(item.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Totals */}
            <div className="px-5 py-4 border-t border-asur-graphite space-y-2">
              <div className="flex justify-between text-body-sm">
                <span className="text-asur-silver">Subtotal</span>
                <span className="text-asur-white">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-body-sm">
                <span className="text-asur-silver">Shipping</span>
                <span className="text-asur-white">
                  {order.shippingCost === 0 ? "Free" : formatPrice(order.shippingCost)}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-body-sm">
                  <span className="text-asur-silver">Discount</span>
                  <span className="text-status-success">-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-body-md font-medium pt-2 border-t border-asur-graphite">
                <span className="text-asur-white">Total</span>
                <span className="text-asur-white">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Dispatch Verification Status */}
          {order.dispatchVerification && (
            <div className="bg-asur-carbon border border-asur-graphite">
              <div className="px-5 py-4 border-b border-asur-graphite">
                <h2 className="text-heading-sm font-medium text-asur-white">
                  Dispatch Verification
                </h2>
              </div>
              <div className="px-5 py-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-asur-graphite">
                        <th className="text-left py-2 text-caption text-asur-slate uppercase tracking-wider">Product</th>
                        <th className="text-center py-2 text-caption text-asur-slate uppercase tracking-wider">Required</th>
                        <th className="text-center py-2 text-caption text-asur-slate uppercase tracking-wider">Scanned</th>
                        <th className="text-center py-2 text-caption text-asur-slate uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.dispatchVerification.items.map((dItem) => {
                        const orderItem = order.items.find((oi) => oi.id === dItem.orderItemId);
                        return (
                          <tr key={dItem.orderItemId} className="border-b border-asur-graphite/50">
                            <td className="py-2 text-body-sm text-asur-white">
                              {orderItem?.productName} ({orderItem?.size}/{orderItem?.color.name})
                            </td>
                            <td className="py-2 text-center text-body-sm text-asur-silver">
                              {dItem.requiredQuantity}
                            </td>
                            <td className="py-2 text-center text-body-sm text-asur-silver">
                              {dItem.scannedQuantity}
                            </td>
                            <td className="py-2 text-center">
                              {dItem.verified ? (
                                <span className="text-caption text-status-success">✓ Verified</span>
                              ) : (
                                <span className="text-caption text-status-warning">Pending</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-3 bg-status-success/10 border border-status-success/20">
                  <p className="text-body-sm text-status-success font-medium">
                    ✓ All items verified — Ready for Dispatch
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-asur-carbon border border-asur-graphite p-5">
            <h3 className="text-body-sm font-medium text-asur-white uppercase tracking-wider mb-3">
              Customer
            </h3>
            <p className="text-body-sm text-asur-white">
              {order.customer.firstName} {order.customer.lastName}
            </p>
            <p className="text-caption text-asur-slate">{order.customer.email}</p>
            <p className="text-caption text-asur-slate">{order.customer.phone}</p>
            <p className="text-caption text-asur-slate mt-2">
              {order.customer.totalOrders} orders • {formatPrice(order.customer.totalSpent)} total spent
            </p>
          </div>

          {/* Shipping Address */}
          <div className="bg-asur-carbon border border-asur-graphite p-5">
            <h3 className="text-body-sm font-medium text-asur-white uppercase tracking-wider mb-3">
              Shipping Address
            </h3>
            <div className="text-body-sm text-asur-silver space-y-0.5">
              <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
              <p>{order.shippingAddress.street}</p>
              {order.shippingAddress.apartment && <p>{order.shippingAddress.apartment}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.country}</p>
              <p className="pt-1 text-asur-slate">{order.shippingAddress.phone}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-asur-carbon border border-asur-graphite p-5">
            <h3 className="text-body-sm font-medium text-asur-white uppercase tracking-wider mb-3">
              Actions
            </h3>
            <div className="space-y-2">
              {order.status === "pending" && (
                <Button variant="primary" size="sm" fullWidth>
                  Confirm Order
                </Button>
              )}
              {order.status === "confirmed" && (
                <Button variant="primary" size="sm" fullWidth>
                  Start Processing
                </Button>
              )}
              {order.status === "processing" && (
                <Link href={`/admin/dispatch/${order.id}`} className="block">
                  <Button variant="primary" size="sm" fullWidth>
                    Start Dispatch Verification
                  </Button>
                </Link>
              )}
              {order.status === "ready_for_dispatch" && (
                <Button variant="primary" size="sm" fullWidth>
                  Mark as Dispatched
                </Button>
              )}
              <Button variant="outline" size="sm" fullWidth>
                Print Packing Slip
              </Button>
              {order.status !== "cancelled" && order.status !== "delivered" && (
                <Button variant="danger" size="sm" fullWidth>
                  Cancel Order
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
