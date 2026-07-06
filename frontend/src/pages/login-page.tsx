import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { LockKeyhole } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentUser, useLogin } from "@/features/authentication/hooks/use-auth";

const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required."),
  password: z.string().min(1, "Password is required.")
});

type LoginFormValues = z.infer<typeof loginSchema>;

type LocationState = {
  from?: {
    pathname?: string;
  };
};

function getLoginErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) {
    return "Unable to sign in. Try again.";
  }

  if (!error.response) {
    return "Login request could not reach the backend. Check the backend server and browser origin.";
  }

  if (error.response.status === 400) {
    return "Invalid username or password.";
  }

  if (error.response.status === 403) {
    return "Login was blocked by CSRF protection. Refresh the page and try again.";
  }

  return "Unable to sign in. Try again.";
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUserQuery = useCurrentUser();
  const loginMutation = useLogin();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });

  if (currentUserQuery.data) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    const user = await loginMutation.mutateAsync(values);
    if (user) {
      const state = location.state as LocationState | null;
      navigate(state?.from?.pathname ?? "/", { replace: true });
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </div>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use your engineering workspace account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username">Username or email</Label>
              <Input
                id="username"
                autoComplete="username"
                disabled={loginMutation.isPending}
                {...form.register("username")}
              />
              {form.formState.errors.username ? (
                <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                disabled={loginMutation.isPending}
                {...form.register("password")}
              />
              {form.formState.errors.password ? (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              ) : null}
            </div>
            {loginMutation.isError ? (
              <p className="text-sm text-destructive">
                {getLoginErrorMessage(loginMutation.error)}
              </p>
            ) : null}
            <Button className="w-full" disabled={loginMutation.isPending} type="submit">
              {loginMutation.isPending ? "Signing in" : "Sign in"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Need an account?{" "}
              <Link className="font-medium text-primary hover:underline" to="/signup">
                Create one
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
