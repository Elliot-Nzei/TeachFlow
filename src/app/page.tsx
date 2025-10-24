
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowRight, 
  BookOpen, 
  Users, 
  FileDown, 
  Notebook, 
  Menu, 
  Star, 
  CalendarDays, 
  Database,
  Check,
  Zap,
  Shield,
  TrendingUp,
  ShoppingCart
} from 'lucide-react';
import { Logo } from '@/components/logo';
import placeholderImages from '@/lib/placeholder-images.json';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useState } from 'react';

const heroImage = placeholderImages.placeholderImages.find(img => img.id === 'hero-students');

const features = [
  {
    icon: Users,
    title: 'Effortless Class Management',
    description: 'Organize classes, manage student profiles with auto-generated IDs, and assign subjects in a few clicks.',
  },
  {
    icon: BookOpen,
    title: 'Smart Gradebook',
    description: 'Input CA & exam scores with ease. Totals and grades are calculated automatically, saving you hours of work.',
  },
  {
    icon: CalendarDays,
    title: 'Timetable Management',
    description: 'Create and manage weekly class schedules with an intuitive, visual drag-and-drop interface.',
  },
  {
    icon: FileDown,
    title: 'AI Report Card Generator',
    description: 'Create professional, insightful report cards with AI-driven comments for teachers and principals.',
  },
  {
    icon: Notebook,
    title: 'AI Lesson Note Generator',
    description: 'Generate multi-week, NERDC-compliant lesson notes for any subject, ready to download as a PDF.',
  },
  {
    icon: ShoppingCart,
    title: 'Educational Marketplace',
    description: 'Discover and purchase quality educational resources, goods, and services from the community.',
  },
  {
    icon: Database,
    title: 'Secure Data Transfer',
    description: 'Securely share class data, including student rosters and grades, with other registered teachers.',
  },
];

const benefits = [
  {
    icon: Zap,
    title: 'Save 10+ Hours Weekly',
    description: 'Automate repetitive tasks and focus on teaching',
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: 'Bank-level security for all your school data',
  },
  {
    icon: TrendingUp,
    title: 'Improve Student Outcomes',
    description: 'Data-driven insights to track progress',
  },
];

const testimonials = [
  {
    name: 'Mrs. Adebayo',
    role: 'Primary 4 Teacher, Lagos',
    avatar: 'https://picsum.photos/seed/teacher-1/100/100',
    comment: "TeachFlow has been a lifesaver. The AI report card generator cut my end-of-term work in half. I can't imagine going back to the old way.",
    rating: 5,
  },
  {
    name: 'Mr. Chukwuma',
    role: 'JSS Coordinator, Abuja',
    avatar: 'https://picsum.photos/seed/teacher-2/100/100',
    comment: "The ability to manage all my classes, subjects, and student records in one place is fantastic. It's so organized and easy to use.",
    rating: 5,
  },
  {
    name: 'Mrs. Ibrahim',
    role: 'School Owner, Kano',
    avatar: 'https://picsum.photos/seed/teacher-3/100/100',
    comment: "The payment tracking feature alone is worth it. I can see who has paid and who is owing at a glance. It has greatly improved our school's finances.",
    rating: 5,
  }
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center bg-background/95 backdrop-blur-md fixed top-0 w-full z-50 border-b">
        <Logo compact={false} />
        <nav className="ml-auto hidden md:flex items-center gap-2 sm:gap-4">
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/register">
            <Button variant="default">
              Start for Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </nav>
        <div className="ml-auto md:hidden flex items-center gap-2">
          <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Login</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>Start for Free</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full pt-24 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
          <div className="container px-4 md:px-6 space-y-8 text-center relative z-10">
            <div className="bg-primary/10 text-primary inline-block rounded-full px-4 py-1.5 text-sm font-semibold mb-4 animate-in fade-in slide-in-from-bottom-3 duration-1000">
              The #1 School Management Platform for Nigerian Educators
            </div>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none font-headline animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
              Focus on Teaching,<br />Not Paperwork.
            </h1>
            <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-300">
              TeachFlow is the all-in-one tool designed for Nigerian teachers. Automate your administrative tasks, from grading and attendance to generating report cards, and get back to what you do best.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-500">
              <Link href="/register">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all">
                  Start Your Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#video-demo">
                <Button size="lg" variant="outline">
                  Watch Demo
                </Button>
              </Link>
            </div>
          </div>
          {heroImage && (
            <div className="absolute inset-0 -z-10 h-full w-full bg-background">
              <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background z-10" />
              <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                className="object-cover opacity-10 dark:opacity-20"
                data-ai-hint={heroImage.imageHint}
                priority
              />
            </div>
          )}
        </section>

        {/* Benefits Section */}
        <section className="w-full py-12 md:py-20 bg-background">
          <div className="container px-4 md:px-6">
            <div className="grid md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold font-headline">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-primary/10 text-primary px-3 py-1 text-sm font-semibold">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Everything You Need in One Place</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                  TeachFlow simplifies your administrative tasks so you can focus on what truly matters: teaching.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 lg:grid-cols-3 pt-12">
              {features.map((feature, index) => (
                <Card key={index} className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold font-headline">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Video Demo Section */}
        <section id="video-demo" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-primary/10 text-primary px-3 py-1 text-sm font-semibold">See It in Action</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">A Quick Tour of TeachFlow</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                  Watch this short video to see how TeachFlow can revolutionize your school's workflow in just a few minutes.
                </p>
              </div>
            </div>
            <div className="mx-auto max-w-4xl mt-12">
              <div className="aspect-video w-full overflow-hidden rounded-xl border-4 border-primary/20 shadow-2xl hover:border-primary/40 transition-colors">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="TeachFlow Demo Video"
                />
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-primary/10 text-primary px-3 py-1 text-sm font-semibold">Testimonials</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">What Teachers Are Saying</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                  Trusted by educators across Nigeria to simplify their work and improve efficiency.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-stretch gap-6 pt-12 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="p-6 space-y-4 h-full flex flex-col">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 border-2">
                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                        <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 text-yellow-400">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-muted-foreground text-sm flex-1">"{testimonial.comment}"</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="cta" className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
          <div className="container grid items-center justify-center gap-6 px-4 text-center md:px-6">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl font-headline">
                Ready to Transform Your Workflow?
              </h2>
              <p className="mx-auto max-w-[600px] text-primary-foreground/90 md:text-xl/relaxed">
                Join hundreds of teachers who are saving time and reducing stress. Get started with TeachFlow today—it's free to try.
              </p>
            </div>
            <div className="mx-auto flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="shadow-lg hover:shadow-xl transition-all">
                  Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-6 py-8 w-full px-4 md:px-6 border-t bg-secondary">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Logo compact={false} />
            <p className="text-sm text-muted-foreground">
              Empowering Nigerian educators with modern school management tools.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold">Product</h3>
            <nav className="flex flex-col gap-2">
              <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="/billing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="#video-demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Demo
              </Link>
            </nav>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold">Company</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                About Us
              </Link>
              <Link href="/parents" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                For Parents
              </Link>
            </nav>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold">Legal</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
            </nav>
          </div>
        </div>
        <div className="container mx-auto pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">&copy; 2024 TeachFlow. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">Made with ❤️ for Nigerian educators</p>
        </div>
      </footer>
    </div>
  );
}

    
