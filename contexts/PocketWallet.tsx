import { Link, Text, useToast } from '@chakra-ui/react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import useSWR from 'swr';

import { POKT_CHAIN_ID, POKT_RPC_URL } from '@/utils/constants';
import { useTransport } from './Transport';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pocketNetwork: any;
  }
}

export type PocketWalletContextType = {
  poktAddress: string;
  poktNetwork: string;
  poktBalance: bigint;
  isBalanceLoading: boolean;
  reloadPoktBalance: () => void;
  connectPocketWallet: () => Promise<void>;
  sendPokt: (
    amount: bigint,
    recipient: string,
    memo: string,
  ) => Promise<string>;
  isPoktConnected: boolean;
  resetPoktWallet: () => void;
};

export const PocketWalletContext = createContext<PocketWalletContextType>({
  poktBalance: BigInt(0),
  poktNetwork: '',
  isBalanceLoading: false,
  reloadPoktBalance: () => { },
  poktAddress: '',
  connectPocketWallet: async () => { },
  sendPokt: async () => '',
  isPoktConnected: false,
  resetPoktWallet: () => { },
});

export const usePocketWallet = (): PocketWalletContextType =>
  useContext(PocketWalletContext);

export const PocketWalletProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { isUsingHardwareWallet, removeTransport, poktAddressHW, sendTransaction: sendPoktFromLedger } = useTransport();
  const [poktAddress, setPoktAddress] = useState<string>('');
  const [poktNetwork, setPoktNetwork] = useState<string>('');
  // const [isUsingHardwareWallet, setIsUsingHardwareWallet] = useState<boolean>(false)
  // const [pocketApp, setPocketApp] = useState<AppPokt>();
  // const [isSigningTx, setIsSigningTx] = useState<boolean>(false)

  const toast = useToast();

  const connectPocketWallet = useCallback(async () => {
    if (isUsingHardwareWallet) {
      setPoktAddress(poktAddressHW);
      console.log(POKT_CHAIN_ID.toLowerCase())
      setPoktNetwork(POKT_CHAIN_ID.toLowerCase());
    } else {
      if (window.pocketNetwork === undefined) {
        toast({
          title: 'POKT Wallet not found!',
          description: (
            <Text>
              Please install{' '}
              <Link href="https://sendwallet.net" isExternal>
                SendWallet
              </Link>
              {' or '}
              <Link
                href="https://github.com/decentralized-authority/nodewallet"
                isExternal
              >
                NodeWallet
              </Link>
              {'.'}
            </Text>
          ),
          status: 'error',
          duration: 9000,
          isClosable: true,
        });
        return;
      }
  
      try {
        const [address] = await window.pocketNetwork.send('pokt_requestAccounts');
  
        let network = 'mainnet';
        try {
          const { chain } = await window.pocketNetwork.send('pokt_chain');
          if (
            chain.toLowerCase() === 'testnet' ||
            chain.toLowerCase() === 'mainnet'
          ) {
            network = chain.toLowerCase();
          }
        } catch (e) {
          console.error('Error getting POKT network', e);
        }
  
        setPoktAddress(address);
        setPoktNetwork(network);
      } catch (e) {
        console.error('Error connecting to POKT Wallet', e);
        toast({
          title: 'Error connecting to POKT Wallet',
          description: (e as Error).message,
          status: 'error',
          duration: 9000,
          isClosable: true,
        });
        setPoktAddress('');
        setPoktNetwork('');
      }
    }
  }, [toast]);

  const fetchPoktBalance = useCallback(
    async (address: string): Promise<undefined | bigint> => {
      if (isUsingHardwareWallet) {
        let balance = BigInt(0)
        let balanceResponse;
        try {
          const poktGatewayUrl = POKT_RPC_URL;
          const res = await fetch(`${poktGatewayUrl}/v1/query/balance`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              address: poktAddress,
              height: 0,
            }),
          })
          balanceResponse = await res.json()
        } catch (error) {
          console.log(error);
          return BigInt(0);
        }
        balance = balanceResponse?.balance?.toString();
        return BigInt(balance)
      } else {
        if (!address || !window.pocketNetwork) return BigInt(0);
        const { balance } = await window.pocketNetwork.send('pokt_balance', [
          { address },
        ]);
        return BigInt(balance);
      }
    },
    [],
  );

  const {
    data: poktBalance,
    isLoading: isBalanceLoading,
    mutate: reloadPoktBalance,
  } = useSWR(poktAddress, fetchPoktBalance);

  const sendPokt = useCallback(
    async (
      amount: bigint,
      recipient: string,
      memo: string,
    ): Promise<string> => {
      if (!poktAddress) {
        throw new Error('No POKT wallet connected');
      }
      if (isUsingHardwareWallet) {
        if (poktAddressHW !== poktAddress) throw new Error('Wrong POKT address')
        return await sendPoktFromLedger(recipient, amount, memo)
      } else {
        const { hash } = await window.pocketNetwork.send('pokt_sendTransaction', [
          {
            amount: amount.toString(), // in uPOKT
            from: poktAddress,
            to: recipient,
            memo: memo,
          },
        ]);
        return hash;
      }
    },
    [poktAddress],
  );

  const isPoktConnected = useMemo(
    () => !!poktAddress && !!poktNetwork && poktNetwork === POKT_CHAIN_ID,
    [poktAddress, poktNetwork],
  );

  const resetPoktWallet = useCallback(() => {
    if (isUsingHardwareWallet) removeTransport()
    setPoktAddress('');
    setPoktNetwork('');
  }, []);

  return (
    <PocketWalletContext.Provider
      value={{
        poktBalance: poktBalance || BigInt(0),
        poktNetwork,
        isBalanceLoading,
        reloadPoktBalance,
        poktAddress,
        connectPocketWallet,
        sendPokt,
        isPoktConnected,
        resetPoktWallet,
      }}
    >
      {children}
    </PocketWalletContext.Provider>
  );
};
