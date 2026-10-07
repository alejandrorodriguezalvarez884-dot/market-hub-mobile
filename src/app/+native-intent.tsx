// A link that opens the app. The only one there is brings the browser back from signing in with
// Google (…/auth?code=…): the sign-in screen is already waiting for it, so it is not a screen to
// go to. Without this, Android would look for a screen called "auth" and find none.
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    return /(^|\/)auth(\?|$)/.test(path) ? "/" : path;
  } catch {
    return "/";
  }
}
