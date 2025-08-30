"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { baseSepolia } from "viem/chains";
import { http } from "viem";
import { ReactNode } from "react";
import { hoodi } from "@/src/chains/hoodi";

const queryClient = new QueryClient();

// Configurar Hoodi y Base Sepolia para compatibilidad
const wagmiConfig = createConfig({
  chains: [hoodi, baseSepolia],
  transports: {
    [hoodi.id]: http("<https://rpc.hoodi.ethpandaops.io>"),
    [baseSepolia.id]: http(),
  },
});

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#64748B", // Slate-500 para tema más sutil
        },
        loginMethods: ["email", "wallet"],
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
          requireUserPasswordOnCreate: false,
        },
        supportedChains: [hoodi, baseSepolia],
        defaultChain: hoodi,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
