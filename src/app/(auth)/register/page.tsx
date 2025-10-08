import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold font-headline">Create an Account</CardTitle>
        <CardDescription>
          Enter your information to get started.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="school-name">School Name</Label>
                <Input id="school-name" placeholder="Sunshine Primary School" required />
            </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="name@example.com" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" />
        </div>
        <Link href="/dashboard" className="w-full">
            <Button type="submit" className="w-full">
                Create Account
            </Button>
        </Link>
      </CardContent>
       <CardFooter className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="underline ml-1">
          Login
        </Link>
      </CardFooter>
    </Card>
  )
}
