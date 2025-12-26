import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

// Role definitions
export const ROLES = {
  ADMIN: 'admin',
  AUTHOR: 'author',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Permission definitions
export const PERMISSIONS = {
  ADMIN_FULL_ACCESS: 'admin:full_access',
  ADMIN_EMOTION_MANAGEMENT: 'admin:emotion_management',
  ADMIN_USER_MANAGEMENT: 'admin:user_management',
  AUTHOR_ENTRY_MANAGEMENT: 'author:entry_management',
  AUTHOR_MOOD_MANAGEMENT: 'author:mood_management',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role hierarchy - higher index means higher privilege
const ROLE_HIERARCHY = [ROLES.AUTHOR, ROLES.ADMIN];

/**
 * Check if a role has permission to access a resource
 */
export function hasRole(userRole: string, requiredRole: Role): boolean {
  const userRoleIndex = ROLE_HIERARCHY.indexOf(userRole as Role);
  const requiredRoleIndex = ROLE_HIERARCHY.indexOf(requiredRole);
  
  return userRoleIndex >= requiredRoleIndex;
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(userRole: string, permission: Permission): boolean {
  // Admin has all permissions
  if (userRole === ROLES.ADMIN) {
    return true;
  }
  
  // Author permissions
  if (userRole === ROLES.AUTHOR) {
    return [
      PERMISSIONS.AUTHOR_ENTRY_MANAGEMENT,
      PERMISSIONS.AUTHOR_MOOD_MANAGEMENT,
    ].includes(permission);
  }
  
  return false;
}

/**
 * Middleware to check if user has required role
 */
export async function requireRole(request: NextRequest, requiredRole: Role) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (!hasRole(session.user.role, requiredRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  return null; // Continue with request
}

/**
 * Middleware to check if user has required permission
 */
export async function requirePermission(request: NextRequest, permission: Permission) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (!hasPermission(session.user.role, permission)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  return null; // Continue with request
}

/**
 * Higher-order function to protect API routes with role requirements
 */
export function withRoleAuth(requiredRole: Role) {
  return function (handler: (request: NextRequest, context: any) => Promise<NextResponse>) {
    return async function (request: NextRequest, context: any) {
      const authError = await requireRole(request, requiredRole);
      if (authError) {
        return authError;
      }
      
      return handler(request, context);
    };
  };
}

/**
 * Higher-order function to protect API routes with permission requirements
 */
export function withPermissionAuth(permission: Permission) {
  return function (handler: (request: NextRequest, context: any) => Promise<NextResponse>) {
    return async function (request: NextRequest, context: any) {
      const authError = await requirePermission(request, permission);
      if (authError) {
        return authError;
      }
      
      return handler(request, context);
    };
  };
}

/**
 * Check if a user can perform an action on a resource
 */
export function canPerformAction(userRole: string, action: string, resource: string): boolean {
  // Admin can perform all actions
  if (userRole === ROLES.ADMIN) {
    return true;
  }
  
  // Author permissions
  if (userRole === ROLES.AUTHOR) {
    // Authors can manage their own entries, tasks, projects, etc.
    if (resource === 'entry' || resource === 'task' || resource === 'project' || resource === 'mood') {
      return ['create', 'read', 'update', 'delete'].includes(action);
    }
    
    // Authors cannot access admin functions
    if (resource === 'admin' || resource === 'user_management' || resource === 'system_settings') {
      return false;
    }
  }
  
  return false;
}

/**
 * Get user-friendly role display name
 */
export function getRoleDisplayName(role: string): string {
  switch (role) {
    case ROLES.ADMIN:
      return 'Administrator';
    case ROLES.AUTHOR:
      return 'Author';
    default:
      return 'Unknown';
  }
}

/**
 * Get role color for UI display
 */
export function getRoleColor(role: string): string {
  switch (role) {
    case ROLES.ADMIN:
      return 'bg-red-100 text-red-800';
    case ROLES.AUTHOR:
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
} 