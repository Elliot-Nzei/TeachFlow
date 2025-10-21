
import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    } as admin.ServiceAccount;

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    console.error('Firebase Admin initialization error:', error);
    return NextResponse.json(
      { success: false, message: `Firebase initialization failed: ${error.message}` },
      { status: 500 }
    );
  }
}

const db = admin.firestore();

export async function POST(req: NextRequest) {
  let reference, planId, billingCycle, userId;
  try {
    const body = await req.json();
    reference = body.reference;
    planId = body.planId;
    billingCycle = body.billingCycle;
    userId = body.userId;
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  // 1. Verify transaction with Paystack
  let paystackData;
  try {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
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

  // 2. Update user document in Firestore
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
