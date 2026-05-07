import WalletButton from "@/components/WalletButton";
import PayoutEvents from "@/components/PayoutEvents";

export const metadata = {
  title: "Ledger — Harbor",
};

export default function LedgerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Ledger</h1>
          <p className="mt-1 text-sm text-slate-500">
            History of processed payroll batches from the payout listener.
          </p>
        </div>
        <WalletButton />
      </div>

      <PayoutEvents />
    </div>
  );
}