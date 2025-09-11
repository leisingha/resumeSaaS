import { ForgotPasswordForm } from 'wasp/client/auth';
import { EmailAuthPageLayout } from '../EmailAuthPageLayout';

export function RequestPasswordResetPage() {
  return (
    <EmailAuthPageLayout>
      <ForgotPasswordForm />
    </EmailAuthPageLayout>
  );
}
