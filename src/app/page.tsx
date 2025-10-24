
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
  ShoppingCart,
  Facebook,
  Instagram,
  X
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
    comment: "The ability to manage all my classes, subjects, and student records in one place is fantastic. It is so organized and easy to use.",
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
              <Link href="/about#video-demo">
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
        
        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32 bg-background">
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
        <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Logo compact={false} />
            <p className="text-sm text-muted-foreground">
              Empowering Nigerian educators with modern school management tools.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold">Company</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                About Us
              </Link>
              <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="/#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Testimonials
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
           <div className="space-y-4">
            <h3 className="font-semibold">Follow Us</h3>
            <div className="flex items-center gap-4">
               <Link href="https://www.facebook.com/share/1TY3JDTrKW/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                  <Facebook className="h-6 w-6" />
                  <span className="sr-only">Facebook</span>
               </Link>
                <Link href="https://www.instagram.com/teachflow.official?igsh=MTJwemh2MXNibHFscw==" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                  <Instagram className="h-6 w-6" />
                  <span className="sr-only">Instagram</span>
                </Link>
                <Link href="https://x.com/TeachFlow_App?t=t6EBa6xnU55byovi-6ic8w&s=09" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span className="sr-only">X (formerly Twitter)</span>
                </Link>
                <Link href="https://chat.whatsapp.com/HNWjpUg3GMF7FYj9rUBySL?mode=wwt" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M18.425 5.575a9.349 9.349 0 0 0-13.225 0 9.349 9.349 0 0 0 0 13.225l-1.006 3.655 3.738-.98A9.349 9.349 0 0 0 12 22.25a9.349 9.349 0 0 0 9.349-9.349 9.349 9.349 0 0 0-2.924-6.626ZM12 4a8.25 8.25 0 0 1 8.25 8.25c0 2.249-1.023 4.43-2.613 5.922l.06.096-1.943 5.827 5.962-1.564.116.072a8.25 8.25 0 0 1-13.82-5.417A8.25 8.25 0 0 1 12 4Zm3.193 9.253a.826.826 0 0 0-.583-.29c-.19 0-.41.095-.583.19l-.307.159a1.93 1.93 0 0 1-1.025.267c-.209 0-.418-.048-.628-.159l-1.063-.51a6.65 6.65 0 0 1-2.34-1.926 5.253 5.253 0 0 1-1.3-2.673c-.095-.21-.132-.438-.132-.665 0-.247.048-.476.143-.694.132-.303.31-.56.549-.759.229-.19.497-.285.788-.285.115 0 .229.024.334.072.143.06.267.143.372.238l.19.16c.153.131.258.274.306.417.06.143.084.285.084.428 0 .11-.012.21-.036.31l-.19 1.092c-.06.285-.19.522-.392.701-.114.114-.267.209-.45.285-.024.012-.048.024-.072.036-.07.036-.153.06-.237.096-.132.06-.257.083-.37.083a.853.853 0 0 0-.55-.202l-.083-.012c-.084-.012-.168-.036-.253-.06a4.34 4.34 0 0 1-1.554-1.092 3.86 3.86 0 0 1-1.003-1.637c-.072-.158-.108-.31-.108-.45 0-.21.072-.403.203-.584.143-.18.334-.31.573-.392.209-.072.418-.107.62-.107h.108a2.15 2.15 0 0 1 1.637.735l.23.273c.227.266.505.474.83.626.324.152.665.228.996.228h.024c.26 0 .52-.06.759-.18.238-.12.446-.285.62-.498.17-.21.284-.45.346-.712.06-.266.084-.54.084-.82v-.036a1.23 1.23 0 0 0-.191-.688c-.168-.228-.394-.407-.67-.531-.275-.12-.58-.18-.91-.18-.36 0-.718.072-1.064.215-.346.143-.64.346-.879.608l-.203.24c-.024.023-.06.035-.095.035-.048 0-.084-.012-.12-.048a.29.29 0 0 1-.095-.202c0-.083.023-.158.071-.227l.418-.463c.228-.256.497-.475.79-.652.304-.18.62-.298.94-.356.323-.06.643-.084.956-.084h.024c.545 0 1.053.119 1.52.356.465.237.842.562 1.127.973.285.41.428.878.428 1.4s-.143 1.01-.428 1.48a3.18 3.18 0 0 1-1.163 1.08Z" clipRule="evenodd" />
                  </svg>
                  <span className="sr-only">WhatsApp</span>
                </Link>
            </div>
          </div>
        </div>
        <div className="container mx-auto pt-6 border-t text-center">
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} TeachFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
