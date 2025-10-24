
import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { serviceAccount } from '@/firebase/service-account';
import dotenv from 'dotenv';

dotenv.config();

// Helper function to initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  if (admin.apps.length) {
    return;
  }
  try {
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
  let reference, planId, billingCycle, userId, isSubscription;
  
  try {
    const body = await req.json();
    reference = body.reference;
    planId = body.planId;
    billingCycle = body.billingCycle;
    userId = body.userId;
    isSubscription = body.isSubscription; // Check if it's a subscription payment
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
  
  // 2. If it's a subscription payment, update user document in Firestore
  if (isSubscription) {
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
  }
  
  // If it's not a subscription (e.g., a product purchase), just return success
  return NextResponse.json({ success: true, message: 'Payment verified.' });
}
