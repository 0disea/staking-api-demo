import { AuthButton } from "@/src/components/AuthButton";
import { ExternalAddressStaking } from "@/src/components/ExternalAddressStaking";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950 bg-opacity-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-slate-100">
                CDP Staking Demo
              </h1>
              <span className="text-xs text-slate-500 border border-slate-700 px-2 py-1 rounded-md">
                Hoodi Testnet
              </span>
            </div>
            <AuthButton />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-500 mb-1">Red</h3>
              <p className="text-slate-100">Hoodi Testnet</p>
              <p className="text-xs text-slate-600 mt-1">Chain ID: 560048</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-500 mb-1">
                Mínimo Stake
              </h3>
              <p className="text-slate-100">0.001 ETH</p>
              <p className="text-xs text-slate-600 mt-1">
                Sin requisito de 32 ETH
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-500 mb-1">
                Comisión
              </h3>
              <p className="text-slate-100">15%</p>
              <p className="text-xs text-slate-600 mt-1">
                Liquidación automática
              </p>
            </div>
          </div>

          {/* Main Component */}
          <ExternalAddressStaking />

          {/* Features */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900 bg-opacity-50 border border-slate-800 rounded-xl">
              <h4 className="text-sm font-semibold text-slate-400 mb-1">
                🔐 Auto-Custodia
              </h4>
              <p className="text-xs text-slate-500">
                Mantienes control total de tus claves. Firma transacciones con
                tu wallet.
              </p>
            </div>
            <div className="p-4 bg-slate-900 bg-opacity-50 border border-slate-800 rounded-xl">
              <h4 className="text-sm font-semibold text-slate-400 mb-1">
                ⚡ CDP Powered
              </h4>
              <p className="text-xs text-slate-500">
                Infraestructura de Coinbase para operaciones de staking
                confiables.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
