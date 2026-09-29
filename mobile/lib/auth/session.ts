import * as SecureStore from "expo-secure-store";
import { useSyncExternalStore } from "react";

/**
 * โทเคนเซสชันเก็บใน Keychain เท่านั้น (แผน IOS_APP_PLAN ข้อ 6 — ห้าม AsyncStorage)
 * โทเคนคือ `payload.signature` เดียวกับคุกกี้ `tarot_auth_session` ของเว็บ
 */
const TOKEN_KEY = "seertarot.session";
const USER_KEY = "seertarot.user";

export interface AppUser {
  id: string;
  name: string;
  email?: string | null;
}

interface SessionState {
  ready: boolean;
  token: string | null;
  user: AppUser | null;
}

let state: SessionState = { ready: false, token: null, user: null };
const listeners = new Set<() => void>();

function setState(next: SessionState) {
  state = next;
  listeners.forEach((l) => l());
}

/** เรียกครั้งเดียวตอนเปิดแอป — อ่านโทเคนจาก Keychain */
export async function loadSession(): Promise<void> {
  try {
    const [token, userJson] = await Promise.all([
      SecureStore.getItemAsync(TOKEN_KEY),
      SecureStore.getItemAsync(USER_KEY),
    ]);
    setState({ ready: true, token, user: userJson ? (JSON.parse(userJson) as AppUser) : null });
  } catch {
    // Keychain อ่านไม่ได้ = ถือว่ายังไม่ล็อกอิน ไม่ทำให้แอปเปิดไม่ขึ้น
    setState({ ready: true, token: null, user: null });
  }
}

export async function saveSession(token: string, user: AppUser): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(TOKEN_KEY, token),
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
  ]);
  setState({ ready: true, token, user });
}

export async function clearSession(): Promise<void> {
  await Promise.all([SecureStore.deleteItemAsync(TOKEN_KEY), SecureStore.deleteItemAsync(USER_KEY)]).catch(
    () => undefined,
  );
  setState({ ready: true, token: null, user: null });
}

export function getToken(): string | null {
  return state.token;
}

export function useSession(): SessionState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state,
  );
}
