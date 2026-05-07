import WalletButton from "@/components/WalletButton";
import BatchPayoutForm from "@/components/BatchPayoutForm";

export const metadata = {
  title: "Invoices — Harbor",
};

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Invoices</h1>
          <p className="mt-1 text-sm text-slate-500">
            Compose a batch of payouts and submit it on-chain.
          </p>
        </div>
        <WalletButton />
      </div>

      <BatchPayoutForm />
    </div>
  );
}