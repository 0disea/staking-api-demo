// Cliente CDP que llama a nuestras API routes del servidor

export interface StakingInfo {
  balance: string;
  stakeableBalance: string;
  claimableBalance: string;
}

export interface StakingTransaction {
  success: boolean;
  operation: string;
  amount: string;
  transactions: any;
  requiresSignature: boolean;
}

// Obtener información de staking
export async function getStakingInfo(address: string): Promise<StakingInfo> {
  const response = await fetch("/api/cdp/stake", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "info",
      address,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get staking info");
  }

  const data = await response.json();
  return data.info;
}

// Construir transacción de stake
export async function buildStakeTransaction(
  address: string,
  amount: string,
): Promise<StakingTransaction> {
  const response = await fetch("/api/cdp/stake", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "stake",
      address,
      amount,
      mode: "external",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to build stake transaction");
  }

  return response.json();
}

// Construir transacción de unstake
export async function buildUnstakeTransaction(
  address: string,
  amount: string,
): Promise<StakingTransaction> {
  const response = await fetch("/api/cdp/stake", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "unstake",
      address,
      amount,
      mode: "external",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to build unstake transaction");
  }

  return response.json();
}

// Construir transacción de claim
export async function buildClaimTransaction(
  address: string,
): Promise<StakingTransaction> {
  const response = await fetch("/api/cdp/stake", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "claim",
      address,
      amount: "0", // Se determina en el servidor
      mode: "external",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to build claim transaction");
  }

  return response.json();
}
