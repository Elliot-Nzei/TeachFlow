
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BookOpen, Users, FileDown, Notebook, Video, ArrowRightCircle, CheckCircle, Send, Linkedin } from 'lucide-react';
import { Logo } from '@/components/logo';
import placeholderImages from '@/lib/placeholder-images.json';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const heroImage = placeholderImages.placeholderImages.find(img => img.id === 'hero-students');

const features = [
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: 'Class & Student Management',
    description: 'Easily create classes, manage student profiles with auto-generated IDs, and assign subjects.',
  },
  {
    icon: <BookOpen className="h-8 w-8 text-primary" />,
    title: 'Comprehensive Gradebook',
    description: 'Input scores for continuous assessments and exams. The system auto-calculates totals and assigns grades.',
  },
  {
    icon: <FileDown className="h-8 w-8 text-primary" />,
    title: 'AI-Powered Report Cards',
    description: 'Generate insightful, detailed, and printable report cards with AI-driven comments for teachers and principals.',
  },
  {
    icon: <Notebook className="h-8 w-8 text-primary" />,
    title: 'AI Lesson Note Generator',
    description: 'Create multi-week, NERDC-compliant lesson notes for any subject, downloadable as a PDF.',
  },
  {
    icon: <CheckCircle className="h-8 w-8 text-primary" />,
    title: 'Attendance Tracking',
    description: 'A simple interface for marking daily student attendance (Present, Absent, or Late) for any class.',
  },
  {
    icon: <Send className="h-8 w-8 text-primary" />,
    title: 'Secure Data Transfer',
    description: 'Share class rosters, attendance, and trait data securely with other users via a unique transfer code.',
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-background/80 backdrop-blur-sm fixed top-0 w-full z-50">
        <Logo />
        <nav className="ml-auto flex gap-2 sm:gap-4">
          <Link href="/login" passHref>
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/register" passHref>
            <Button variant="default">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="relative w-full h-[70vh] md:h-[80vh] flex items-center justify-center text-center text-white">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              className="object-cover -z-10"
              data-ai-hint={heroImage.imageHint}
              priority
            />
          )}
          <div className="absolute inset-0 bg-black/60 -z-10" />
          <div className="container px-4 md:px-6 space-y-6">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none font-headline drop-shadow-md">
              The Smart Way to Manage Your School
            </h1>
            <p className="max-w-[700px] mx-auto md:text-xl drop-shadow">
              PeerPrep empowers Nigerian educators with AI-driven tools for class management, grade tracking, report generation, and secure data sharing.
            </p>
            <div className="flex flex-col gap-4 min-[400px]:flex-row justify-center">
              <Link href="/register" passHref>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Get Started for Free <ArrowRightCircle className="ml-2" />
                </Button>
              </Link>
              <Link href="#features" passHref>
                <Button variant="secondary" size="lg">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-card">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Built for Efficiency and Collaboration</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From generating report cards to planning lessons, PeerPrep simplifies your administrative tasks so you can focus on teaching.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 lg:grid-cols-3 pt-12">
              {features.map((feature, index) => (
                <div key={index} className="flex flex-col items-center text-center gap-4">
                  {feature.icon}
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold font-headline">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        <section id="video-guide" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline mb-4">See PeerPrep in Action</h2>
            <p className="max-w-[600px] mx-auto text-muted-foreground md:text-xl mb-8">
              Watch this short video to see how PeerPrep can transform your school's administration.
            </p>
            <div className="mx-auto max-w-4xl aspect-video bg-muted rounded-xl flex items-center justify-center border border-dashed">
              <div className="text-center text-muted-foreground">
                <Video className="h-16 w-16 mx-auto mb-4" />
                <p className="font-semibold">Video guide coming soon</p>
              </div>
            </div>
          </div>
        </section>

        <section id="about-developer" className="w-full py-12 md:py-24 lg:py-32 bg-background">
            <div className="container px-4 md:px-6">
                <Card className="overflow-hidden">
                    <div className="grid md:grid-cols-3">
                        <div className="md:col-span-1 bg-secondary/50 p-8 flex flex-col items-center justify-center text-center">
                            <Avatar className="h-32 w-32 border-4 border-primary shadow-lg mb-4">
                                <Image 
                                  src="https://drive.google.com/uc?export=view&id=1kI6Um7t0VE-lMPJI4kNXGTItTvMio3_0" 
                                  alt="Elliot Ekene Nzei"
                                  width={128}
                                  height={128}
                                  className="object-cover"
                                />
                            </Avatar>
                            <h3 className="text-2xl font-bold">Elliot Ekene Nzei</h3>
                            <p className="text-muted-foreground">Passionate Researcher, Programmer, and Problem-Solver</p>
                             <div className="flex items-center gap-4 mt-6">
                                <Link href="https://www.linkedin.com/in/elliot-nzei-ba771025b" target="_blank" rel="noopener noreferrer" passHref>
                                   <Button variant="outline"><Linkedin className="mr-2 h-4 w-4" /> LinkedIn</Button>
                                </Link>
                                 <Link href="https://www.upwork.com/freelancers/~01a85e1257daa885d3" target="_blank" rel="noopener noreferrer" passHref>
                                   <Button variant="outline">Upwork</Button>
                                </Link>
                             </div>
                        </div>
                        <div className="md:col-span-2 p-8 md:p-12 space-y-4">
                           <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline mb-4">About the Developer</h2>
                           <p>
                             Hi, I'm Elliot Ekene Nzei — a passionate researcher, programmer, and problem-solver specializing in Python, JavaScript, and cloud-based web technologies. I built PeerPrep to address the real challenges faced by Nigerian educators in managing schools, students, and academics efficiently.
                           </p>
                            <p>
                             With a strong background in computer science, system automation, and AI integration, I focus on developing intelligent digital tools that simplify complex administrative tasks. My goal is to bridge the gap between traditional education systems and modern technology through reliable, user-friendly solutions that empower teachers and improve learning outcomes.
                           </p>
                            <p>
                             PeerPrep reflects my belief that innovation in education starts with better tools — and I’m committed to building platforms that make that vision a reality.
                           </p>
                        </div>
                    </div>
                </Card>
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
