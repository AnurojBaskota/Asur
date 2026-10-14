"use client";

import { useState, useRef, useEffect } from "react";
import { orders, formatPrice } from "@/lib/data";
import { Button } from "@/components/ui/Button";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { ScanLine, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DispatchPage() {
  // Show orders that need dispatch verification
  const dispatchableOrders = orders.filter(
    (o) => o.status === "processing" || o.status === "ready_for_dispatch"
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-display-sm font-bold text-asur-white">
          Dispatch Verification
        </h1>
        <p className="text-body-md text-asur-silver mt-1">
          Scan and verify order items before dispatch
        </p>
      </div>

      {/* Quick Scan */}
      <div className="mb-8 bg-asur-carbon border border-asur-graphite p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-accent-primary/20 flex items-center justify-center">
            <ScanLine size={16} className="text-accent-primary" />
          </div>
          <div>
            <h2 className="text-heading-sm font-medium text-asur-white">
              Quick Order Scan
            </h2>
            <p className="text-caption text-asur-slate">
              Enter an order number to start dispatch verification
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter order number (e.g. AS10294)"
            className="flex-1 max-w-sm bg-asur-graphite border border-asur-iron px-4 py-3 text-body-md text-asur-white placeholder:text-asur-slate focus:outline-none focus:border-accent-primary font-mono"
          />
          <Button>Start Verification</Button>
        </div>
      </div>

      {/* Orders Ready for Dispatch */}
      <div className="bg-asur-carbon border border-asur-graphite overflow-hidden">
        <div className="px-5 py-4 border-b border-asur-graphite">
          <h2 className="text-heading-sm font-medium text-asur-white">
            Orders Awaiting Dispatch ({dispatchableOrders.length})
          </h2>
        </div>
        <div className="divide-y divide-asur-graphite/50">
          {dispatchableOrders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between px-5 py-4 hover:bg-asur-steel/10 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-body-sm font-medium text-asur-white">
                    #{order.orderNumber}
                  </p>
                  <p className="text-caption text-asur-slate">
                    {order.customer.firstName} {order.customer.lastName} •{" "}
                    {order.items.reduce((acc, item) => acc + item.quantity, 0)} items
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <OrderStatusBadge status={order.status} />
                <span className="text-body-sm text-asur-silver font-medium">
                  {formatPrice(order.total)}
                </span>
                <Link href={`/admin/dispatch/${order.id}`}>
                  <Button variant="outline" size="sm">
                    <span className="flex items-center gap-2">
                      Verify
                      <ArrowRight size={12} />
                    </span>
                  </Button>
                </Link>
              </div>
            </div>
          ))}
          {dispatchableOrders.length === 0 && (
            <div className="px-5 py-10 text-center">
              <p className="text-body-md text-asur-silver">
                No orders pending dispatch verification
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
