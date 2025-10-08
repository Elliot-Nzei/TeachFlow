import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BookOpen, Share2, BarChart, Users, FileDown } from 'lucide-react';
import { Logo } from '@/components/logo';
import placeholderImages from '@/lib/placeholder-images.json';

const heroImage = placeholderImages.placeholderImages.find(img => img.id === 'hero-students');

const features = [
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: 'Class Management',
    description: 'Easily create and manage classes, assign students, and track subjects for each academic session.',
  },
  {
    icon: <BookOpen className="h-8 w-8 text-primary" />,
    title: 'Grades & Reports',
    description: 'Input grades using the Nigerian grading scale and generate insightful, AI-powered report cards.',
  },
  {
    icon: <Share2 className="h-8 w-8 text-primary" />,
    title: 'Secure Data Transfer',
    description: 'Share class data, grades, or report cards securely with other users via a unique transfer code.',
  },
  {
    icon: <FileDown className="h-8 w-8 text-primary" />,
    title: 'Export to Excel',
    description: 'Download your school data, including student grades and report summaries, in Excel format anytime.',
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-background shadow-sm">
        <Logo />
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/login" passHref>
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/register" passHref>
            <Button variant="default">
              Register <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-card">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    A Modern School Management System for Nigeria
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    PeerPrep empowers educators with tools for class management, grade tracking, and secure data sharing, all tailored for the Nigerian academic structure.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/register" passHref>
                    <Button size="lg">Get Started for Free</Button>
                  </Link>
                  <Link href="#features" passHref>
                    <Button variant="outline" size="lg">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
              {heroImage && (
                 <Image
                  src={heroImage.imageUrl}
                  alt={heroImage.description}
                  width={600}
                  height={400}
                  className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
                  data-ai-hint={heroImage.imageHint}
                  priority
                />
              )}
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Built for Collaboration and Efficiency</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From generating report cards to sharing data peer-to-peer, PeerPrep simplifies your administrative tasks.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-2 pt-12">
              {features.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="flex flex-row items-center gap-4">
                    {feature.icon}
                    <CardTitle className="font-headline">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 PeerPrep. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
