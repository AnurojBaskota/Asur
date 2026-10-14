// ===================================
// ASUR E-Commerce Type Definitions
// ===================================

// Product Types
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ProductCategory;
  categoryName?: string;
  collection?: string;
  material: string;
  careInstructions: string;
  fit: "Slim" | "Regular" | "Oversized" | "Compression";
  weight?: string;
  gender: "Men" | "Women" | "Unisex";
  tags: string[];
  variants: ProductVariant[];
  images: ProductImage[];
  featured: boolean;
  isNew: boolean;
  status: "active" | "draft" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  barcode: string;
  size: ProductSize;
  color: ProductColor;
  price: number;
  salePrice?: number;
  costPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  weight?: number;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  position: number;
  isDefault: boolean;
}

export interface ProductColor {
  name: string;
  hex: string;
  swatch?: string;
}

export type ProductSize = "XS" | "S" | "M" | "L" | "XL" | "XXL" | "3XL";

// Categories are managed in the admin, so this is any category slug.
export type ProductCategory = string;

// Order Types
export interface Order {
  id: string;
  orderNumber: string;
  customer: Customer;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: Address;
  billingAddress: Address;
  notes?: string;
  dispatchVerification?: DispatchVerification;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantSku: string;
  variantBarcode: string;
  size: ProductSize;
  color: ProductColor;
  quantity: number;
  price: number;
  total: number;
  image?: string;
  scanned?: boolean;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "ready_for_dispatch"
  | "dispatched"
  | "delivered"
  | "cancelled"
  | "returned";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "partially_refunded";

// Customer Types
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
}

export interface Address {
  firstName: string;
  lastName: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

// Dispatch & Barcode Types
export interface DispatchVerification {
  orderId: string;
  items: DispatchItem[];
  status: "pending" | "in_progress" | "verified" | "dispatched";
  verifiedBy?: string;
  verifiedAt?: string;
  dispatchedAt?: string;
}

export interface DispatchItem {
  orderItemId: string;
  variantBarcode: string;
  requiredQuantity: number;
  scannedQuantity: number;
  verified: boolean;
  scannedAt?: string;
}

export interface ScanResult {
  success: boolean;
  barcode: string;
  product?: {
    name: string;
    variant: string;
    sku: string;
  };
  matchType: "correct" | "wrong_item" | "duplicate" | "not_found";
  message: string;
}

export interface BarcodeEntry {
  id: string;
  barcode: string;
  productId: string;
  variantId: string;
  productName: string;
  sku: string;
  size: ProductSize;
  color: ProductColor;
  generatedAt: string;
  lastScannedAt?: string;
  scanCount: number;
}

// Inventory Types
export interface InventoryRecord {
  id: string;
  variantId: string;
  productName: string;
  sku: string;
  barcode: string;
  size: ProductSize;
  color: ProductColor;
  previousQuantity: number;
  newQuantity: number;
  adjustmentType: "addition" | "removal" | "correction" | "sale" | "return";
  reason: string;
  adjustedBy: string;
  adjustedAt: string;
}

export interface StockAlert {
  variantId: string;
  productName: string;
  sku: string;
  currentStock: number;
  threshold: number;
  size: ProductSize;
  color: ProductColor;
}

// Admin Types
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "admin" | "manager" | "staff";
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
}

// Cart Types
export interface CartItem {
  productId: string;
  variantId: string;
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

// Dashboard Types
export interface DashboardMetrics {
  totalSales: number;
  todaysOrders: number;
  pendingOrders: number;
  readyForDispatch: number;
  dispatchedOrders: number;
  lowStockProducts: number;
  inventoryValue: number;
  revenueToday: number;
  revenueThisMonth: number;
  revenueChange: number;
}
