import { QuestionIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Divider,
  HStack,
  Input,
  Link,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useBreakpointValue,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useMemo, useState } from 'react';
import { formatUnits, isAddress, parseUnits } from 'viem';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';

import { usePocketWallet } from '@/contexts/PocketWallet';
import useAllMints from '@/hooks/useAllMints';
import { useIsConnected } from '@/hooks/useIsConnected';
import { useNonceMap } from '@/hooks/useNonceMap';
import { useSignerThreshold } from '@/hooks/useSignerThreshold';
import { Mint } from '@/types';
import { MINT_CONTROLLER_ABI } from '@/utils/abis';
import {
  ETH_CHAIN_ID,
  ETH_NETWORK_LABEL,
  MINT_CONTROLLER_ADDRESS,
  POKT_CHAIN_ID,
  POKT_CONFIRMATIONS,
  POKT_MULTISIG_ADDRESS,
  POKT_NETWORK_LABEL,
} from '@/utils/constants';
import {
  getEthTxLink,
  getPoktTxLink,
  humanFormattedDate,
  uniqueValues,
} from '@/utils/helpers';

import { HashDisplay } from './HashDisplay';
import { Pagination } from './Pagination';
import { Tile } from './Tile';

export const MintPanel: React.FC = () => {
  const { mints, reload, loading, pagination } = useAllMints();

  const addresses = useMemo(
    () =>
      uniqueValues(
        mints
          .filter(
            mint =>
              mint.status === 'signed' ||
              (mint.status === 'confirmed' && mint.signatures.length >= 2),
          )
          .map(mint => mint.recipient_address),
      ),
    [mints],
  );

  const isConnected = useIsConnected();

  const {
    nonceMap,
    loading: loadingNonce,
    reload: reloadNonce,
  } = useNonceMap(addresses);

  const toast = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [currentMintId, setCurrentMintId] = useState<string | null>(null);
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const account = useAccount();

  const { poktBalance, isPoktConnected, sendPokt } = usePocketWallet();

  const [isSending, setIsSending] = useState(false);

  const [value, setValue] = useState('');
  const [address, setAddress] = useState('');

  const sendTokens = useCallback(async () => {
    if (!value) {
      toast({
        title: 'Error',
        description: 'Please enter a mint amount',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const amount = parseUnits(value, 6);
    if (amount > poktBalance) {
      toast({
        title: 'Error',
        description: 'You do not have enough tokens to send',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    if (!isAddress(address)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid recipient eth address',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsSending(true);

      const memo = JSON.stringify({
        address,
        chain_id: ETH_CHAIN_ID.toString(),
      });

      const recipient = POKT_MULTISIG_ADDRESS;

      const txHash = await sendPokt(amount, recipient, memo);

      const txLink = getPoktTxLink(txHash);
      toast.closeAll();
      toast({
        title: 'Transaction sent',
        description: (
          <Text>
            Sending tokens, view on{' '}
            <Link isExternal href={txLink}>
              PoktScan
            </Link>{' '}
          </Text>
        ),
        status: 'loading',
        duration: null,
        isClosable: true,
      });
    } catch (error) {
      toast.closeAll();
      // eslint-disable-next-line no-console
      console.error(error);
      toast({
        title: 'Error',
        description: 'Error sending tokens, please try again later',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSending(false);
    }
  }, [value, address, toast, poktBalance, sendPokt]);

  const mintTokens = useCallback(
    async (mint: Mint) => {
      if (!mint.data || !mint.signatures) {
        toast({
          title: 'Error',
          description: 'Mint is not ready',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      if (!account.address || !walletClient || !publicClient) return;

      try {
        setIsLoading(true);
        setCurrentMintId(mint._id.toString());
        const txHash = await walletClient.writeContract({
          account: account.address,
          address: MINT_CONTROLLER_ADDRESS as `0x${string}`,
          abi: MINT_CONTROLLER_ABI,
          functionName: 'mintWrappedPocket',
          args: [mint.data, mint.signatures],
        });

        const txLink = getEthTxLink(txHash);
        toast.closeAll();
        toast({
          title: 'Transaction sent',
          description: (
            <Text>
              Minting tokens, view on{' '}
              <Link isExternal href={txLink}>
                Etherscan
              </Link>{' '}
            </Text>
          ),
          status: 'loading',
          duration: null,
          isClosable: false,
        });
        await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });
        toast.closeAll();
        toast({
          title: 'Transaction successful. You tokens are bridged!',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        reloadNonce();
      } catch (error) {
        toast.closeAll();
        // eslint-disable-next-line no-console
        console.error(error);
        toast({
          title: 'Error',
          description: 'Error minting tokens, please try again later',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
        setCurrentMintId(null);
      }
    },
    [toast, account.address, walletClient, publicClient, reloadNonce],
  );

  const isSmallScreen = useBreakpointValue({ base: true, lg: false });

  const { signerThreshold } = useSignerThreshold();

  return (
    <VStack align="stretch">
      <VStack align="stretch" py={8}>
        <Text as="div">
          {`To get started with minting wPOKT tokens, please follow these steps:`}
          <br />
          <br />
          {`Step 1: Send POKT tokens to our Vault Address: `}
          <Box display="inline-block" ml={2}>
            <HashDisplay chainId={POKT_CHAIN_ID}>
              {POKT_MULTISIG_ADDRESS}
            </HashDisplay>
          </Box>
          <br />
          {`In the input fields below, enter the amount of POKT tokens you want to send and the recipient's Ethereum address.`}
        </Text>
        <VStack align="start" maxW="30rem" my={4}>
          <Input
            placeholder="Mint Amount"
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
          />
          <Input
            placeholder="Recipient Ethereum Address"
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
          />
        </VStack>
        <Text>
          {`Step 2: Click the "Send POKT" Button`}
          <br />
          {`After entering the required information, click the "Send POKT" button to initiate the minting process.`}
          <Button
            isLoading={isSending}
            onClick={sendTokens}
            colorScheme="blue"
            maxW="30rem"
            px={8}
            my={4}
            display="flex"
            isDisabled={!isPoktConnected}
          >
            Send POKT
          </Button>
        </Text>
        <Text>
          {`Step 3: Monitor Your Transaction:`}
          <br />
          {`Once you have sent the POKT tokens, you can find your transaction details below. Please wait for the transaction to be confirmed on the Pocket ${POKT_NETWORK_LABEL} before proceeding to the next step.`}
          <br />
          <br />
          {`Step 4: Complete the Bridging Process:`}
          <br />
          {`Once your transaction is confirmed, click the "Mint" button to complete the bridging process and mint wPOKT tokens on the Ethereum ${ETH_NETWORK_LABEL}.`}
          <br />
          <br />
          {`Happy minting!`}
        </Text>
      </VStack>

      {!loading && isSmallScreen && (
        <VStack align="stretch" overflowX="auto" spacing={4}>
          {mints.map(mint => {
            const nonce = nonceMap[mint.recipient_address.toLowerCase()];
            const isMintNotReady =
              nonce != null
                ? !mint.nonce || BigInt(mint.nonce) > nonce + BigInt(1)
                : true;
            const isMintCompleted =
              nonce != null
                ? !!mint.nonce && BigInt(mint.nonce) <= nonce
                : true;

            return (
              <Tile
                key={mint.transaction_hash}
                entries={[
                  {
                    label: 'Tx Hash',
                    value: (
                      <HashDisplay chainId={mint.sender_chain_id}>
                        {mint.transaction_hash}
                      </HashDisplay>
                    ),
                  },
                  {
                    label: 'Created At',
                    value: humanFormattedDate(mint.created_at),
                  },
                  {
                    label: 'Sender',
                    value: (
                      <HashDisplay chainId={mint.sender_chain_id}>
                        {mint.sender_address}
                      </HashDisplay>
                    ),
                  },
                  {
                    label: 'Recipient',
                    value: (
                      <HashDisplay chainId={mint.recipient_chain_id}>
                        {mint.recipient_address}
                      </HashDisplay>
                    ),
                  },
                  {
                    label: 'Amount',
                    value: formatUnits(BigInt(mint.amount), 6),
                  },
                  {
                    label: 'Nonce',
                    value: mint.nonce,
                  },
                  {
                    label: 'Status',
                    value: (
                      <Tooltip
                        label={
                          mint.status === 'pending'
                            ? `The transaction has ${mint.confirmations} confirmations out of a total of ${POKT_CONFIRMATIONS} required.`
                            : ''
                        }
                      >
                        <HStack spacing={1}>
                          <Text>{mint.status}</Text>
                          {mint.status === 'pending' && (
                            <QuestionIcon fontSize="xs" />
                          )}
                        </HStack>
                      </Tooltip>
                    ),
                  },
                  {
                    label: 'Mint Tx Hash',
                    value: mint.mint_tx_hash ? (
                      <HashDisplay chainId={mint.recipient_chain_id}>
                        {mint.mint_tx_hash}
                      </HashDisplay>
                    ) : (
                      <>
                        {loadingNonce ? (
                          <Spinner
                            thickness="2px"
                            speed="0.65s"
                            size="sm"
                            color="blue.500"
                          />
                        ) : nonce != null &&
                          (mint.status === 'signed' ||
                            (mint.status === 'confirmed' &&
                              mint.signatures.length >=
                                Number(signerThreshold))) ? (
                          <Tooltip
                            label={
                              isMintNotReady
                                ? 'Please complete previous mints first'
                                : isMintCompleted
                                  ? 'Mint completed, please wait for validators to mark it as complete'
                                  : ''
                            }
                          >
                            <Button
                              isLoading={
                                isLoading &&
                                mint._id.toString() === currentMintId
                              }
                              onClick={() => mintTokens(mint)}
                              isDisabled={
                                isMintNotReady ||
                                isMintCompleted ||
                                !isConnected
                              }
                              colorScheme="blue"
                              maxH="2rem"
                              minW="8.5rem"
                              maxW="9rem"
                              w="100%"
                            >
                              Mint
                            </Button>
                          </Tooltip>
                        ) : (
                          <Text>N/A</Text>
                        )}
                      </>
                    ),
                  },
                ]}
              />
            );
          })}
        </VStack>
      )}

      {!loading && !isSmallScreen && <Divider />}

      {!loading && !isSmallScreen && (
        <VStack align="stretch" overflowX="auto">
          <Table maxW="100%">
            <Thead>
              <Tr>
                <Th>Tx Hash</Th>
                <Th>Created At</Th>
                <Th>Sender</Th>
                <Th>Recipient</Th>
                <Th>Amount</Th>
                <Th>Nonce</Th>
                <Th>Status</Th>
                <Th>Mint Tx Hash</Th>
              </Tr>
            </Thead>
            <Tbody>
              {mints.map(mint => {
                const nonce = nonceMap[mint.recipient_address.toLowerCase()];
                const isMintNotReady =
                  nonce != null
                    ? !mint.nonce || BigInt(mint.nonce) > nonce + BigInt(1)
                    : true;
                const isMintCompleted =
                  nonce != null
                    ? !!mint.nonce && BigInt(mint.nonce) <= nonce
                    : true;

                return (
                  <Tr key={mint._id.toString()}>
                    <Td>
                      <HashDisplay chainId={mint.sender_chain_id}>
                        {mint.transaction_hash}
                      </HashDisplay>
                    </Td>
                    <Td>{humanFormattedDate(mint.created_at)}</Td>
                    <Td>
                      <HashDisplay chainId={mint.sender_chain_id}>
                        {mint.sender_address}
                      </HashDisplay>
                    </Td>
                    <Td>
                      <HashDisplay chainId={mint.recipient_chain_id}>
                        {mint.recipient_address}
                      </HashDisplay>
                    </Td>
                    <Td>{formatUnits(BigInt(mint.amount), 6)}</Td>
                    <Td>{mint.nonce}</Td>
                    <Td>
                      <Tooltip
                        label={
                          mint.status === 'pending'
                            ? `The transaction has ${mint.confirmations} confirmations out of a total of ${POKT_CONFIRMATIONS} required.`
                            : ''
                        }
                      >
                        <HStack spacing={1}>
                          <Text>{mint.status}</Text>
                          {mint.status === 'pending' && (
                            <QuestionIcon fontSize="xs" />
                          )}
                        </HStack>
                      </Tooltip>
                    </Td>
                    <Td>
                      {mint.mint_tx_hash ? (
                        <HashDisplay chainId={mint.recipient_chain_id}>
                          {mint.mint_tx_hash}
                        </HashDisplay>
                      ) : (
                        <>
                          {loadingNonce ? (
                            <Spinner
                              thickness="2px"
                              speed="0.65s"
                              size="sm"
                              color="blue.500"
                            />
                          ) : nonce != null &&
                            (mint.status === 'signed' ||
                              (mint.status === 'confirmed' &&
                                mint.signatures.length >=
                                  Number(signerThreshold))) ? (
                            <Tooltip
                              label={
                                isMintNotReady
                                  ? 'Please complete previous mints first'
                                  : isMintCompleted
                                    ? 'Mint completed, please wait for validators to mark it as complete'
                                    : ''
                              }
                            >
                              <Button
                                isLoading={
                                  isLoading &&
                                  mint._id.toString() === currentMintId
                                }
                                onClick={() => mintTokens(mint)}
                                isDisabled={
                                  isMintNotReady ||
                                  isMintCompleted ||
                                  !isConnected
                                }
                                colorScheme="blue"
                                maxH="2rem"
                                minW="8.5rem"
                                maxW="9rem"
                                w="100%"
                              >
                                Mint
                              </Button>
                            </Tooltip>
                          ) : (
                            <Text>N/A</Text>
                          )}
                        </>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </VStack>
      )}

      <VStack spacing={4} mt={4} w="100%">
        <Pagination {...pagination} />
        <Button isLoading={loading} onClick={() => reload()} colorScheme="blue">
          Reload
        </Button>
      </VStack>
    </VStack>
  );
};
