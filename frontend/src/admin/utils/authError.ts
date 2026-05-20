import { NavigateFunction } from "react-router-dom";

export function handleAuthError(
  error: unknown,
  navigate: NavigateFunction,
): void {
  if ((error as { response?: { status?: number } })?.response?.status === 401) {
    navigate("/admin/login");
  }
}
