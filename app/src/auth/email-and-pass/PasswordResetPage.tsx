import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { ResetPasswordForm } from 'wasp/client/auth';
import { EmailAuthPageLayout } from '../EmailAuthPageLayout';

export function PasswordResetPage() {
  return (
    <EmailAuthPageLayout>
      <ResetPasswordForm />
      <br />
      <span className='text-sm font-medium text-gray-900'>
        If everything is okay, <WaspRouterLink to={routes.LoginRoute.to}>go to login</WaspRouterLink>
      </span>
    </EmailAuthPageLayout>
  );
}
