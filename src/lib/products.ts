import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { getSdks } from '@/firebase'; // Using a server-side initialized instance

// This function should be used in Server Components to fetch products.
// It initializes a temporary connection to fetch data.
export const getProducts = async (): Promise<Product[]> => {
  try {
    const { firestore } = getSdks();
    const productsCollection = collection(firestore, 'products');
    const productsSnapshot = await getDocs(productsCollection);
    const productsList = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    return productsList;
  } catch (error) {
    console.error("Error fetching products:", error);
    return []; // Return empty array on error
  }
};

export const getProductById = async (id: string): Promise<Product | undefined> => {
  try {
    const { firestore } = getSdks();
    const productDoc = doc(firestore, 'products', id);
    const productSnapshot = await getDoc(productDoc);

    if (productSnapshot.exists()) {
      return { id: productSnapshot.id, ...productSnapshot.data() } as Product;
    }
    return undefined;
  } catch (error) {
    console.error(`Error fetching product with ID ${id}:`, error);
    return undefined;
  }
};
