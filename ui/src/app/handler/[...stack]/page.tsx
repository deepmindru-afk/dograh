import { StackHandler } from "@stackframe/stack";

import { getAuthProvider } from "@/lib/auth/config";

import { BackButton } from "./BackButton";

export default async function Handler(props: unknown) {
  const authProvider = await getAuthProvider();

  if (authProvider === "local") {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Режим локальной аутентификации</h1>
        <p>Обработчик Stack Auth отключён при использовании локальной аутентификации.</p>
      </div>
    );
  }

  // Lazily import the real StackServerApp only when needed
  const { getStackServerApp } = await import("@/lib/auth/server");
  const app = await getStackServerApp();

  return (
    <div className="flex flex-col h-screen">
      <BackButton />
      <div className="flex-1 overflow-auto">
        <StackHandler
          fullPage
          app={app!}
          routeProps={props}
        />
      </div>
    </div>
  );
}
