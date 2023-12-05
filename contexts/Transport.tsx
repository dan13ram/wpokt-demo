/* eslint-disable @typescript-eslint/no-explicit-any */
import WebHIDTransport from '@ledgerhq/hw-transport-webhid';
import WebUSBTransport from '@ledgerhq/hw-transport-webusb';
import { typeGuard } from '@pokt-network/pocket-js';
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { getDataSource } from '@/datasource';
import { LEDGER_CONFIG } from '@/utils/ledger';

import AppPokt from '../hw-app/Pokt';

export const dataSource = getDataSource();

const DEFAULT_TRANSPORT_STATE = {
  pocketApp: undefined,
  setPocketApp: () => {},
  onSelectDevice: async () => [],
  removeTransport: async () => {},
  sendTransaction: async () => {},
  isUsingHardwareWallet: false,
  isHardwareWalletLoading: false,
  setIsHardwareWalletLoading: () => {},
  getPoktAddressFromLedger: async () => {},
  connectLedgerDevice: async () => {},
  setPoktAddressToLedger: async () => {},
  poktAddressHW: '',
};

export interface TransportContextProps {
  pocketApp: any;
  setPocketApp: (value: any) => void;
  onSelectDevice: () => Promise<any[]>;
  removeTransport: () => Promise<void>;
  sendTransaction: (
    toAddress: string,
    amount: bigint,
    memo: any,
  ) => Promise<any>;
  isUsingHardwareWallet: boolean;
  isHardwareWalletLoading: boolean;
  setIsHardwareWalletLoading: (value: boolean) => void;
  getPoktAddressFromLedger: () => Promise<any>;
  connectLedgerDevice: () => Promise<any>;
  setPoktAddressToLedger: (pocketApp: AppPokt) => Promise<void>;
  poktAddressHW: string;
}

declare global {
  interface Window {
    USB: any;
  }
}

export const TransportContext = createContext<TransportContextProps>(
  DEFAULT_TRANSPORT_STATE,
);

export const useTransport = (): TransportContextProps =>
  useContext(TransportContext);

export const TransportProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [isHardwareWalletLoading, setIsHardwareWalletLoading] =
    useState<boolean>(false);
  const [pocketApp, setPocketApp] = useState<AppPokt>();
  const isUsingHardwareWallet = useMemo(
    () => (pocketApp?.transport ? true : false),
    [pocketApp],
  );
  const [poktAddressHW, setPoktAddressHW] = useState<string>('');

  const setPoktAddressToLedger = useCallback(
    async (app: AppPokt | undefined) => {
      if (!app?.transport) {
        return;
      }
      try {
        const { address } = await app.getPublicKey(
          LEDGER_CONFIG.generateDerivationPath(0),
        );
        if (!address) throw Error('No address found');
        setPoktAddressHW(Buffer.from(address).toString('hex'));
      } catch (error) {
        console.error("Error getting ledger's address: ", error);
      }
    },
    [],
  );

  const initializePocketApp = useCallback(
    async (transport: any) => {
      const pocket = new AppPokt(transport);
      setPocketApp(pocket);
      await setPoktAddressToLedger(pocket);
      return pocket;
    },
    [setPoktAddressToLedger],
  );

  const connectLedgerDevice = useCallback(async () => {
    if (pocketApp?.transport) {
      return await initializePocketApp(pocketApp.transport);
    }

    let transport;
    let error;

    try {
      transport = await WebHIDTransport.request();
      return await initializePocketApp(transport);
    } catch (e) {
      console.error(`HID Transport is not supported: ${e}`);
      error = e;
    }

    if (window.USB) {
      try {
        transport = await WebUSBTransport.request();
        return await initializePocketApp(transport);
      } catch (e) {
        console.error(`WebUSB Transport is not supported: ${e}`);
        error = e;
      }
    }

    if (error) {
      throw error;
    }
    throw new Error('No transport found');
  }, [initializePocketApp, pocketApp]);

  const onSelectDevice = useCallback(async () => {
    if (pocketApp?.transport) {
      const pocket = await initializePocketApp(pocketApp.transport);
      return [true, pocket];
    }

    let transport;
    let error;

    try {
      transport = await WebHIDTransport.request();
      const pocket = await initializePocketApp(transport);
      return [true, pocket];
    } catch (e) {
      console.error(`HID Transport is not supported: ${e}`);
      error = e;
    }

    if (window.USB) {
      try {
        transport = await WebUSBTransport.request();
        const pocket = await initializePocketApp(transport);
        return [true, pocket];
      } catch (e) {
        console.error(`WebUSB Transport is not supported: ${e}`);
        error = e;
      }
    }

    return [false, error];
  }, [initializePocketApp, pocketApp]);

  const removeTransport = useCallback(async () => {
    try {
      await pocketApp?.transport.close();
      setPocketApp(undefined);
      setPoktAddressHW('');
    } catch (e) {
      console.error(`Error closing device: ${e}`);
    }
  }, [pocketApp]);

  const getPoktAddressFromLedger = useCallback(async () => {
    try {
      if (!pocketApp?.transport) throw Error('No transport found');
      const { address } = await pocketApp?.getPublicKey(
        LEDGER_CONFIG.generateDerivationPath(0),
      );
      // return address
      if (!address) throw Error('No address found');
      return Buffer.from(address).toString('hex');
    } catch (error) {
      console.error(error);
    }
    return '';
  }, [pocketApp]);

  const sendTransaction = useCallback(
    async (toAddress: string, amount: bigint, memo: any) => {
      setIsHardwareWalletLoading(true);
      try {
        /* global BigInt */
        const entropy = Number(
          BigInt(
            Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
          ).toString(),
        ).toString();

        const poktAddress = await getPoktAddressFromLedger();
        if (!poktAddress) throw Error('No address found');

        const tx = {
          chain_id: 'mainnet',
          entropy: entropy.toString(),
          fee: [
            {
              amount: '10000',
              denom: 'upokt',
            },
          ],
          memo: memo || '',
          msg: {
            type: 'pos/Send',
            value: {
              amount: amount.toString(),
              from_address: poktAddress,
              to_address: toAddress,
            },
          },
        };

        const stringifiedTx = JSON.stringify(tx);
        const hexTx = Buffer.from(stringifiedTx, 'utf-8').toString('hex');
        const sig = await pocketApp?.signTransaction(
          LEDGER_CONFIG.derivationPath,
          hexTx,
        );

        const pk = await pocketApp?.getPublicKey(LEDGER_CONFIG.derivationPath);
        if (!pk || !sig) throw Error('No public key or signature found');

        const ledgerTxResponse = await dataSource.sendTransactionFromLedger(
          Buffer.from(pk.publicKey),
          Buffer.from(sig.signature),
          tx,
        );
        if (typeGuard(ledgerTxResponse, Error)) {
          throw ledgerTxResponse;
        }

        return ledgerTxResponse;
      } catch (e) {
        console.error('Error sending transaction: ', e);
        throw e;
      } finally {
        setIsHardwareWalletLoading(false);
      }
    },
    [getPoktAddressFromLedger, pocketApp],
  );

  return (
    <TransportContext.Provider
      value={{
        onSelectDevice,
        pocketApp,
        setPocketApp,
        removeTransport,
        isUsingHardwareWallet,
        sendTransaction,
        isHardwareWalletLoading,
        setIsHardwareWalletLoading,
        getPoktAddressFromLedger,
        connectLedgerDevice,
        setPoktAddressToLedger,
        poktAddressHW,
      }}
    >
      {children}
    </TransportContext.Provider>
  );
};
