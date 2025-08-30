import { defineChain } from "viem";

export const hoodi = defineChain({
  id: 560048,
  name: "Hoodi",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["<https://rpc.hoodi.ethpandaops.io>"],
      webSocket: ["wss://rpc.hoodi.ethpandaops.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "Hoodi Explorer",
      url: "<https://hoodi.etherscan.io>",
    },
  },
  testnet: true,
});
