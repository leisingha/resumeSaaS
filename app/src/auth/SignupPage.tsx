import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { SignupForm } from "wasp/client/auth";
import { AuthPageLayout } from "./AuthPageLayout";

export function Signup() {
  return (
    <AuthPageLayout>
      <SignupForm />
      <br />
      <span className="text-sm text-white text-center">
        I already have an account (
        <WaspRouterLink to={routes.LoginRoute.to} className="underline">
          go to login
        </WaspRouterLink>
        ).
      </span>
      <br />
    </AuthPageLayout>
  );
}
