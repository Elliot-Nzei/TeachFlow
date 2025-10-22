
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TermsOfServicePage() {
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
            <h1>Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: October 22, 2025</p>

            <h2>1. Introduction</h2>
            <p>
              Welcome to TeachFlow ("we," "us," or "our"). These Terms of Service ("Terms") govern your use of our web application (the "Service"). By accessing or using the Service, you agree to be bound by these Terms.
            </p>

            <h2>2. User Accounts</h2>
            <p>
              To use most features of the Service, you must register for an account. You are responsible for maintaining the confidentiality of your account password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>

            <h2>3. Subscriptions and Payments</h2>
            <p>
              Our Service is offered under different subscription plans ("Plans"). By selecting a paid Plan, you agree to pay the fees associated with that Plan. All fees are non-refundable. We use Paystack, a third-party payment processor, to handle payments. We are not responsible for any issues arising from the payment process.
            </p>
            
            <h2>4. Acceptable Use</h2>
            <p>You agree not to use the Service for any unlawful purpose or to engage in any activity that could harm the Service, our users, or any third party. You are solely responsible for all data, including student information, grades, and other records, that you upload to the Service.</p>

            <h2>5. AI-Generated Content</h2>
            <p>The Service uses artificial intelligence to generate content such as report card comments and lesson notes. While we strive for accuracy, we do not guarantee that the AI-generated content will be free of errors or perfectly suitable for your needs. You are responsible for reviewing and editing all AI-generated content before use.</p>

            <h2>6. Intellectual Property</h2>
            <p>The Service and its original content, features, and functionality are and will remain the exclusive property of TeachFlow. The content you create and upload (e.g., student data, grades) remains your property. By using the Service, you grant us a license to use, store, and process your data to provide the Service to you.</p>

            <h2>7. Termination</h2>
            <p>We may terminate or suspend your account at any time, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use the Service will immediately cease.</p>

            <h2>8. Disclaimer of Warranties</h2>
            <p>The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, express or implied, regarding the operation or availability of the Service, or the information, content, or materials included therein.</p>

            <h2>9. Limitation of Liability</h2>
            <p>In no event shall TeachFlow, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
            
            <h2>10. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to its conflict of law provisions.</p>

            <h2>11. Changes to Terms</h2>
            <p>We reserve the right to modify these Terms at any time. We will provide notice of any changes by posting the new Terms on this page. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.</p>

            <h2>12. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at support@teachflow.example.com.</p>

          </div>
        </div>
      </main>
    </div>
  );
}
