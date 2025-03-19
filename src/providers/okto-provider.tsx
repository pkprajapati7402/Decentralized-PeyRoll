"use client";

import { OktoProvider, BuildType } from "okto-sdk-react";

interface OktoProviderProps {
    children: React.ReactNode;
}

export function OktoProviderComponent({ children }: OktoProviderProps) {
  return (
     <OktoProvider
        apiKey="1c3f2fac-662f-47f0-b5bb-1cedab4581da"
        buildType={BuildType.SANDBOX}
    >
      {children}
    </OktoProvider>
  );
}