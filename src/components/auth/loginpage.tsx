"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Sun } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ModeToggle } from "@/components/common/ModeToggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth/client";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        toast.error(result.error.message ?? "Invalid email or password");
        return;
      }

      toast.success("Welcome back!");
      router.replace("/dashboard");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background bg-linear-to-br from-orange-50/90 via-background to-amber-100/50 text-foreground dark:from-orange-950/35 dark:via-background dark:to-amber-950/20">
      <div
        className="pointer-events-none absolute -left-32 top-1/4 size-96 rounded-full bg-orange-400/15 blur-3xl dark:bg-orange-500/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-1/4 size-80 rounded-full bg-amber-400/20 blur-3xl dark:bg-amber-600/10"
        aria-hidden
      />

      <div className="absolute inset-e-4 top-4 z-10 sm:inset-e-6 sm:top-6">
        <ModeToggle />
      </div>

      <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/30 dark:bg-orange-500 dark:shadow-orange-950/60">
              <Sun className="size-8" aria-hidden />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              SolarERP
            </h1>
            <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
              PM Surya Ghar Yojana Platform
            </p>
          </div>

          <Card className="mx-auto w-full border-border/60 bg-card/80 shadow-lg shadow-black/5 backdrop-blur-sm dark:bg-card/90 dark:shadow-black/40">
            <CardHeader className="space-y-2 pb-2 text-center">
              <CardTitle className="text-2xl font-bold tracking-tight text-card-foreground">
                Sign in
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Enter your credentials to continue
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-2">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4 text-left"
              >
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    aria-invalid={!!errors.email}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive" role="alert">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className="pr-10"
                      placeholder="••••••••"
                      aria-invalid={!!errors.password}
                      {...register("password")}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-e-1 top-1/2 size-8 -translate-y-1/2 text-muted-foreground hover:bg-accent hover:text-foreground"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" aria-hidden />
                      ) : (
                        <Eye className="size-4" aria-hidden />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive" role="alert">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-10 w-full gap-2 bg-orange-600 font-medium text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
                >
                  {loading && (
                    <Loader2 className="size-4 shrink-0 animate-spin" />
                  )}
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/sign-up"
                  className="font-medium text-orange-600 underline-offset-4 hover:text-orange-700 hover:underline dark:text-orange-400 dark:hover:text-orange-300"
                >
                  Sign Up
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
