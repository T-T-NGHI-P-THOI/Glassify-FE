import { type FC, type ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { PAGE_ENDPOINTS } from '../../api/endpoints';

export interface RoleBasedGuardProps {
  accessibleRoles: Array<string>;
  children: ReactNode;
}

const RoleBasedGuard: FC<RoleBasedGuardProps> = ({
  children,
  accessibleRoles,
}) => {
  const { user } = useAuth();

  const hasPermission = user?.roles?.some((role: any) =>
    accessibleRoles.includes(role)
  );

  if (import.meta.env.DEV) {
    console.log('RoleBasedGuard check: ', user?.roles);
  }

  if (user && !hasPermission) {
    return <Navigate to={PAGE_ENDPOINTS.PERMISSION_DENIED_ENDPOINT} replace />;
  }

  return <>{children}</>;
};

export default RoleBasedGuard;