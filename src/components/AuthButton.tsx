"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { LogOut, User, Wallet } from "lucide-react";

export function AuthButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { address, isConnected } = useAccount();

  if (!ready) {
    return (
      <button
        disabled
        className="px-6 py-3 bg-slate-700 text-slate-400 rounded-xl cursor-not-allowed"
      >
        Cargando...
      </button>
    );
  }

  if (!authenticated) {
    return (
      <button
        onClick={login}
        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white font-medium rounded-xl transition-all duration-200"
      >
        <Wallet className="h-5 w-5" />
        Conectar Wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm">
        <div className="flex items-center gap-2 text-slate-500">
          <User className="h-4 w-4" />
          {user?.email?.address ||
            `${address?.slice(0, 6)}...${address?.slice(-4)}`}
        </div>
        {isConnected && (
          <div className="text-xs text-slate-400 mt-1">✓ Wallet conectada</div>
        )}
      </div>
      <button
        onClick={logout}
        className="p-2 text-slate-500 hover:text-slate-200 transition-colors"
        title="Desconectar"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </div>
  );
}
