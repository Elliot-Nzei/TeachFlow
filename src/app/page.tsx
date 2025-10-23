
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BookOpen, Users, FileDown, Notebook, CheckCircle, Send, FileQuestion, DollarSign, Menu, Star, Video } from 'lucide-react';
import { Logo } from '@/components/logo';
import placeholderImages from '@/lib/placeholder-images.json';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const heroImage = placeholderImages.placeholderImages.find(img => img.id === 'hero-students');

const features = [
  {
    icon: <Users className="h-6 w-6 text-primary" />,
    title: 'Effortless Class Management',
    description: 'Organize classes, manage student profiles with auto-generated IDs, and assign subjects in a few clicks.',
  },
  {
    icon: <BookOpen className="h-6 w-6 text-primary" />,
    title: 'Smart Gradebook',
    description: 'Input CA & exam scores with ease. Totals and grades are calculated automatically, saving you hours of work.',
  },
  {
    icon: <DollarSign className="h-6 w-6 text-primary" />,
    title: 'Fee & Payment Tracking',
    description: 'Set class fees and record student payments to track revenue and outstanding balances each term.',
  },
  {
    icon: <FileDown className="h-6 w-6 text-primary" />,
    title: 'AI Report Card Generator',
    description: 'Create professional, insightful report cards with AI-driven comments for teachers and principals.',
  },
  {
    icon: <Notebook className="h-6 w-6 text-primary" />,
    title: 'AI Lesson Note Generator',
    description: 'Generate multi-week, NERDC-compliant lesson notes for any subject, ready to download as a PDF.',
  },
  {
    icon: <FileQuestion className="h-6 w-6 text-primary" />,
    title: 'AI Exam Question Generator',
    description: 'Instantly create objective, essay, or mixed-format exams based on your topics, in a printable A4 format.',
  },
];

const testimonials = [
  {
    name: 'Mrs. Adebayo',
    role: 'Primary 4 Teacher, Lagos',
    avatar: 'https://picsum.photos/seed/teacher-1/100/100',
    comment: "TeachFlow has been a lifesaver. The AI report card generator cut my end-of-term work in half. I can't imagine going back to the old way.",
  },
  {
    name: 'Mr. Chukwuma',
    role: 'JSS Coordinator, Abuja',
    avatar: 'https://picsum.photos/seed/teacher-2/100/100',
    comment: 'The ability to manage all my classes, subjects, and student records in one place is fantastic. It’s so organized and easy to use.',
  },
  {
    name: 'Mrs. Ibrahim',
    role: 'School Owner, Kano',
    avatar: 'https://picsum.photos/seed/teacher-3/100/100',
    comment: "The payment tracking feature alone is worth it. I can see who has paid and who is owing at a glance. It has greatly improved our school's finances.",
  }
];


export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-background/80 backdrop-blur-sm fixed top-0 w-full z-50 border-b">
        <Logo />
        <nav className="ml-auto hidden md:flex items-center gap-2 sm:gap-4">
            <Link href="/parents" passHref>
                <Button variant="ghost">Parents</Button>
            </Link>
             <Link href="/about" passHref>
                <Button variant="ghost">About Us</Button>
            </Link>
            <Link href="/login" passHref>
                <Button variant="ghost">Teacher Login</Button>
            </Link>
            <Link href="/register" passHref>
                <Button variant="default">
                Start for Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </Link>
        </nav>
        <div className="ml-auto md:hidden flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <Link href="/parents" passHref><DropdownMenuItem>Parents</DropdownMenuItem></Link>
                    <Link href="/about" passHref><DropdownMenuItem>About Us</DropdownMenuItem></Link>
                    <Link href="/login" passHref><DropdownMenuItem>Teacher Login</DropdownMenuItem></Link>
                    <Link href="/register" passHref><DropdownMenuItem>Start for Free</DropdownMenuItem></Link>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>
      <main className="flex-1">
        <section className="relative w-full pt-24 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28">
          <div className="container px-4 md:px-6 space-y-8 text-center">
            <div className="bg-primary/10 text-primary inline-block rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
                The #1 School Management Platform for Nigerian Educators
            </div>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none font-headline">
              Focus on Teaching, Not Paperwork.
            </h1>
            <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl">
              TeachFlow is the all-in-one tool designed for Nigerian teachers. Automate your administrative tasks, from grading and attendance to generating report cards, and get back to what you do best.
            </p>
            <div className="flex flex-col gap-4 min-[400px]:flex-row justify-center">
              <Link href="/register" passHref>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Start Your Free Trial
                </Button>
              </Link>
            </div>
          </div>
           {heroImage && (
            <div className="absolute inset-0 -z-10 h-full w-full bg-background [mask-image:radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,0,0,0.3),rgba(255,255,255,0))]">
                <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    fill
                    className="object-cover opacity-5 dark:opacity-10"
                    data-ai-hint={heroImage.imageHint}
                    priority
                />
            </div>
           )}
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-primary/10 text-primary px-3 py-1 text-sm font-semibold">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Everything You Need in One Place</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  TeachFlow simplifies your administrative tasks so you can focus on what truly matters: teaching.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-y-12 gap-x-8 sm:grid-cols-2 lg:grid-cols-3 pt-12">
              {features.map((feature, index) => (
                <div key={index} className="grid gap-2">
                  <div className="flex items-center gap-3">
                    {feature.icon}
                    <h3 className="text-lg font-bold font-headline">{feature.title}</h3>
                  </div>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="video-demo" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-primary/10 text-primary px-3 py-1 text-sm font-semibold">See It in Action</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">A Quick Tour of TeachFlow</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Watch this short video to see how TeachFlow can revolutionize your school's workflow in just a few minutes.
                </p>
              </div>
            </div>
            <div className="mx-auto max-w-4xl mt-12">
              <div className="aspect-video w-full overflow-hidden rounded-xl border-4 border-primary/20 shadow-2xl">
                 <iframe
                    className="w-full h-full"
                    src="https://drive.google.com/file/d/1Au75CjFL2MRKolLx9NkJKXEM9cSbBPI3/preview"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="TeachFlow Demo Video"
                ></iframe>
              </div>
            </div>
          </div>
        </section>
        
        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
          <div className="container px-4 md:px-6">
             <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">What Teachers Are Saying</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Trusted by educators across Nigeria to simplify their work and improve efficiency.
                </p>
            </div>
             <div className="mx-auto grid max-w-5xl items-center gap-6 pt-12 lg:grid-cols-3 lg:gap-8">
                {testimonials.map((testimonial, index) => (
                    <Card key={index}>
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <Avatar className="h-12 w-12 border">
                                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                                    <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold">{testimonial.name}</p>
                                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                                </div>
                                <div className="flex text-yellow-400">
                                    <Star className="w-4 h-4 fill-current" />
                                    <Star className="w-4 h-4 fill-current" />
                                    <Star className="w-4 h-4 fill-current" />
                                    <Star className="w-4 h-4 fill-current" />
                                    <Star className="w-4 h-4 fill-current" />
                                </div>
                            </div>
                             <p className="mt-4 text-muted-foreground">"{testimonial.comment}"</p>
                        </CardContent>
                    </Card>
                ))}
             </div>
          </div>
        </section>

        <section id="cta" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">Ready to Transform Your Workflow?</h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join hundreds of teachers who are saving time and reducing stress. Get started with TeachFlow today—it's free to try.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
                <Link href="/register" passHref>
                    <Button size="lg" className="w-full">
                    Sign Up Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 TeachFlow. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="/terms">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="/privacy">
            Privacy
          </Link>
           <Link className="text-xs hover:underline underline-offset-4" href="/about">
            About Us
          </Link>
        </nav>
      </footer>
    </div>
  );
}
