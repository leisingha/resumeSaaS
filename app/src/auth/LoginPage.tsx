import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { LoginForm } from "wasp/client/auth";
import { AuthPageLayout } from "./AuthPageLayout";

export default function Login() {
  return (
    <AuthPageLayout>
      <LoginForm />
      <br />
      <span className="text-sm text-white text-center">
        Don't have an account yet?{" "}
        <WaspRouterLink to={routes.SignupRoute.to} className="underline">
          go to signup
        </WaspRouterLink>
        .
      </span>
      <br />
      <span className="text-sm text-white text-center">
        Forgot your password?{" "}
        <WaspRouterLink
          to={routes.RequestPasswordResetRoute.to}
          className="underline"
        >
          reset it
        </WaspRouterLink>
        .
      </span>
    </AuthPageLayout>
  );
}
