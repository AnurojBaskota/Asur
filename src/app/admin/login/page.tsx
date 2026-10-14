"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { login } from "../actions";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="min-h-screen bg-asur-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-heading-lg font-bold tracking-[0.2em] text-asur-white">ASUR</h1>
          <p className="text-caption text-asur-slate mt-2 uppercase tracking-widest">Admin Dashboard</p>
        </div>

        <form action={formAction} className="space-y-5">
          <Input label="Email" id="email" name="email" type="email" autoComplete="username" required />
          <Input label="Password" id="password" name="password" type="password" autoComplete="current-password" required />
          {state?.error && <p className="text-body-sm text-status-error" role="alert">{state.error}</p>}
          <Button type="submit" fullWidth size="lg" loading={pending}>
            Sign In
          </Button>
        </form>

        <p className="mt-8 text-caption text-asur-slate text-center">
          Credentials are set by <span className="font-mono text-asur-silver">ADMIN_EMAIL</span> /{" "}
          <span className="font-mono text-asur-silver">ADMIN_PASSWORD</span> in <span className="font-mono">.env</span>
        </p>
      </div>
    </div>
  );
}
