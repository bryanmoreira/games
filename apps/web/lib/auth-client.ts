import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields, usernameClient } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

// Mesmo domínio do site: não precisa de baseURL
export const authClient = createAuthClient({ plugins: [usernameClient(), inferAdditionalFields<typeof auth>()] });
