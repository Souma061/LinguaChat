const env = (globalThis as { process?: { env?: Record<string, string | undefined> } })
  .process?.env ?? {};

export const mobileConfig = {
  apiUrl: env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000/api",
  socketUrl: env.EXPO_PUBLIC_SOCKET_URL ?? "http://localhost:5000",
} as const;
