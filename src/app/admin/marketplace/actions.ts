
'use server';

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { serviceAccount } from '@/firebase/service-account';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Initialize Firebase Admin SDK
function initializeAdmin() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount)
    });
  }
  return {
    db: getFirestore(),
  };
}

const ProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'Product name must be at least 3 characters long.'),
  description: z.string().min(10, 'Description must be at least 10 characters long.'),
  price: z.coerce.number().min(0, 'Price cannot be negative.'),
  category: z.enum(['Digital Resource', 'Physical Good', 'Service']),
  status: z.enum(['active', 'archived']).default('active'),
  stock: z.coerce.number().min(0, 'Stock cannot be negative.'),
  imageUrl: z.string().url('Please enter a valid image URL.').optional().or(z.literal('')),
  locations: z.array(z.string()).optional(),
  sellerId: z.string(),
});

type ProductInput = z.infer<typeof ProductSchema>;

export async function upsertProduct(productData: ProductInput): Promise<{ success: boolean; error?: string }> {
  try {
    const { db } = initializeAdmin();
    
    const validatedData = ProductSchema.parse(productData);

    const { id, ...dataToSave } = validatedData;
    
    const productRef = id
      ? db.collection('marketplace_products').doc(id)
      : db.collection('marketplace_products').doc();

    const timestamp = Timestamp.now();
    
    if (id) {
        await productRef.update({
            ...dataToSave,
            updatedAt: timestamp,
        });
    } else {
         await productRef.set({
            ...dataToSave,
            createdAt: timestamp,
            updatedAt: timestamp,
        });
    }

    revalidatePath('/admin/marketplace');
    revalidatePath('/marketplace');
    return { success: true };

  } catch (error) {
    console.error("Error upserting product:", error);
    if (error instanceof z.ZodError) {
        return { success: false, error: error.errors.map(e => e.message).join(', ') };
    }
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: "An unknown error occurred." };
  }
}

export async function deleteProduct(productId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { db } = initializeAdmin();
        
        if (!productId) {
            throw new Error("Product ID is required for deletion.");
        }

        const productRef = db.collection('marketplace_products').doc(productId);
        await productRef.delete();

        revalidatePath('/admin/marketplace');
        revalidatePath('/marketplace');
        return { success: true };
        
    } catch (error) {
        console.error("Error deleting product:", error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: "An unknown error occurred while deleting the product." };
    }
}
