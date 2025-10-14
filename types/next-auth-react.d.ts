import type { Session } from "next-auth";
import type { ComponentType, ReactNode } from "react";

declare module "next-auth/react" {
  type SessionStatus = "loading" | "authenticated" | "unauthenticated";

  interface UseSessionOptions {
    required?: boolean;
    onUnauthenticated?: () => void;
  }

  interface SessionContextValue {
    data: Session | null;
    status: SessionStatus;
    update(data?: Session | null): Promise<Session | null>;
  }

  interface SignInOptions extends Record<string, unknown> {
    callbackUrl?: string;
    redirect?: boolean;
  }

  interface SignInResponse {
    error?: string | null;
    status: number;
    ok: boolean;
    url?: string | null;
  }

  interface SignOutParams {
    callbackUrl?: string;
    redirect?: boolean;
  }

  interface SessionProviderProps {
    children?: ReactNode;
    session?: Session | null;
  }

  export function useSession(options?: UseSessionOptions): SessionContextValue;
  export function signIn(
    provider?: string,
    options?: SignInOptions,
    authorizationParams?: Record<string, string>
  ): Promise<SignInResponse | undefined>;
  export function signOut(options?: SignOutParams): Promise<unknown>;
  export function getSession(): Promise<Session | null>;
  export const SessionProvider: ComponentType<SessionProviderProps>;
}
