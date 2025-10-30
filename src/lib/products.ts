import type { Product } from '@/lib/types';
import placeholderData from './placeholder-images.json';

const productsData: Omit<Product, 'imageUrl' | 'imageHint' | 'description' >[] = [
  { id: 'kuthu-vilakku', name: 'Kuthu Vilakku (குத்து விளக்கு)', price: 2500 },
  { id: 'pattu-saree', name: 'Pattu Saree (பட்டு சேலை)', price: 12500 },
  { id: 'manga-oorugai', name: 'Manga Oorugai (மாங்காய் ஊறுகாய்)', price: 250 },
  { id: 'kovil-mani', name: 'Kovil Mani (கோவில் மணி)', price: 1800 },
  { id: 'sandalwood-soap', name: 'Sandalwood Soap (சந்தன சோப்பு)', price: 120 },
  { id: 'malli-poo', name: 'Malli Poo String (மல்லி பூ)', price: 80 },
];

const allProducts: Product[] = productsData.map((p) => {
  const placeholder = placeholderData.placeholderImages.find(img => img.id === p.id);
  if (!placeholder) {
    // Fallback for safety, though it shouldn't be hit with current setup
    return {
        ...p,
        description: "Description not available.",
        imageUrl: "https://picsum.photos/seed/error/600/600",
        imageHint: "product image"
    }
  }
  return {
    ...p,
    description: placeholder.description,
    imageUrl: placeholder.imageUrl,
    imageHint: placeholder.imageHint,
  };
});


export const getProducts = async (): Promise<Product[]> => {
  // In a real app, you would fetch this from a database
  return Promise.resolve(allProducts);
};

export const getProductById = async (id: string): Promise<Product | undefined> => {
  // In a real app, you would fetch this from a database
  return Promise.resolve(allProducts.find((p) => p.id === id));
};
