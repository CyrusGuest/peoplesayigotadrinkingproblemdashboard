import { ReactNode } from 'react';
import { useRole } from '../../hooks/useRole';

interface RoleBasedContentProps {
  adminContent?: ReactNode;
  creatorContent?: ReactNode;
  fallbackContent?: ReactNode;
  roles?: ('admin' | 'creator')[];
}

export default function RoleBasedContent({
  adminContent,
  creatorContent,
  fallbackContent,
  roles
}: RoleBasedContentProps) {
  const { isAdmin, isCreator, hasRole } = useRole();

  // If specific roles are required, check if user has any of them
  if (roles && !hasRole(roles)) {
    return fallbackContent ? <>{fallbackContent}</> : null;
  }

  // Render content based on role
  if (isAdmin && adminContent) {
    return <>{adminContent}</>;
  }

  if (isCreator && creatorContent) {
    return <>{creatorContent}</>;
  }

  // Fallback content if no role-specific content is provided
  return fallbackContent ? <>{fallbackContent}</> : null;
} 