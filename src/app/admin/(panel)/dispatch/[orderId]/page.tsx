"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { orders, getVariantByBarcode } from "@/lib/data";
import { Button } from "@/components/ui/Button";
import { OrderItem, ScanResult } from "@/types";
import {
  ArrowLeft,
  ScanLine,
  Check,
  X,
  AlertTriangle,
  Package,
  Truck,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DispatchItemState {
  orderItem: OrderItem;
  scannedCount: number;
  verified: boolean;
}

export default function DispatchVerificationPage() {
  const params = useParams();
  const order = orders.find((o) => o.id === params.orderId);

  const [dispatchItems, setDispatchItems] = useState<DispatchItemState[]>([]);
  const [scanInput, setScanInput] = useState("");
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  const [isDispatched, setIsDispatched] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Initialize dispatch items from order
  useEffect(() => {
    if (order) {
      setDispatchItems(
        order.items.map((item) => ({
          orderItem: item,
          scannedCount: 0,
          verified: false,
        }))
      );
    }
  }, [order]);

  // Auto-focus scan input
  useEffect(() => {
    if (scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [lastScanResult]);

  // Check if all items are verified
  useEffect(() => {
    if (dispatchItems.length > 0) {
      const allVerified = dispatchItems.every((item) => item.verified);
      setIsVerified(allVerified);
    }
  }, [dispatchItems]);

  // Handle barcode scan
  const handleScan = useCallback(
    (barcode: string) => {
      if (!barcode.trim() || !order) return;

      const barcodeResult = getVariantByBarcode(barcode.trim());

      // Barcode not found in system
      if (!barcodeResult) {
        const result: ScanResult = {
          success: false,
          barcode,
          matchType: "not_found",
          message: "Barcode not found in system",
        };
        setLastScanResult(result);
        setScanHistory((prev) => [result, ...prev]);
        setScanInput("");
        return;
      }

      // Check if this barcode belongs to any item in the order
      const matchingItemIndex = dispatchItems.findIndex(
        (item) => item.orderItem.variantBarcode === barcode.trim()
      );

      if (matchingItemIndex === -1) {
        // Wrong item — barcode exists but doesn't belong to this order
        const result: ScanResult = {
          success: false,
          barcode,
          product: {
            name: barcodeResult.product.name,
            variant: `${barcodeResult.variant.size} / ${barcodeResult.variant.color.name}`,
            sku: barcodeResult.variant.sku,
          },
          matchType: "wrong_item",
          message: `This item does not belong to order #${order.orderNumber}`,
        };
        setLastScanResult(result);
        setScanHistory((prev) => [result, ...prev]);
        setScanInput("");
        return;
      }

      const matchingItem = dispatchItems[matchingItemIndex];

      // Check for duplicate scan (already fully verified)
      if (matchingItem.scannedCount >= matchingItem.orderItem.quantity) {
        const result: ScanResult = {
          success: false,
          barcode,
          product: {
            name: barcodeResult.product.name,
            variant: `${barcodeResult.variant.size} / ${barcodeResult.variant.color.name}`,
            sku: barcodeResult.variant.sku,
          },
          matchType: "duplicate",
          message: "This item has already been fully scanned",
        };
        setLastScanResult(result);
        setScanHistory((prev) => [result, ...prev]);
        setScanInput("");
        return;
      }

      // Correct scan!
      const newScannedCount = matchingItem.scannedCount + 1;
      const isNowVerified = newScannedCount >= matchingItem.orderItem.quantity;

      setDispatchItems((prev) =>
        prev.map((item, idx) =>
          idx === matchingItemIndex
            ? { ...item, scannedCount: newScannedCount, verified: isNowVerified }
            : item
        )
      );

      const result: ScanResult = {
        success: true,
        barcode,
        product: {
          name: barcodeResult.product.name,
          variant: `${barcodeResult.variant.size} / ${barcodeResult.variant.color.name}`,
          sku: barcodeResult.variant.sku,
        },
        matchType: "correct",
        message: isNowVerified
          ? "Item verified ✓"
          : `Scanned ${newScannedCount}/${matchingItem.orderItem.quantity}`,
      };
      setLastScanResult(result);
      setScanHistory((prev) => [result, ...prev]);
      setScanInput("");
    },
    [dispatchItems, order]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && scanInput.trim()) {
      handleScan(scanInput);
    }
  };

  const handleDispatch = () => {
    setIsDispatched(true);
  };

  const handleReset = () => {
    if (order) {
      setDispatchItems(
        order.items.map((item) => ({
          orderItem: item,
          scannedCount: 0,
          verified: false,
        }))
      );
      setLastScanResult(null);
      setScanHistory([]);
      setIsVerified(false);
      setIsDispatched(false);
    }
  };

  if (!order) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-body-md text-asur-silver">Order not found</p>
      </div>
    );
  }

  if (isDispatched) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-status-success/10 border border-status-success/20 rounded-full flex items-center justify-center">
            <Truck size={28} className="text-status-success" />
          </div>
          <h2 className="text-display-sm font-bold text-asur-white mb-2">
            Order Dispatched
          </h2>
          <p className="text-body-md text-asur-silver mb-6">
            Order #{order.orderNumber} has been marked as dispatched.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/admin/dispatch">
              <Button variant="outline">Back to Dispatch</Button>
            </Link>
            <Link href="/admin/orders">
              <Button>View Orders</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/dispatch"
          className="p-2 text-asur-silver hover:text-asur-white transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-display-sm font-bold text-asur-white">
            Dispatch Verification — #{order.orderNumber}
          </h1>
          <p className="text-body-sm text-asur-silver mt-0.5">
            {order.customer.firstName} {order.customer.lastName} •{" "}
            {order.items.reduce((acc, item) => acc + item.quantity, 0)} items to
            verify
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <span className="flex items-center gap-2">
            <RefreshCw size={14} />
            Reset
          </span>
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Scanner & Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scanner Input */}
          <div className="bg-asur-carbon border border-accent-primary/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-accent-primary/20 flex items-center justify-center animate-pulse">
                <ScanLine size={16} className="text-accent-primary" />
              </div>
              <div>
                <h2 className="text-heading-sm font-medium text-asur-white">
                  Scanner Active
                </h2>
                <p className="text-caption text-asur-slate">
                  Scan product barcodes to verify order items
                </p>
              </div>
            </div>

            <input
              ref={scanInputRef}
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Scan barcode or enter manually..."
              className="w-full bg-asur-graphite border border-accent-primary/50 px-4 py-4 text-heading-sm text-asur-white placeholder:text-asur-slate focus:outline-none focus:border-accent-primary font-mono text-center tracking-wider"
              autoFocus
            />
          </div>

          {/* Last Scan Result */}
          {lastScanResult && (
            <div
              className={cn(
                "p-5 border transition-all animate-scale-in",
                lastScanResult.matchType === "correct"
                  ? "bg-status-success/5 border-status-success/30"
                  : lastScanResult.matchType === "wrong_item"
                  ? "bg-status-error/5 border-status-error/30"
                  : lastScanResult.matchType === "duplicate"
                  ? "bg-status-warning/5 border-status-warning/30"
                  : "bg-status-error/5 border-status-error/30"
              )}
            >
              <div className="flex items-start gap-3">
                {lastScanResult.matchType === "correct" ? (
                  <Check size={20} className="text-status-success mt-0.5" />
                ) : lastScanResult.matchType === "duplicate" ? (
                  <AlertTriangle size={20} className="text-status-warning mt-0.5" />
                ) : (
                  <X size={20} className="text-status-error mt-0.5" />
                )}
                <div>
                  <p
                    className={cn(
                      "text-body-md font-medium",
                      lastScanResult.matchType === "correct"
                        ? "text-status-success"
                        : lastScanResult.matchType === "duplicate"
                        ? "text-status-warning"
                        : "text-status-error"
                    )}
                  >
                    {lastScanResult.matchType === "correct"
                      ? "✓ Correct Item"
                      : lastScanResult.matchType === "wrong_item"
                      ? "✗ Wrong Item!"
                      : lastScanResult.matchType === "duplicate"
                      ? "⚠ Duplicate Scan"
                      : "✗ Not Found"}
                  </p>
                  {lastScanResult.product && (
                    <p className="text-body-sm text-asur-white mt-1">
                      {lastScanResult.product.name} — {lastScanResult.product.variant}
                    </p>
                  )}
                  <p className="text-caption text-asur-slate mt-1">
                    {lastScanResult.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Scan History */}
          {scanHistory.length > 0 && (
            <div className="bg-asur-carbon border border-asur-graphite">
              <div className="px-5 py-3 border-b border-asur-graphite">
                <h3 className="text-body-sm font-medium text-asur-silver uppercase tracking-wider">
                  Scan History ({scanHistory.length})
                </h3>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {scanHistory.map((scan, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 px-5 py-2 border-b border-asur-graphite/30 last:border-0"
                  >
                    {scan.matchType === "correct" ? (
                      <Check size={12} className="text-status-success" />
                    ) : scan.matchType === "duplicate" ? (
                      <AlertTriangle size={12} className="text-status-warning" />
                    ) : (
                      <X size={12} className="text-status-error" />
                    )}
                    <span className="text-caption text-asur-silver font-mono">
                      {scan.barcode}
                    </span>
                    <span className="text-caption text-asur-slate">
                      {scan.product?.name || "Unknown"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Order Items Checklist */}
        <div className="space-y-6">
          {/* Verification Status */}
          <div
            className={cn(
              "p-5 border",
              isVerified
                ? "bg-status-success/5 border-status-success/30"
                : "bg-asur-carbon border-asur-graphite"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <Package size={16} className={isVerified ? "text-status-success" : "text-asur-slate"} />
              <h3 className="text-heading-sm font-medium text-asur-white">
                {isVerified ? "All Items Verified" : "Items to Verify"}
              </h3>
            </div>
            <p className="text-caption text-asur-slate mb-4">
              {dispatchItems.filter((i) => i.verified).length}/{dispatchItems.length}{" "}
              items verified
            </p>

            {/* Progress */}
            <div className="w-full h-1.5 bg-asur-graphite mb-4">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  isVerified ? "bg-status-success" : "bg-accent-primary"
                )}
                style={{
                  width: `${
                    (dispatchItems.filter((i) => i.verified).length /
                      dispatchItems.length) *
                    100
                  }%`,
                }}
              />
            </div>

            {/* Items List */}
            <div className="space-y-3">
              {dispatchItems.map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "p-3 border transition-colors",
                    item.verified
                      ? "bg-status-success/5 border-status-success/20"
                      : "bg-asur-graphite/50 border-asur-iron/50"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-body-sm font-medium text-asur-white">
                        {item.orderItem.productName}
                      </p>
                      <p className="text-caption text-asur-slate">
                        {item.orderItem.size} / {item.orderItem.color.name}
                      </p>
                      <p className="text-caption text-asur-slate font-mono mt-0.5">
                        {item.orderItem.variantBarcode}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "text-body-sm font-medium",
                            item.verified ? "text-status-success" : "text-asur-silver"
                          )}
                        >
                          {item.scannedCount}/{item.orderItem.quantity}
                        </span>
                        {item.verified && (
                          <Check size={14} className="text-status-success" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dispatch Button */}
          {isVerified && (
            <Button
              fullWidth
              size="lg"
              onClick={handleDispatch}
              className="bg-status-success hover:bg-status-success/90 text-white"
            >
              <span className="flex items-center gap-2">
                <Truck size={16} />
                Mark as Dispatched
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
