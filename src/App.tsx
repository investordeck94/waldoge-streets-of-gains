import { DogeOSWalletProvider } from "@/contexts/DogeOSWalletProvider";
import { StreetBrawler } from "@/components/StreetBrawler";

const App = () => (
<DogeOSWalletProvider>
<StreetBrawler />
</DogeOSWalletProvider>
);

export default App;
