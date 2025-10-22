
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
       <header className="px-4 lg:px-6 h-16 flex items-center bg-background/80 backdrop-blur-sm sticky top-0 w-full z-50 border-b">
        <Logo />
        <nav className="ml-auto">
            <Link href="/register" passHref><Button>Get Started</Button></Link>
        </nav>
      </header>
      <main className="flex-1">
        <div className="container mx-auto px-4 md:px-6 py-12 md:py-20">
          <div className="max-w-3xl mx-auto prose prose-lg dark:prose-invert">
            <h1>Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: October 22, 2025</p>

            <h2>1. Introduction</h2>
            <p>
              TeachFlow ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our web application (the "Service").
            </p>

            <h2>2. Information We Collect</h2>
            <p>We may collect information about you in a variety of ways. The information we may collect on the Service includes:</p>
            
            <h3>Personal Data</h3>
            <p>
              Personally identifiable information, such as your name, school name, email address, and password, that you voluntarily give to us when you register with the Service.
            </p>
            
            <h3>School Data</h3>
            <p>
              All data related to your school that you input into the Service, including but not limited to student names, class names, subjects, grades, attendance records, and payment information ("School Data"). This data is owned by you. We only process it to provide the Service.
            </p>
            
            <h3>Derivative Data</h3>
            <p>
              Information our servers automatically collect when you access the Service, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Service.
            </p>

            <h2>3. How We Use Your Information</h2>
            <p>
              Having accurate information permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Service to:
            </p>
            <ul>
                <li>Create and manage your account.</li>
                <li>Provide the core functionalities of the application, like generating reports and managing records.</li>
                <li>Process payments and subscriptions.</li>
                <li>Email you regarding your account or order.</li>
                <li>Monitor and analyze usage and trends to improve your experience with the Service.</li>
                <li>Notify you of updates to the Service.</li>
            </ul>

            <h2>4. Disclosure of Your Information</h2>
            <p>
              We do not share, sell, rent, or trade your Personal Data or School Data with third parties for their commercial purposes. We may share information we have collected about you in certain situations:
            </p>
            <ul>
                <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law.</li>
                <li><strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including payment processing (Paystack) and cloud hosting (Firebase).</li>
            </ul>

            <h2>5. Data Security</h2>
            <p>
              We use administrative, technical, and physical security measures to help protect your personal information and School Data. We leverage Firebase's robust security features, including Firestore Security Rules, to ensure your data is protected from unauthorized access. While we have taken reasonable steps to secure the data you provide to us, please be aware that no security measures are perfect or impenetrable.
            </p>
            
            <h2>6. Data Retention</h2>
            <p>We will retain your Personal Data and School Data for as long as your account is active or as needed to provide you the Service. You can delete your account and all associated data at any time through the "Settings" page.</p>

            <h2>7. Children's Privacy</h2>
            <p>The Service is intended for use by teachers and school administrators. We do not knowingly collect personal information from children under the age of 13. All student data is entered and managed by the authorized school user.</p>

            <h2>8. Changes to This Privacy Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.</p>

            <h2>9. Contact Us</h2>
            <p>If you have questions or comments about this Privacy Policy, please contact us at teachflowcontact@gmail.com.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
