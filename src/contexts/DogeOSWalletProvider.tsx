import { createContext, useContext, type FC, type ReactNode } from "react";
import {
ChainTypeEnum,
WalletConnectProvider,
useAccount,
useWalletConnect,
} from "@dogeos/dogeos-sdk";
import { DOGEOS_CHAIN } from "@/lib/chains/dogeos";

export type DogeOSStatus =
| "unsupported"
| "disconnected"
| "connecting"
| "connected"
| "wrong-chain";

interface DogeOSWalletContextValue {
status: DogeOSStatus;
address: string | null;
chainId: string | number | null;
isCorrectChain: boolean;
error: string | null;
connect: () => Promise<void>;
disconnect: () => void;
switchToDogeOS: () => Promise<void>;
}

const DogeOSWalletContext =
createContext<DogeOSWalletContextValue | null>(null);

const dogeConfig = {
clientId: import.meta.env.VITE_DOGEOS_CLIENT_ID,
defaultConnectChain: ChainTypeEnum.EVM,
chains: {
evm: [
{
id: DOGEOS_CHAIN.chainId,
name: DOGEOS_CHAIN.name,
nativeCurrency: {
name: "DOGE",
symbol: DOGEOS_CHAIN.nativeSymbol,
decimals: 18,
},
rpcUrls: {
default: {
http: [DOGEOS_CHAIN.rpcUrl],
},
},
blockExplorers: {
default: {
name: "DogeOS Explorer",
url: DOGEOS_CHAIN.explorerUrl,
},
},
testnet: true,
},
],
},
};

const DogeOSWalletInner: FC<{ children: ReactNode }> = ({ children }) => {
const {
isConnected,
isConnecting,
error: sdkError,
openModal,
disconnect,
} = useWalletConnect();

const {
address,
chainType,
chainId,
switchChain,
} = useAccount();

const isCorrectChain =
chainType === ChainTypeEnum.EVM &&
Number(chainId) === DOGEOS_CHAIN.chainId;

const status: DogeOSStatus = isConnecting
? "connecting"
: !isConnected || !address
? "disconnected"
: !isCorrectChain
? "wrong-chain"
: "connected";

const error =
sdkError instanceof Error
? sdkError.message
: sdkError
? String(sdkError)
: null;

const connect = async () => {
await openModal();
};

const switchToDogeOS = async () => {
await switchChain({
chainType: ChainTypeEnum.EVM,
chainInfo: {
id: DOGEOS_CHAIN.chainId,
name: DOGEOS_CHAIN.name,
nativeCurrency: {
name: "DOGE",
symbol: DOGEOS_CHAIN.nativeSymbol,
decimals: 18,
},
rpcUrls: {
default: {
http: [DOGEOS_CHAIN.rpcUrl],
},
},
blockExplorers: {
default: {
name: "DogeOS Explorer",
url: DOGEOS_CHAIN.explorerUrl,
},
},
testnet: true,
},
});
};

return (
<DogeOSWalletContext.Provider
value={{
status,
address: address ?? null,
chainId: chainId ?? null,
isCorrectChain,
error,
connect,
disconnect,
switchToDogeOS,
}}
>
{children}
</DogeOSWalletContext.Provider>
);
};

export const DogeOSWalletProvider: FC<{ children: ReactNode }> = ({
children,
}) => (
<WalletConnectProvider config={dogeConfig}>
<DogeOSWalletInner>{children}</DogeOSWalletInner>
</WalletConnectProvider>
);

export function useDogeOSWallet(): DogeOSWalletContextValue {
const context = useContext(DogeOSWalletContext);

if (!context) {
throw new Error(
"useDogeOSWallet must be used within a DogeOSWalletProvider",
);
}

return context;
}
