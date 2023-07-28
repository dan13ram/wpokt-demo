import { QuestionIcon } from '@chakra-ui/icons';
import {
  Button,
  Divider,
  HStack,
  Table,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  VStack,
} from '@chakra-ui/react';
import { utils } from 'ethers';

import useAllInvalidMints from '@/hooks/useAllInvalidMints';

import { HashDisplay } from './HashDisplay';

export const InvalidMintPanel: React.FC = () => {
  const { invalidMints, reload, loading } = useAllInvalidMints();

  return (
    <VStack align="stretch">
      <Divider />
      {!loading && (
        <VStack align="stretch" overflowX="auto">
          <Table maxW="100%">
            <Thead>
              <Tr>
                <Th>Transaction Hash</Th>
                <Th>Height</Th>
                <Th>Sender Address</Th>
                <Th>Amount</Th>
                <Th>Memo</Th>
                <Th>Created</Th>
                <Th>Status</Th>
                <Th>Return Tx Hash</Th>
              </Tr>
            </Thead>
            {invalidMints.map(invalidMint => (
              <Tr key={invalidMint._id.toString()}>
                <Td>
                  <HashDisplay chainId={invalidMint.sender_chain_id}>
                    {invalidMint.transaction_hash}
                  </HashDisplay>
                </Td>
                <Td>{invalidMint.height}</Td>
                <Td>
                  <HashDisplay chainId={invalidMint.sender_chain_id}>
                    {invalidMint.sender_address}
                  </HashDisplay>
                </Td>
                <Td>{utils.formatUnits(invalidMint.amount, 6)}</Td>
                <Td>{invalidMint.memo}</Td>
                <Td>{new Date(invalidMint.created_at).toLocaleString()}</Td>
                <Td>
                  <Tooltip
                    label={
                      invalidMint.status === 'pending'
                        ? `The transaction has ${invalidMint.confirmations} confirmations out of a total of 1 required.`
                        : ''
                    }
                  >
                    <HStack spacing={1}>
                      <Text>{invalidMint.status}</Text>
                      {invalidMint.status === 'pending' && (
                        <QuestionIcon fontSize="xs" />
                      )}
                    </HStack>
                  </Tooltip>
                </Td>
                <Td>
                  {invalidMint.return_tx_hash && (
                    <HashDisplay chainId={invalidMint.sender_chain_id}>
                      {invalidMint.return_tx_hash}
                    </HashDisplay>
                  )}
                </Td>
              </Tr>
            ))}
          </Table>
        </VStack>
      )}

      <Button isLoading={loading} onClick={() => reload()} colorScheme="blue">
        Reload
      </Button>
    </VStack>
  );
};
