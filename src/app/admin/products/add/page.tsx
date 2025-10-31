'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore } from '@/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { ArrowLeft, Loader2, Upload } from 'lucide-react';
import Image from 'next/image';

const productSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function AddProductPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const storage = getStorage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
    if (!imageFile) {
        toast({
            variant: 'destructive',
            title: 'Image Required',
            description: 'Please upload a product image.',
        });
        return;
    }
    if (!firestore) {
        toast({
            variant: 'destructive',
            title: 'Database Error',
            description: 'Could not connect to the database. Please try again.',
        });
        return;
    }

    setIsLoading(true);

    try {
        // 1. Upload image to Firebase Storage
        const imageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        const imageUrl = await getDownloadURL(imageRef);

        // 2. Add product to Firestore
        await addDoc(collection(firestore, 'products'), {
            ...data,
            imageUrl,
            createdAt: serverTimestamp(),
        });

        toast({
            title: 'Product Added!',
            description: `${data.name} has been added to your store.`,
        });

        router.push('/admin/products');

    } catch (error) {
        console.error("Error adding product:", error);
        toast({
            variant: 'destructive',
            title: 'Uh oh! Something went wrong.',
            description: 'Could not add the product. Please try again.',
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
        <CardHeader>
            <div className="flex items-center gap-4 mb-2">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin/products">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back to Products</span>
                    </Link>
                </Button>
                <div>
                    <CardTitle>Add New Product</CardTitle>
                    <CardDescription>Fill in the details for the new product.</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input id="name" {...register('name')} placeholder="e.g., Kuthu Vilakku" />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" {...register('description')} placeholder="Describe the product..." />
                    {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="price">Price (INR)</Label>
                    <Input id="price" type="number" step="0.01" {...register('price')} placeholder="e.g., 2500" />
                    {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="image">Product Image</Label>
                     <div className="flex items-center gap-4">
                        {imagePreview ? (
                             <Image src={imagePreview} alt="Product preview" width={80} height={80} className="rounded-md object-cover aspect-square" />
                        ) : (
                            <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center">
                                <Upload className="h-8 w-8 text-muted-foreground" />
                            </div>
                        )}
                        <Input id="image" type="file" accept="image/png, image/jpeg" onChange={handleImageChange} className="flex-1" />
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/admin/products">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Adding...' : 'Add Product'}
                    </Button>
                </div>
            </form>
        </CardContent>
    </Card>
  );
}
