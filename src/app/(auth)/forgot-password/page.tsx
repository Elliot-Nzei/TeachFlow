import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo"
import placeholderImages from '@/lib/placeholder-images.json';
import { ChevronLeft } from "lucide-react"

const forgotPasswordImage = placeholderImages.placeholderImages.find(img => img.id === 'hero-students');

export default function ForgotPasswordPage() {
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
       <div className="hidden bg-muted lg:block">
        {forgotPasswordImage && (
            <Image
                src={forgotPasswordImage.imageUrl}
                alt={forgotPasswordImage.description}
                width="1920"
                height="1080"
                className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                data-ai-hint={forgotPasswordImage.imageHint}
            />
        )}
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <Logo />
            <h1 className="text-3xl font-bold font-headline mt-4">Forgot Password</h1>
            <p className="text-balance text-muted-foreground">
              Enter your email and we'll send you a link to reset your password.
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Send Reset Link
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            <Link
                href="/login"
                className="flex items-center justify-center text-sm"
                >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
