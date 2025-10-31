'use client';

import { useState, useEffect } from 'react';
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
  price: z.coerce.number().min(0.01, 'Price must be a positive number'),
  image: z.any()
    .refine((files) => files?.length == 1, 'Image is required.')
    .refine((files) => files?.[0]?.size <= 5000000, `Max file size is 5MB.`)
    .refine(
      (files) => ['image/jpeg', 'image/png'].includes(files?.[0]?.type),
      'Only .jpg and .png formats are supported.'
    ),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function AddProductPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const storage = getStorage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
  });

  const imageFile = watch('image');

  useEffect(() => {
    let objectUrl: string | null = null;
    if (imageFile && imageFile.length > 0) {
      const file = imageFile[0];
      objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    } else {
      setImagePreview(null);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imageFile]);


  const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Database Error',
        description: 'Could not connect to the database. Please try again.',
      });
      return;
    }
    
    setIsLoading(true);
    const file = data.image[0] as File;

    try {
      // 1. Upload image to Firebase Storage
      const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      
      // 2. Get the download URL
      const imageUrl = await getDownloadURL(storageRef);
      
      // 3. Add product to Firestore
      await addDoc(collection(firestore, 'products'), {
        name: data.name,
        description: data.description,
        price: data.price,
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
          description: 'Could not save the product. Please try again.',
      });
    } finally {
      // This will run whether the try block succeeds or fails
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
                    <Input id="image" type="file" accept="image/png, image/jpeg" {...register('image')} />
                    {errors.image && <p className="text-sm text-destructive">{typeof errors.image.message === 'string' && errors.image.message}</p>}
                </div>
                
                {imagePreview && (
                    <div className="grid gap-2">
                        <Label>Image Preview</Label>
                        <Image src={imagePreview} alt="Product preview" width={100} height={100} className="rounded-md object-cover aspect-square" />
                    </div>
                )}

                <div className="flex justify-end gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/admin/products">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Adding Product...' : 'Add Product'}
                    </Button>
                </div>
            </form>
        </CardContent>
    </Card>
  );
}
