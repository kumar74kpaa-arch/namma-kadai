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

export type Order = {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  orderDate: string; // ISO 8601 format
  totalPrice: number;
  orderItems: OrderItem[];
  status: 'pending' | 'approved' | 'rejected';
};
