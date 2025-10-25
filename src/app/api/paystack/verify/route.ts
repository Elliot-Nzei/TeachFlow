
import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { firebaseConfig } from '@/firebase/config';
import { serviceAccount } from '@/firebase/service-account';

// Helper function to initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  if (admin.apps.length) {
    return;
  }
  try {
    if (process.env.FIREBASE_PROJECT_ID) {
      const creds = {
        ...serviceAccount,
        privateKey: serviceAccount.privateKey?.replace(/\\n/g, '\n')
      } as admin.ServiceAccount;
      
      if (!creds.projectId || !creds.clientEmail || !creds.privateKey) {
        throw new Error('Firebase Admin SDK service account credentials are not fully configured.');
      }
      admin.initializeApp({
        credential: admin.credential.cert(creds),
      });
    } else {
      admin.initializeApp(firebaseConfig);
      console.warn("Firebase Admin initialized with client config for local development.");
    }
  } catch (error: any) {
    console.error('Firebase Admin initialization error:', error.message);
    throw new Error(`Firebase initialization failed: ${error.message}`);
  }
}

async function getAdminUid(db: admin.firestore.Firestore): Promise<string | null> {
    const usersRef = db.collection('users');
    const adminQuery = usersRef.where('role', '==', 'admin').limit(1);
    const snapshot = await adminQuery.get();
    if (snapshot.empty) {
        return null;
    }
    return snapshot.docs[0].id;
}


export async function POST(req: NextRequest) {
  try {
    initializeFirebaseAdmin();
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Firebase initialization failed' }, 
      { status: 500 }
    );
  }

  const db = admin.firestore();
  let reference: string;
  let planId: string | undefined;
  let billingCycle: string | undefined;
  let userId: string | undefined;
  let isSubscription: boolean;
  let productId: string | undefined;
  let quantity: number = 1;
  let shippingAddress: any;
  
  try {
    const body = await req.json();
    reference = body.reference;
    planId = body.planId;
    billingCycle = body.billingCycle;
    userId = body.userId;
    isSubscription = body.isSubscription === true;
    productId = body.productId;
    quantity = body.quantity || 1;
    shippingAddress = body.shippingAddress;


    if (!reference) {
      throw new Error('Payment reference is required');
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: `Invalid request: ${error.message}` }, 
      { status: 400 }
    );
  }

  // 1. Verify transaction with Paystack
  let paystackData: any;
  try {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      throw new Error('Paystack secret key is not configured.');
    }
    
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
      },
    });

    paystackData = await response.json();

    if (!response.ok) {
      const externalError = paystackData?.message || 'Paystack API error occurred.';
      throw new Error(`Paystack API Error: ${externalError}`);
    }

    if (!paystackData.status || paystackData.data?.status !== 'success') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Payment verification failed. Payment status is not successful.',
          details: paystackData 
        }, 
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Paystack verification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Could not verify payment with Paystack.', 
        details: error.message,
        suggestion: 'If you are on Firebase Spark plan, please upgrade to Blaze plan to enable external API calls.'
      }, 
      { status: 500 }
    );
  }
  
  // 2. Handle data update based on payment type
  const adminUid = await getAdminUid(db);
  const userRef = userId ? db.collection('users').doc(userId) : null;
  let userData: admin.firestore.DocumentData | undefined;
  if(userRef) {
    const userDoc = await userRef.get();
    if(userDoc.exists) userData = userDoc.data();
  }

  if (isSubscription) {
    // Subscription payment - update user document
    if (!userId || !planId) {
      return NextResponse.json(
        { success: false, message: 'User ID and Plan ID are required for subscription.' }, 
        { status: 400 }
      );
    }
    if(!userRef || !userData) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }
    
    try {
      await userRef.update({
        plan: planId,
        subscriptionCycle: billingCycle || 'monthly',
        planStartDate: admin.firestore.FieldValue.serverTimestamp(),
        paymentReference: reference,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ success: true, message: 'Subscription activated successfully!' });
    } catch (error: any) {
      console.error('Subscription update error:', error);
      return NextResponse.json({ success: false, message: 'Failed to update subscription in database.', details: error.message }, { status: 500 });
    }
  } else {
    // Product purchase - decrement stock
    if (!productId) {
      return NextResponse.json({ success: false, message: 'Product ID is required for product purchase.' }, { status: 400 });
    }

    try {
      const productRef = db.collection('marketplace_products').doc(productId);
      const batch = db.batch();
      
      const productDoc = await productRef.get();
      if (!productDoc.exists) throw new Error("Product not found in database");
      
      const productData = productDoc.data();
      if (!productData) throw new Error("Product data is empty");
      
      const currentStock = productData.stock || 0;
      const category = productData.category;
      
      if (category === 'Physical Good') {
        if (currentStock < quantity) {
          throw new Error(`Insufficient stock. Available: ${currentStock}, Requested: ${quantity}`);
        }
        batch.update(productRef, {
          stock: admin.firestore.FieldValue.increment(-quantity),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      if (adminUid) {
        const saleRef = db.collection('users').doc(adminUid).collection('sales').doc();
        batch.set(saleRef, {
            productId,
            productName: productData.name,
            quantity,
            amount: paystackData.data.amount / 100,
            buyerId: userId,
            buyerName: userData?.name,
            buyerEmail: userData?.email,
            shippingAddress,
            status: 'completed',
            reference,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      
      if (userRef) {
        const purchaseRef = userRef.collection('purchases').doc();
        batch.set(purchaseRef, {
            productId,
            productName: productData.name,
            quantity,
            amount: paystackData.data.amount / 100,
            status: 'completed',
            reference,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();

      return NextResponse.json({ 
        success: true, 
        message: `Payment verified successfully! ${quantity > 1 ? `${quantity} items` : 'Item'} purchased.` 
      });

    } catch (error: any) {
      console.error('Stock/Purchase update error:', error);
      if (error.message.includes('Insufficient stock') || error.message.includes('not found')) {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: false, message: 'Failed to record purchase after payment verification.'}, { status: 500 });
    }
  }
}
