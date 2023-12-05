import {
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Text,
} from '@chakra-ui/react';
import { useEffect } from 'react';

import { usePocketWallet } from '@/contexts/PocketWallet';
import { useTransport } from '@/contexts/Transport';

export const ConnectPoktModal: React.FC<
  Omit<ModalProps, 'children'>
> = props => {
  const { connectLedgerDevice, isUsingHardwareWallet } = useTransport();
  const { connectPocketWallet, poktAddress, poktNetwork } = usePocketWallet();

  const poktWalletOptions = [
    {
      name: 'SendWallet / NodeWallet',
      onConnect: connectPocketWallet,
    },
    {
      name: 'Ledger',
      onConnect: connectLedgerDevice,
    },
  ];

  const { onClose } = props;

  useEffect(() => {
    if (isUsingHardwareWallet) connectPocketWallet();
  }, [isUsingHardwareWallet, connectPocketWallet]);

  useEffect(() => {
    if (poktAddress && poktNetwork) onClose();
  }, [poktAddress, poktNetwork, onClose]);

  return (
    <Modal size="md" isCentered {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader textAlign="center">Connect POKT Wallet</ModalHeader>
        <ModalCloseButton />
        <ModalBody padding={0}>
          <Flex
            direction="column"
            justify="center"
            align="center"
            padding={4}
            paddingX={8}
            gap={4}
            mb={4}
          >
            {poktWalletOptions.map((wallet, i) => (
              <Button
                key={i}
                colorScheme="blue"
                width="100%"
                onClick={wallet.onConnect}
              >
                <Text fontSize={16}>{wallet.name}</Text>
              </Button>
            ))}
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
