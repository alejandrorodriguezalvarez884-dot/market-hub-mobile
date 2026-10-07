// Who is signed in. The portal checks the password and hands back a token; the app keeps it in
// the phone's keychain, sends it with every request and asks for a fresh one each time it opens.
import { createContext, use, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { api, onRefused, setToken } from "./api";
import { read, write } from "./storage";
import type { User } from "./types";

const KEY = "mh.session";
type Kept = { token: string; user: User };
type Entered = Kept & { new: boolean; has_data: boolean };

type Session = {
  user: User | null;
  // True until the kept session, if there is one, has been read.
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const Context = createContext<Session | null>(null);

export function useSession(): Session {
  const value = use(Context);
  if (!value) throw new Error("useSession is used outside <SessionProvider>");
  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const keep = useCallback(async (kept: Kept | null) => {
    setToken(kept?.token ?? null);
    setUser(kept?.user ?? null);
    await write(KEY, kept ? JSON.stringify(kept) : null);
  }, []);

  const signOut = useCallback(() => keep(null), [keep]);

  useEffect(() => {
    onRefused(() => void signOut());
    return () => onRefused(null);
  }, [signOut]);

  useEffect(() => {
    let alive = true;
    (async () => {
      let kept: Kept | null = null;
      try {
        kept = JSON.parse((await read(KEY)) ?? "null");
      } catch {
        kept = null;
      }
      if (!alive) return;
      if (kept?.token && kept.user?.id) {
        setToken(kept.token);
        setUser(kept.user);
      }
      setLoading(false);
      if (!kept?.token) return;
      // A token lasts a month from the day it was issued: one asked for at each launch keeps a
      // phone that is used signed in. With no connection the kept one goes on being used.
      try {
        const fresh = await api<Kept>("/api/app/auth/renew", { method: "POST" });
        if (alive) await keep({ token: fresh.token, user: fresh.user });
      } catch {
        // Refused: api() has already signed the session out. Unreachable: the kept token stays.
      }
    })();
    return () => {
      alive = false;
    };
  }, [keep]);

  const signIn = useCallback(async (email: string, password: string) => {
    const entered = await api<Entered>("/api/app/auth/password", { method: "POST", body: { email: email.trim(), password } });
    await keep({ token: entered.token, user: entered.user });
  }, [keep]);

  const value = useMemo(() => ({ user, loading, signIn, signOut }), [user, loading, signIn, signOut]);
  return <Context value={value}>{children}</Context>;
}
