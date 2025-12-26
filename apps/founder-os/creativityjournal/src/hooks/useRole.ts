import { useSession } from 'next-auth/react';
import { hasRole, hasPermission, canPerformAction, ROLES } from '@/lib/roles';
import type { Role, Permission } from '@/lib/roles';

/**
 * Hook for role-based access control in React components
 */
export function useRole() {
  const { data: session } = useSession();
  
  const userRole = session?.user?.role || 'author';
  const isAuthenticated = !!session?.user;
  
  return {
    // User info
    userRole,
    isAuthenticated,
    user: session?.user,
    
    // Role checks
    isAdmin: userRole === ROLES.ADMIN,
    isAuthor: userRole === ROLES.AUTHOR,
    
    // Permission checks
    hasRole: (requiredRole: Role) => hasRole(userRole, requiredRole),
    hasPermission: (permission: Permission) => hasPermission(userRole, permission),
    canPerformAction: (action: string, resource: string) => canPerformAction(userRole, action, resource),
    
    // Utility functions
    canAccessAdmin: () => userRole === ROLES.ADMIN,
    canManageUsers: () => userRole === ROLES.ADMIN,
    canManageEntries: () => userRole === ROLES.ADMIN || userRole === ROLES.AUTHOR,
    canManageTasks: () => userRole === ROLES.ADMIN || userRole === ROLES.AUTHOR,
    canManageProjects: () => userRole === ROLES.ADMIN || userRole === ROLES.AUTHOR,
    canManageMoods: () => userRole === ROLES.ADMIN || userRole === ROLES.AUTHOR,
    canApproveEmotions: () => userRole === ROLES.ADMIN,
  };
}

/**
 * Hook for checking if user has minimum required role
 */
export function useRequireRole(requiredRole: Role) {
  const { userRole, isAuthenticated } = useRole();
  
  const hasRequiredRole = isAuthenticated && hasRole(userRole, requiredRole);
  const loading = !isAuthenticated; // Consider adding loading state from session
  
  return {
    hasRequiredRole,
    loading,
    userRole,
    isAuthenticated,
  };
}

/**
 * Hook for checking if user has specific permission
 */
export function useRequirePermission(permission: Permission) {
  const { userRole, isAuthenticated } = useRole();
  
  const hasRequiredPermission = isAuthenticated && hasPermission(userRole, permission);
  const loading = !isAuthenticated;
  
  return {
    hasRequiredPermission,
    loading,
    userRole,
    isAuthenticated,
  };
} 