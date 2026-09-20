import { createAuthClient } from "better-auth/react";
import { adminClient, emailOTPClient } from "better-auth/client/plugins";
import { ac, admin as adminRole, user, facilityOwner } from "./permissions";

export const authClient = createAuthClient({
  plugins: [
    adminClient({
      ac,
      roles: {
        admin: adminRole,
        user,
        facilityOwner,
      },
    }),
    emailOTPClient(),
  ],
});
