export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  stock: number;
}

export interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}
