import { type FC, type ReactNode, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { PAGE_ENDPOINTS} from '../../api/endpoints';

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

  useEffect(() => {
    const hasPermission = user?.roles?.some(role =>
      accessibleRoles.includes(role)
    );

    if (user && !hasPermission) {
      navigate(PAGE_ENDPOINTS.PERMISSION_DENIED_ENDPOINT, { replace: true });
    }
  }, [user, accessibleRoles, navigate]);

  return <>{children}</>;
};

export default RoleBasedGuard;