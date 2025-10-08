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

export default function LoginPage() {
  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold font-headline">Welcome Back</CardTitle>
        <CardDescription>Enter your email or user code to log in</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email or User Code</Label>
          <Input id="email" type="email" placeholder="NSMS-12345 or name@example.com" required />
        </div>
        <div className="space-y-2">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <Link href="#" className="ml-auto inline-block text-sm underline">
              Forgot your password?
            </Link>
          </div>
          <Input id="password" type="password" required />
        </div>
        <Link href="/dashboard" className="w-full">
            <Button className="w-full">Login</Button>
        </Link>
      </CardContent>
      <CardFooter className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="underline ml-1">
          Register
        </Link>
      </CardFooter>
    </Card>
  )
}
