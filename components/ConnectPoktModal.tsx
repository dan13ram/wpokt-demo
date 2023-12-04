import { usePocketWallet } from "@/contexts/PocketWallet";
import { useTransport } from "@/contexts/Transport";
import { Flex, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Text, ModalProps, Button } from "@chakra-ui/react";
import { useEffect } from "react";


export function ConnectPoktModal(props: ModalProps) {
    const { connectLedgerDevice, isUsingHardwareWallet } = useTransport()
    const { connectPocketWallet, poktAddress } = usePocketWallet()

    const poktWalletOptions = [
        {
            name: "SendWallet / NodeWallet",
            onConnect: async () => {
                await connectPocketWallet()
            }
        },
        {
            name: "Ledger",
            onConnect: async () => {
                await connectLedgerDevice()
            }
        },
    ]

    useEffect(() => {
        if (isUsingHardwareWallet) connectPocketWallet()
        if (poktAddress) props.onClose()
    }, [poktAddress, isUsingHardwareWallet])

    return (
        <Modal {...props} size="md" isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader textAlign="center" color="poktBlue">Connect POKT Wallet</ModalHeader>
                <ModalCloseButton color="poktBlue" />
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
    )
}
