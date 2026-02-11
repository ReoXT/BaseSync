import { Polar } from "@polar-sh/sdk";

// Lazy initialization - only create client if Polar env vars are configured
let _polarClient: Polar | null = null;

export function getPolarClient(): Polar {
  if (_polarClient) {
    return _polarClient;
  }

  const accessToken = process.env.POLAR_ORGANIZATION_ACCESS_TOKEN;
  const sandboxMode = process.env.POLAR_SANDBOX_MODE;

  if (!accessToken || !sandboxMode) {
    throw new Error(
      'Polar payment provider is not configured. Set POLAR_ORGANIZATION_ACCESS_TOKEN and POLAR_SANDBOX_MODE environment variables.'
    );
  }

  _polarClient = new Polar({
    accessToken,
    server: sandboxMode === "true" ? "sandbox" : "production",
  });

  return _polarClient;
}

// For backwards compatibility - but will throw if env vars not set
export const polarClient = new Proxy({} as Polar, {
  get(target, prop) {
    return getPolarClient()[prop as keyof Polar];
  }
});
