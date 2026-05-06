import WalletButton from "@/components/WalletButton";
import ContractConfig from "@/components/ContractConfig";

export const metadata = {
  title: "Settings — Harbor",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Point the app at your deployed hedegpay_batch contract.
          </p>
        </div>
        <WalletButton />
      </div>

      <ContractConfig />
    </div>
  );
}