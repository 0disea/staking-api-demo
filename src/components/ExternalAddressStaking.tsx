"use client";

import { useState } from "react";
import { useAccount, useSwitchChain, useWalletClient } from "wagmi";
import {
  getStakingInfo,
  buildStakeTransaction,
  buildUnstakeTransaction,
  buildClaimTransaction,
  StakingInfo,
} from "@/src/lib/cdp-client";
import { Loader2, ExternalLink, Send } from "lucide-react";

export function ExternalAddressStaking() {
  const { address: connectedAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChain } = useSwitchChain();
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [status, setStatus] = useState("");
  const [stakingInfo, setStakingInfo] = useState<StakingInfo | null>(null);
  const [transactionData, setTransactionData] = useState<any>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Inicializar External Address
  const handleInitializeExternal = async () => {
    if (!connectedAddress) {
      setStatus("Por favor conecta tu wallet primero");
      return;
    }

    setLoading(true);
    setStatus("Obteniendo información de staking...");
    try {
      const info = await getStakingInfo(connectedAddress);
      setStakingInfo(info);
      setInitialized(true);
      setStatus("¡CDP staking inicializado exitosamente!");
    } catch (error) {
      setStatus(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  // Actualizar información
  const refreshInfo = async () => {
    if (!connectedAddress || !initialized) return;

    try {
      const info = await getStakingInfo(connectedAddress);
      setStakingInfo(info);
    } catch (error) {
      console.error("Failed to refresh info:", error);
    }
  };

  // Construir transacción de stake
  const handleBuildStake = async (amount: string) => {
    if (!connectedAddress || !initialized) {
      setStatus("Por favor inicializa CDP staking primero");
      return;
    }

    setLoading(true);
    setStatus(`Construyendo transacción de stake por ${amount} ETH...`);
    try {
      const stakeData = await buildStakeTransaction(connectedAddress, amount);
      setTransactionData(stakeData);
      setStatus(`¡Transacción lista! Firma y envía con tu wallet.`);
      await refreshInfo();
    } catch (error) {
      setStatus(
        `Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  // Construir transacción de unstake
  const handleBuildUnstake = async (amount: string) => {
    if (!connectedAddress || !initialized) {
      setStatus("Por favor inicializa CDP staking primero");
      return;
    }

    setLoading(true);
    setStatus(`Construyendo transacción de unstake por ${amount} ETH...`);
    try {
      const unstakeData = await buildUnstakeTransaction(
        connectedAddress,
        amount,
      );
      setTransactionData(unstakeData);
      setStatus(`¡Transacción lista! Firma y envía con tu wallet.`);
      await refreshInfo();
    } catch (error) {
      setStatus(
        `Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  // Construir transacción de claim
  const handleBuildClaim = async () => {
    if (!connectedAddress || !initialized) {
      setStatus("Por favor inicializa CDP staking primero");
      return;
    }

    setLoading(true);
    setStatus("Construyendo transacción de reclamo...");
    try {
      const claimData = await buildClaimTransaction(connectedAddress);
      setTransactionData(claimData);
      setStatus(`¡Transacción lista! Reclama ${claimData.amount} ETH.`);
      await refreshInfo();
    } catch (error) {
      setStatus(
        `Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  // Firmar y enviar transacción
  const handleSignAndSend = async () => {
    if (!walletClient || !transactionData || !transactionData.transactions) {
      setStatus("No hay transacción para firmar");
      return;
    }

    setSigning(true);
    setStatus("Cambiando a la red Hoodi y enviando transacción...");

    try {
      // IMPORTANTE: Verificar y cambiar a la cadena correcta (Hoodi - 560048)
      const currentChainId = await walletClient.getChainId();
      if (currentChainId !== 560048) {
        setStatus("Cambiando a la red Hoodi...");
        await switchChain({ chainId: 560048 });
        // Esperar a que el cambio de cadena se complete
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Obtener la transacción
      let tx = transactionData.transactions[0];

      // Decodificar si viene en formato hex
      if (typeof tx === "string" && tx.startsWith("7b")) {
        const hexString = tx;
        const jsonString = Buffer.from(hexString, "hex").toString("utf8");
        tx = JSON.parse(jsonString);
      }

      if (!tx || typeof tx !== "object") {
        throw new Error("Invalid transaction data");
      }

      // Extraer campos de la transacción
      const toAddress = tx.to || tx.toAddressId;
      const inputData = tx.input || tx.data;

      if (!toAddress || !inputData) {
        throw new Error("Transaction missing required fields");
      }

      // Construir parámetros de transacción
      const transactionParams: any = {
        to: toAddress as `0x${string}`,
        data: inputData as `0x${string}`,
        value: tx.value ? BigInt(tx.value) : BigInt(0),
        chainId: 560048, // Especificar explícitamente la cadena Hoodi
      };

      // Agregar parámetros de gas si existen
      if (tx.gas) {
        transactionParams.gas = BigInt(tx.gas);
      }

      // Usar EIP-1559 o legacy gas
      if (tx.maxFeePerGas || tx.maxPriorityFeePerGas) {
        if (tx.maxFeePerGas) {
          transactionParams.maxFeePerGas = BigInt(tx.maxFeePerGas);
        }
        if (tx.maxPriorityFeePerGas) {
          transactionParams.maxPriorityFeePerGas = BigInt(
            tx.maxPriorityFeePerGas,
          );
        }
      } else if (tx.gasPrice) {
        transactionParams.gasPrice = BigInt(tx.gasPrice);
      }

      // Enviar transacción
      const hash = await walletClient.sendTransaction(transactionParams);

      setTxHash(hash);
      setStatus(`¡Transacción enviada! Hash: ${hash.slice(0, 10)}...`);
      setTransactionData(null);

      // Actualizar info después de un momento
      setTimeout(() => {
        refreshInfo();
      }, 5000);
    } catch (error) {
      console.error("Error signing transaction:", error);
      setStatus(
        `Error al firmar: ${error instanceof Error ? error.message : "Error"}`,
      );
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl p-8 border border-slate-800">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-slate-100">CDP Staking Demo</h3>
        <p className="text-slate-400 mt-2">
          Staking de ETH usando Coinbase Developer Platform
        </p>
      </div>

      <div className="space-y-4">
        {/* Botón de inicialización */}
        {!initialized && connectedAddress && (
          <button
            onClick={handleInitializeExternal}
            disabled={loading}
            className="w-full py-4 px-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-800 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Inicializando...
              </>
            ) : (
              "Inicializar CDP Staking"
            )}
          </button>
        )}

        {/* Información de staking */}
        {initialized && stakingInfo && (
          <div className="bg-slate-800 rounded-xl p-5 space-y-3 border border-slate-700">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-500 font-medium">
                Dirección (Hoodi Testnet)
              </p>
              <button
                onClick={refreshInfo}
                className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
              >
                Actualizar
              </button>
            </div>
            <p className="text-xs font-mono text-slate-200 truncate">
              {connectedAddress}
            </p>
            <div className="pt-2 space-y-1">
              <p className="text-xs text-slate-500">
                Balance:{" "}
                <span className="text-slate-300 font-medium">
                  {stakingInfo.balance}
                </span>
              </p>
              <p className="text-xs text-slate-500">
                Disponible:{" "}
                <span className="text-slate-100 font-semibold">
                  {stakingInfo.stakeableBalance || "0"} ETH
                </span>
              </p>
              <p className="text-xs text-slate-500">
                Reclamable:{" "}
                <span className="text-slate-300 font-semibold">
                  {stakingInfo.claimableBalance || "0"} ETH
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Operaciones de staking */}
        {initialized && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-200">
              Operaciones de Staking
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => handleBuildStake("0.001")}
                disabled={loading}
                className="py-3 px-5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-800 text-white font-medium rounded-lg transition-all duration-200 text-sm"
              >
                Stake (0.001 ETH)
              </button>
              <button
                onClick={() => handleBuildUnstake("0.001")}
                disabled={loading}
                className="py-3 px-5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-800 text-white font-medium rounded-lg transition-all duration-200 text-sm"
              >
                Unstake (0.001 ETH)
              </button>
              <button
                onClick={handleBuildClaim}
                disabled={loading}
                className="py-3 px-5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-800 text-white font-medium rounded-lg transition-all duration-200 text-sm"
              >
                Reclamar Rewards
              </button>
            </div>
          </div>
        )}

        {/* Transacción lista para firmar */}
        {transactionData && (
          <div className="bg-slate-800 rounded-xl p-5 space-y-4 border border-slate-700">
            <h4 className="text-sm font-semibold text-slate-200">
              Transacción Lista
            </h4>

            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
              <p className="text-xs text-slate-500">
                Operación:{" "}
                <span className="text-slate-200 font-medium">
                  {transactionData.operation}
                </span>
              </p>
              <p className="text-xs text-slate-500">
                Monto:{" "}
                <span className="text-slate-300 font-medium">
                  {transactionData.amount} ETH
                </span>
              </p>
            </div>

            <button
              onClick={handleSignAndSend}
              disabled={signing || !walletClient}
              className="w-full py-3 px-5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-800 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              {signing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Firmando...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Firmar y Enviar
                </>
              )}
            </button>

            {!walletClient && (
              <p className="text-xs text-slate-400 text-center">
                ⚠️ Conecta tu wallet primero
              </p>
            )}
          </div>
        )}

        {/* Hash de transacción */}
        {txHash && (
          <div className="bg-slate-800 bg-opacity-50 border border-slate-700 rounded-xl p-4">
            <p className="text-sm text-slate-300 mb-2 font-medium">
              ✅ Transacción Enviada
            </p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-200 font-mono truncate">
                {txHash}
              </p>
              <a
                href={`https://hoodi.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1 transition-colors"
              >
                Ver en Explorer
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}

        {/* Estado/Mensajes */}
        {status && (
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-sm text-slate-200">{status}</p>
          </div>
        )}

        {/* Mensaje si no hay wallet */}
        {!connectedAddress && (
          <div className="p-6 bg-slate-800 bg-opacity-50 border border-slate-700 rounded-xl text-center">
            <p className="text-lg text-slate-300 mb-2">
              👉 Conecta tu wallet para comenzar
            </p>
            <p className="text-sm text-slate-400">
              Usa el botón de arriba para conectar MetaMask u otra wallet
            </p>
          </div>
        )}

        {/* Información adicional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-800 bg-opacity-50 border border-slate-700 rounded-xl">
            <h4 className="text-sm font-semibold text-slate-400 mb-1">
              Auto-Custodia
            </h4>
            <p className="text-xs text-slate-500">
              Mantienes el control total de tus claves. Firma transacciones con
              tu propio wallet.
            </p>
          </div>
          <div className="p-4 bg-slate-800 bg-opacity-50 border border-slate-700 rounded-xl">
            <h4 className="text-sm font-semibold text-slate-400 mb-1">
              Impulsado por CDP
            </h4>
            <p className="text-xs text-slate-500">
              Aprovecha la infraestructura de Coinbase para operaciones de
              staking confiables.
            </p>
          </div>
        </div>
        <div className="p-4 bg-slate-800 bg-opacity-50 border border-slate-700 rounded-xl">
          <p className="text-xs text-slate-500">
            <strong className="text-slate-400">Red:</strong> HOODI Testnet
            (Chain ID: 560048)
            <br />
            <strong className="text-slate-400">RPC:</strong>{" "}
            https://rpc.hoodi.ethpandaops.io
          </p>
        </div>
      </div>
    </div>
  );
}
