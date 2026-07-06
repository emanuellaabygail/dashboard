import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentUser, useSignUp } from "@/features/authentication/hooks/use-auth";

const signupSchema = z
  .object({
    username: z.string().min(1, "Username is required."),
    email: z.string().email("Use a valid email address.").or(z.literal("")),
    first_name: z.string(),
    last_name: z.string(),
    password: z.string().min(8, "Password must be at least 8 characters."),
    password_confirm: z.string().min(1, "Confirm your password.")
  })
  .refine((values) => values.password === values.password_confirm, {
    message: "Passwords do not match.",
    path: ["password_confirm"]
  });

type SignUpFormValues = z.infer<typeof signupSchema>;

export function SignUpPage() {
  const navigate = useNavigate();
  const currentUserQuery = useCurrentUser();
  const signUpMutation = useSignUp();
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      password_confirm: ""
    }
  });

  if (currentUserQuery.data) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    const user = await signUpMutation.mutateAsync(values);
    if (user) {
      navigate("/", { replace: true });
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
            <UserPlus className="size-5" aria-hidden="true" />
          </div>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Create a workspace account and sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">First name</Label>
                <Input
                  id="first_name"
                  autoComplete="given-name"
                  disabled={signUpMutation.isPending}
                  {...form.register("first_name")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last name</Label>
                <Input
                  id="last_name"
                  autoComplete="family-name"
                  disabled={signUpMutation.isPending}
                  {...form.register("last_name")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                disabled={signUpMutation.isPending}
                {...form.register("username")}
              />
              {form.formState.errors.username ? (
                <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                autoComplete="email"
                disabled={signUpMutation.isPending}
                type="email"
                {...form.register("email")}
              />
              {form.formState.errors.email ? (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  autoComplete="new-password"
                  disabled={signUpMutation.isPending}
                  type="password"
                  {...form.register("password")}
                />
                {form.formState.errors.password ? (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password_confirm">Confirm</Label>
                <Input
                  id="password_confirm"
                  autoComplete="new-password"
                  disabled={signUpMutation.isPending}
                  type="password"
                  {...form.register("password_confirm")}
                />
                {form.formState.errors.password_confirm ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.password_confirm.message}
                  </p>
                ) : null}
              </div>
            </div>
            {signUpMutation.isError ? (
              <p className="text-sm text-destructive">Account creation failed. Check your details and try again.</p>
            ) : null}
            <Button className="w-full" disabled={signUpMutation.isPending} type="submit">
              {signUpMutation.isPending ? "Creating account" : "Create account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link className="font-medium text-primary hover:underline" to="/login">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
