import { SessionPayload } from './session';

export class AuthorizationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 403) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = statusCode;
  }
}

/**
 * Enforce that a valid authenticated session exists
 */
export function requireAuth(session: SessionPayload | null): SessionPayload {
  if (!session || !session.userId) {
    throw new AuthorizationError('Authentication required to access this resource', 401);
  }
  return session;
}

/**
 * Enforce that the user has the ADMIN role
 */
export function requireAdmin(session: SessionPayload | null): SessionPayload {
  const user = requireAuth(session);
  if (user.role !== 'ADMIN') {
    throw new AuthorizationError('Forbidden: Administrator privileges required', 403);
  }
  return user;
}

/**
 * Enforce that the user possesses one of the authorized roles
 */
export function requireRole(
  session: SessionPayload | null,
  allowedRoles: Array<'USER' | 'TEACHER' | 'ADMIN'>
): SessionPayload {
  const user = requireAuth(session);
  const userRole = user.role || 'USER';
  if (!allowedRoles.includes(userRole)) {
    throw new AuthorizationError(
      `Forbidden: Required role in [${allowedRoles.join(', ')}]`,
      403
    );
  }
  return user;
}

/**
 * Enforce Row-Level Security: Only the owner or an ADMIN may mutate or access this resource
 */
export function requireOwnerOrAdmin(
  session: SessionPayload | null,
  resourceOwnerId: string
): SessionPayload {
  const user = requireAuth(session);
  const isOwner = user.userId === resourceOwnerId;
  const isAdmin = user.role === 'ADMIN';

  if (!isOwner && !isAdmin) {
    throw new AuthorizationError(
      'Forbidden: You do not have permission to modify or access this resource',
      403
    );
  }
  return user;
}
