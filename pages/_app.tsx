import { ChakraProvider } from '@chakra-ui/react';
import { Global } from '@emotion/react';
import type { AppProps } from 'next/app';
import Head from 'next/head';

import { WagmiWrapper } from '@/components/WagmiWrapper';
import { PocketWalletProvider } from '@/contexts/PocketWallet';
import { ETH_NETWORK_LABEL, POKT_NETWORK_LABEL } from '@/utils/constants';
import { globalStyles, theme } from '@/utils/theme';
import { TransportProvider } from '@/contexts/Transport';

const TITLE = `wPOKT Bridge Monitor | Ethereum ${ETH_NETWORK_LABEL} - Pocket ${POKT_NETWORK_LABEL}`;

export default function App({
  Component,
  pageProps,
}: {
  Component: AppProps['Component'];
  pageProps: AppProps['pageProps'];
}): JSX.Element {
  return (
    <>
      <Head>
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <title>{TITLE}</title>
      </Head>
      <ChakraProvider resetCSS theme={theme}>
        <Global styles={globalStyles} />
        <TransportProvider>
          <PocketWalletProvider>
            <WagmiWrapper>
              <Component {...pageProps} />
            </WagmiWrapper>
          </PocketWalletProvider>
        </TransportProvider>
      </ChakraProvider>
    </>
  );
}
