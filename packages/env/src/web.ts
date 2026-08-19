import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const convexUrlSchema = (exampleHost: string) =>
  z.url().refine((url) => new URL(url).hostname !== exampleHost, {
    message: `Replace the ${exampleHost} placeholder before running the app`,
  });

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_CONVEX_URL: convexUrlSchema("example.convex.cloud"),
    VITE_CONVEX_SITE_URL: convexUrlSchema("example.convex.site"),
    VITE_AZURE_DEVOPS_CLIENT_ID: z.string().min(1).optional(),
    VITE_AZURE_DEVOPS_TENANT_ID: z.string().min(1).optional(),
  },
  runtimeEnv: (import.meta as any).env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
