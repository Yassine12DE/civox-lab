import { Navigate } from "react-router-dom";
import { clearTokens, getAccessToken } from "../utils/tokenStorage";
import { clearExpiredToken, getTokenRole } from "../utils/authToken";

export default function ProtectedRoute({
  children,
  allowedRoles,
  loginPath = "/login",
  forbiddenPath = "/forbidden",
}) {
  if (clearExpiredToken()) {
    return <Navigate to={loginPath} replace />;
  }

  const token = getAccessToken();

  if (!token) {
    return <Navigate to={loginPath} replace />;
  }

  if (allowedRoles?.length) {
    const role = getTokenRole();

    if (!role) {
      clearTokens();
      return <Navigate to={loginPath} replace />;
    }

    if (!allowedRoles.includes(role)) {
      return <Navigate to={forbiddenPath} replace />;
    }
  }

  return children;
}
