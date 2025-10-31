
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  imageHint: string;
};

export type CartItem = Product & {
  quantity: number;
};

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type Location = {
  lat: number;
  lng: number;
};

export type Order = {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  location: Location;
  deliveryLocation?: Location;
  orderDate: string; // ISO 8601 format
  totalPrice: number;
  orderItems: OrderItem[];
  paymentScreenshotUrl?: string;
  status: 'awaiting_payment_verification' | 'payment_rejected' | 'pending' | 'approved' | 'rejected' | 'out_for_delivery' | 'delivered';
};
