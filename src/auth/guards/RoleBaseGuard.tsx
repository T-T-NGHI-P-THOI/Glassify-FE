import { type FC, type ReactNode, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  const hasPermission = user?.roles?.some((role: any) =>
    accessibleRoles.includes(role)
  );

  if (import.meta.env.DEV) {
    console.log('RoleBasedGuard check: ', user.roles);
  }

  if (user && !hasPermission) {
    navigate(PAGE_ENDPOINTS.PERMISSION_DENIED_ENDPOINT, { replace: true });
  }

  return <>{children}</>;
};

export default RoleBasedGuard;