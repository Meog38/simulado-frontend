export function tokenHasRole(token: string, rolesClaim: string, role: string): boolean {
  try {
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload) return false;

    const base64 = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(atob(paddedBase64), (character) => character.charCodeAt(0)),
      ),
    ) as Record<string, unknown>;
    const claim = payload[rolesClaim];
    const roles = typeof claim === "string" ? [claim] : claim;
    const permissions = payload.permissions;
    const requiredPermission = role === "ADMIN" ? "avaliacoes:write" : "avaliacoes:read";

    return (
      (Array.isArray(roles) && roles.some((value) => value === role)) ||
      (Array.isArray(permissions) && permissions.includes(requiredPermission))
    );
  } catch {
    return false;
  }
}
