
import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { firebaseConfig } from '@/firebase/config';
import { serviceAccount } from '@/firebase/service-account';
import dotenv from 'dotenv';

dotenv.config();

// Helper function to initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  if (admin.apps.length) {
    return;
  }
  try {
    // For production (e.g., Firebase App Hosting), service account details
    // might be available in environment variables.
    if (process.env.FIREBASE_PROJECT_ID) {
      const creds = {
        ...serviceAccount,
        privateKey: serviceAccount.privateKey?.replace(/\\n/g, '\n')
      } as admin.ServiceAccount;
      
      if (!creds.projectId || !creds.clientEmail || !creds.privateKey) {
          throw new Error('Firebase Admin SDK service account credentials are not fully configured in environment variables.');
      }
      admin.initializeApp({
        credential: admin.credential.cert(creds),
      });
    } else {
        // For local development, fall back to the firebaseConfig object.
        // This won't have admin privileges but allows the app to run.
        // Note: Admin-only server actions might fail locally if not configured with a real service account.
        admin.initializeApp(firebaseConfig);
        console.warn("Firebase Admin initialized with client config for local development. Admin privileges are not available.");
    }
  } catch (error: any) {
    console.error('Firebase Admin initialization error:', error.message);
    throw new Error(`Firebase initialization failed: ${error.message}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    initializeFirebaseAdmin();
  } catch (error) {
    if (error instanceof Error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: false, message: 'An unknown error occurred during Firebase initialization.' }, { status: 500 });
  }

  const db = admin.firestore();
  let reference, planId, billingCycle, userId, isSubscription, productId;
  
  try {
    const body = await req.json();
    reference = body.reference;
    planId = body.planId;
    billingCycle = body.billingCycle;
    userId = body.userId;
    isSubscription = body.isSubscription; // Check if it's a subscription payment
    productId = body.productId; // productId for marketplace items
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  // 1. Verify transaction with Paystack
  let paystackData;
  try {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
        throw new Error('Paystack secret key is not configured.');
    }
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
        },
      }
    );

    paystackData = await response.json();

    if (!response.ok) {
        const externalError = paystackData?.message || 'An error occurred during Paystack verification.';
        throw new Error(`Paystack API Error: ${externalError}`);
    }

    if (!paystackData.status || paystackData.data.status !== 'success') {
      return NextResponse.json({ success: false, message: 'Payment verification with Paystack failed.', details: paystackData }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Paystack verification fetch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Could not connect to payment provider.', 
        details: error.message,
        suggestion: 'This may be due to Firebase Spark plan limitations on outbound requests. Please upgrade to the Blaze plan to enable server-side verification.'
      }, 
      { status: 500 }
    );
  }
  
  // 2. Handle data update based on payment type
  if (isSubscription) {
      // It's a subscription payment, update user document in Firestore
      try {
        const userRef = db.collection('users').doc(userId);
        await userRef.update({
          plan: planId,
          subscriptionCycle: billingCycle,
          planStartDate: admin.firestore.FieldValue.serverTimestamp(),
          paymentReference: reference, // Storing the reference for auditing
        });

        return NextResponse.json({ success: true, message: 'Plan updated successfully.' });

      } catch (error: any) {
        console.error('Firestore update error:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to update user plan in database.', details: error.message }, 
          { status: 500 }
        );
      }
  } else {
      // It's a product purchase, decrement stock
      if (!productId) {
          return NextResponse.json({ success: false, message: 'Product ID is missing for this purchase.' }, { status: 400 });
      }

      try {
          const productRef = db.collection('marketplace_products').doc(productId);
          await db.runTransaction(async (transaction) => {
              const productDoc = await transaction.get(productRef);
              if (!productDoc.exists) {
                  throw new Error("Product not found");
              }
              const currentStock = productDoc.data()?.stock;
              // Only decrement if stock is not unlimited (0) and is greater than 0
              if (currentStock > 0) {
                  transaction.update(productRef, {
                      stock: admin.firestore.FieldValue.increment(-1)
                  });
              }
          });
          return NextResponse.json({ success: true, message: 'Payment verified and stock updated.' });
      } catch (error: any) {
          console.error('Stock decrement error:', error);
          // Still return success to the client as payment was verified, but log the error
          return NextResponse.json(
            { success: true, message: 'Payment verified, but stock could not be updated.', details: error.message },
            { status: 200 } // Status 200 because payment is valid, but with a warning in body
          );
      }
  }
}
