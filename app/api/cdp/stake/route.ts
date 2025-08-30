import { NextRequest, NextResponse } from "next/server";
import {
  Coinbase,
  ExternalAddress,
  StakeOptionsMode,
} from "@coinbase/coinbase-sdk";

// Inicializar CDP en el servidor - SOLO en el servidor, NUNCA en el cliente
const initializeCDP = () => {
  // ⚠️ IMPORTANTE: Solo usar variables del servidor (SIN prefijo NEXT_PUBLIC_)
  const apiKeyName = process.env.CDP_API_KEY_NAME;
  const privateKey = process.env.CDP_API_KEY_PRIVATE_KEY;

  if (!apiKeyName || !privateKey) {
    throw new Error(
      "CDP API credentials not configured. Ensure CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY are set in server environment variables.",
    );
  }

  Coinbase.configure({
    apiKeyName,
    privateKey: privateKey.replace(/\\\\n/g, "\\n"),
  });
};

export async function POST(request: NextRequest) {
  try {
    initializeCDP();

    const body = await request.json();
    const { action, address, amount, mode = "external" } = body;

    if (!action || !address) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    // Manejar diferentes acciones
    switch (action) {
      case "stake": {
        const externalAddress = new ExternalAddress(
          Coinbase.networks.EthereumHoodi,
          address,
        );
        const stakingOperation = await externalAddress.buildStakeOperation(
          parseFloat(amount),
          Coinbase.assets.Eth,
          StakeOptionsMode.PARTIAL,
        );

        const transactions = await stakingOperation.getTransactions();

        // Serializar transacciones
        const serializedTransactions = transactions.map((tx) => {
          if (typeof tx.getUnsignedPayload === "function") {
            const payload = tx.getUnsignedPayload();

            // CDP retorna hex-encoded JSON
            if (typeof payload === "string" && payload.startsWith("7b")) {
              const jsonString = Buffer.from(payload, "hex").toString("utf8");
              return JSON.parse(jsonString);
            }

            return payload;
          }

          return tx;
        });

        return NextResponse.json({
          success: true,
          operation: "stake",
          amount,
          transactions: serializedTransactions,
          requiresSignature: true,
        });
      }

      case "unstake": {
        const externalAddress = new ExternalAddress(
          Coinbase.networks.EthereumHoodi,
          address,
        );
        const unstakeOperation = await externalAddress.buildUnstakeOperation(
          parseFloat(amount),
          Coinbase.assets.Eth,
          StakeOptionsMode.PARTIAL,
        );

        const transactions = await unstakeOperation.getTransactions();

        const serializedTransactions = transactions.map((tx) => {
          if (typeof tx.getUnsignedPayload === "function") {
            const payload = tx.getUnsignedPayload();

            if (typeof payload === "string" && payload.startsWith("7b")) {
              const jsonString = Buffer.from(payload, "hex").toString("utf8");
              return JSON.parse(jsonString);
            }

            return payload;
          }

          return tx;
        });

        return NextResponse.json({
          success: true,
          operation: "unstake",
          amount,
          transactions: serializedTransactions,
          requiresSignature: true,
        });
      }

      case "claim": {
        const externalAddress = new ExternalAddress(
          Coinbase.networks.EthereumHoodi,
          address,
        );

        // Obtener balance reclamable
        const claimableBalance = await externalAddress.claimableBalance(
          Coinbase.assets.Eth,
          StakeOptionsMode.PARTIAL,
        );

        if (!claimableBalance || claimableBalance.toNumber() === 0) {
          return NextResponse.json(
            { error: "No rewards to claim" },
            { status: 400 },
          );
        }

        const claimOperation = await externalAddress.buildClaimStakeOperation(
          claimableBalance.toNumber(),
          Coinbase.assets.Eth,
          StakeOptionsMode.PARTIAL,
        );

        const transactions = await claimOperation.getTransactions();

        const serializedTransactions = transactions.map((tx) => {
          if (typeof tx.getUnsignedPayload === "function") {
            const payload = tx.getUnsignedPayload();

            if (typeof payload === "string" && payload.startsWith("7b")) {
              const jsonString = Buffer.from(payload, "hex").toString("utf8");
              return JSON.parse(jsonString);
            }

            return payload;
          }

          return tx;
        });

        return NextResponse.json({
          success: true,
          operation: "claim",
          amount: claimableBalance.toString(),
          transactions: serializedTransactions,
          requiresSignature: true,
        });
      }

      case "info": {
        try {
          const externalAddress = new ExternalAddress(
            Coinbase.networks.EthereumHoodi,
            address,
          );

          const [stakeableBalance, claimableBalance] = await Promise.all([
            externalAddress.stakeableBalance(
              Coinbase.assets.Eth,
              StakeOptionsMode.PARTIAL,
            ),
            externalAddress.claimableBalance(
              Coinbase.assets.Eth,
              StakeOptionsMode.PARTIAL,
            ),
          ]);

          return NextResponse.json({
            success: true,
            info: {
              balance: "Ver en wallet",
              stakeableBalance: stakeableBalance?.toString() || "0",
              claimableBalance: claimableBalance?.toString() || "0",
            },
          });
        } catch (infoError: any) {
          throw new Error(`CDP API error: ${infoError.message}`);
        }
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
