
'use client';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import placeholderImages from '@/lib/placeholder-images.json';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, Lightbulb, Target, Users, Menu, GitBranch, Bell, LineChart, Linkedin, Briefcase } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const aboutImage = placeholderImages.placeholderImages.find(img => img.id === 'hero-students');

const roadmapFeatures = [
    {
        icon: <Users className="h-6 w-6 text-primary" />,
        title: 'Parent-Teacher Communication',
        description: 'A dedicated portal for seamless communication between parents and teachers.',
        status: 'In Progress'
    },
    {
        icon: <Bell className="h-6 w-6 text-primary" />,
        title: 'Real-time Notifications',
        description: 'Instant alerts for parents and teachers on important updates and events.',
        status: 'Planned'
    },
    {
        icon: <LineChart className="h-6 w-6 text-primary" />,
        title: 'Advanced Analytics',
        description: 'Deeper insights into student and class performance trends over time.',
        status: 'Planned'
    }
];


export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
       <header className="px-4 lg:px-6 h-16 flex items-center bg-background/80 backdrop-blur-sm fixed top-0 w-full z-50 border-b">
        <Logo compact={false} />
        <nav className="ml-auto hidden md:flex items-center gap-2 sm:gap-4">
            <Link href="/#features" passHref><Button variant="ghost">Features</Button></Link>
            <Link href="/about" passHref><Button variant="ghost">About Us</Button></Link>
            <Link href="/login" passHref><Button variant="outline">Login</Button></Link>
            <Link href="/register" passHref><Button>Start for Free</Button></Link>
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
                    <Link href="/#features" passHref><DropdownMenuItem>Features</DropdownMenuItem></Link>
                    <Link href="/about" passHref><DropdownMenuItem>About Us</DropdownMenuItem></Link>
                    <Link href="/login" passHref><DropdownMenuItem>Login</DropdownMenuItem></Link>
                    <Link href="/register" passHref><DropdownMenuItem>Start for Free</DropdownMenuItem></Link>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>
      <main className="flex-1 pt-16">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary/5">
          <div className="container px-4 md:px-6 text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline">
              Empowering Nigerian Educators
            </h1>
            <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl mt-4">
              TeachFlow was born from a simple idea: teachers deserve tools that simplify their lives, so they can focus on shaping the future.
            </p>
          </div>
        </section>

        <section className="w-full py-12 md:py-24">
            <div className="container px-4 md:px-6 grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                             <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                <Target className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle className="font-headline text-2xl">Our Mission</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Our mission is to provide an affordable, intuitive, and powerful school management system specifically designed for the Nigerian educational landscape. We aim to eliminate the administrative burden on teachers by automating repetitive tasks, streamlining record-keeping, and providing insightful data at their fingertips.
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                             <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                <Lightbulb className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle className="font-headline text-2xl">Our Vision</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <p className="text-muted-foreground">
                                We envision a future where every teacher in Nigeria is empowered with technology that enhances their teaching experience, improves student outcomes, and allows them to dedicate more time to what they do best: inspiring the next generation.
                            </p>
                        </CardContent>
                    </Card>
                </div>
                 <div>
                    {aboutImage && (
                        <Image
                            src={aboutImage.imageUrl}
                            alt={aboutImage.description}
                            width="600"
                            height="400"
                            className="rounded-xl shadow-lg w-full"
                            data-ai-hint={aboutImage.imageHint}
                        />
                    )}
                </div>
            </div>
        </section>

        <section id="team" className="w-full py-12 md:py-24 bg-secondary">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold font-headline">Meet the Team</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">The talented individuals collaborating to bring TeachFlow to life.</p>
            </div>
            <div className="grid md:grid-cols-1 gap-12 max-w-4xl mx-auto">
              {/* Elliot's Profile */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <Image 
                  src="https://drive.google.com/uc?export=view&id=1kI6Um7t0VE-lMPJI4kNXGTItTvMio3_0"
                  alt="Elliot"
                  width={150}
                  height={150}
                  className="rounded-full aspect-square object-cover shadow-md flex-shrink-0"
                />
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-bold">Elliot Nzei</h3>
                  <p className="text-primary font-semibold text-sm mb-2">Lead Developer & Founder</p>
                  <p className="text-muted-foreground text-sm mb-3">
                    Elliot is a passionate researcher and programmer specializing in Python, HTML, CSS, JavaScript, and cloud technologies. With a strong foundation in both frontend and backend development, he focuses on building innovative, scalable, and intelligent digital systems that solve real-world problems. His work blends precision, automation, and creativity—turning complex ideas into efficient, user-friendly applications.
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
                        <Link href="https://www.linkedin.com/in/elliot-nzei-ba771025b" target="_blank" rel="noopener noreferrer" passHref>
                           <Button variant="outline" size="sm"><Linkedin className="mr-2 h-4 w-4" />LinkedIn</Button>
                        </Link>
                         <Link href="https://www.upwork.com/freelancers/~01a85e1257daa885d3" target="_blank" rel="noopener noreferrer" passHref>
                           <Button variant="outline" size="sm"><Briefcase className="mr-2 h-4 w-4" />Upwork</Button>
                        </Link>
                    </div>
                </div>
              </div>
              <hr className="border-border" />
              {/* Felix's Profile */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <Image 
                  src="https://drive.google.com/uc?export=view&id=1mxpMWPAuGarUW_lro8EB7JWF1Bk3kz2b"
                  alt="Felix"
                  width={150}
                  height={150}
                  className="rounded-full aspect-square object-cover shadow-md flex-shrink-0"
                />
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-bold">Felix Wilson Gbedemah</h3>
                  <p className="text-primary font-semibold text-sm mb-2">🤖 Co-Developer & AI Engineer</p>
                  <p className="text-muted-foreground text-sm mb-3">
                    Felix is a skilled Web Developer, Data Scientist, and AI Engineer, currently focused on leveraging intelligent systems to enhance web experiences and business automation. With a deep understanding of data-driven technologies and modern development frameworks, Felix brings analytical precision and technical innovation to every project, helping transform ideas into smart, scalable solutions.
                  </p>
                  <Link href="https://www.linkedin.com/in/felix-wilson-gbedemah-8038051a0/" target="_blank" rel="noopener noreferrer" passHref>
                    <Button variant="link" size="sm" className="pl-0"><Linkedin className="mr-2 h-4 w-4" />View LinkedIn</Button>
                  </Link>
                </div>
              </div>
              <hr className="border-border" />
              {/* Adedotun's Profile */}
               <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <Image 
                  src="https://drive.google.com/uc?export=view&id=1MjkXadNlyaeImt5eKV7M2zB2khnJh3HH"
                  alt="Adedotun"
                  width={150}
                  height={150}
                  className="rounded-full aspect-square object-cover shadow-md flex-shrink-0"
                />
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-bold">Adedotun Taiwo</h3>
                   <p className="text-primary font-semibold text-sm mb-2">🔐 Cybersecurity & AI Specialist</p>
                  <p className="text-muted-foreground text-sm mb-3">
                    Adedotun is an emerging Cybersecurity Analyst with a strong foundation in Electronic and Electrical Engineering and ongoing studies in Information Technology. He is passionate about the intersection of AI and cybersecurity, focusing on building smarter, more resilient systems that anticipate and defend against modern digital threats.
                  </p>
                   <Link href="https://www.linkedin.com/in/taiwodotun/" target="_blank" rel="noopener noreferrer" passHref>
                    <Button variant="link" size="sm" className="pl-0"><Linkedin className="mr-2 h-4 w-4" />View LinkedIn</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

         <section id="roadmap" className="w-full py-12 md:py-24 bg-background">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold font-headline">Our Roadmap</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">We're always working to make TeachFlow better. Here's a glimpse of what's coming next.</p>
            </div>
            <div className="max-w-4xl mx-auto grid gap-8 md:grid-cols-3">
              {roadmapFeatures.map((feature, index) => (
                <Card key={index} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            {feature.icon}
                        </div>
                        <div className={`text-xs font-bold py-1 px-2 rounded-full ${feature.status === 'In Progress' ? 'bg-yellow-200 text-yellow-800' : 'bg-blue-200 text-blue-800'}`}>
                            {feature.status}
                        </div>
                    </div>
                    <CardTitle className="pt-4">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
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
