if (!process.env.NEXT_PUBLIC_WRAPPED_POCKET_ADDRESS) {
  throw new Error(
    'Environment variable NEXT_PUBLIC_WRAPPED_POCKET_ADDRESS is not set',
  );
}

if (!process.env.NEXT_PUBLIC_MINT_CONTROLLER_ADDRESS) {
  throw new Error(
    'Environment variable NEXT_PUBLIC_MINT_CONTROLLER_ADDRESS is not set',
  );
}

if (!process.env.NEXT_PUBLIC_POKT_MULTISIG_ADDRESS) {
  throw new Error(
    'Environment variable NEXT_PUBLIC_POKT_MULTISIG_ADDRESS is not set',
  );
}

if (!process.env.NEXT_PUBLIC_POKT_CHAIN_ID) {
  throw new Error('Environment variable NEXT_PUBLIC_POKT_CHAIN_ID is not set');
}

if (!process.env.NEXT_PUBLIC_POKT_CONFIRMATIONS) {
  throw new Error(
    'Environment variable NEXT_PUBLIC_POKT_CONFIRMATIONS is not set',
  );
}

if (!process.env.NEXT_PUBLIC_ETH_CHAIN_ID) {
  throw new Error('Environment variable NEXT_PUBLIC_ETH_CHAIN_ID is not set');
}

if (!process.env.NEXT_PUBLIC_ETH_CONFIRMATIONS) {
  throw new Error(
    'Environment variable NEXT_PUBLIC_ETH_CONFIRMATIONS is not set',
  );
}

if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
  throw new Error(
    'Environment variable NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set',
  );
}

if (!process.env.NEXT_PUBLIC_POKT_RPC_URL) {
  throw new Error('Environment variable NEXT_PUBLIC_POKT_RPC_URL is not set');
}

export const WRAPPED_POCKET_ADDRESS =
  process.env.NEXT_PUBLIC_WRAPPED_POCKET_ADDRESS.toLowerCase();
export const MINT_CONTROLLER_ADDRESS =
  process.env.NEXT_PUBLIC_MINT_CONTROLLER_ADDRESS.toLowerCase();

export const ETH_CHAIN_ID = process.env.NEXT_PUBLIC_ETH_CHAIN_ID;
export const ETH_CONFIRMATIONS = Number(
  process.env.NEXT_PUBLIC_ETH_CONFIRMATIONS,
);
export const ETH_NETWORK_LABEL = ((): string => {
  switch (ETH_CHAIN_ID) {
    case '1':
      return 'Mainnet';
    case '5':
      return 'Goerli';
    case '11155111':
      return 'Sepolia';
    case '31337':
      return 'Hardhat';
    default:
      throw new Error(`Unknown ETH_CHAIN_ID: ${ETH_CHAIN_ID}`);
  }
})();

export const POKT_CHAIN_ID = process.env.NEXT_PUBLIC_POKT_CHAIN_ID;
export const POKT_RPC_URL = process.env.NEXT_PUBLIC_POKT_RPC_URL;
export const POKT_MULTISIG_ADDRESS =
  process.env.NEXT_PUBLIC_POKT_MULTISIG_ADDRESS.toLowerCase();
export const POKT_CONFIRMATIONS = Number(
  process.env.NEXT_PUBLIC_POKT_CONFIRMATIONS,
);
export const POKT_NETWORK_LABEL = ((): string => {
  switch (POKT_CHAIN_ID) {
    case 'testnet':
      return 'Testnet';
    case 'mainnet':
      return 'Mainnet';
    case 'localnet':
      return 'Localnet';
    default:
      throw new Error(`Unknown POKT_CHAIN_ID: ${POKT_CHAIN_ID}`);
  }
})();

export const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
