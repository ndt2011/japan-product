const LOGIN_ID_KEY = "sf_saved_login_id";
const REMEMBER_KEY = "sf_remember_login";

export function loadSavedLogin(): { loginId: string; rememberMe: boolean } {
  if (typeof window === "undefined") {
    return { loginId: "", rememberMe: false };
  }
  const rememberMe = localStorage.getItem(REMEMBER_KEY) === "1";
  const loginId = rememberMe ? (localStorage.getItem(LOGIN_ID_KEY) ?? "") : "";
  return { loginId, rememberMe };
}

export function persistSavedLogin(loginId: string, rememberMe: boolean): void {
  if (typeof window === "undefined") return;
  if (rememberMe && loginId.trim()) {
    localStorage.setItem(LOGIN_ID_KEY, loginId.trim());
    localStorage.setItem(REMEMBER_KEY, "1");
  } else {
    localStorage.removeItem(LOGIN_ID_KEY);
    localStorage.removeItem(REMEMBER_KEY);
  }
}
