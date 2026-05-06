import Link from "next/link";
import WalletButton from "@/components/WalletButton";
import ContractStatus from "@/components/ContractStatus";

export const metadata = {
  title: "Dashboard — Harbor",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Live state of the hedegpay_batch payroll contract.
          </p>
        </div>
        <WalletButton />
      </div>

      <ContractStatus />

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/invoices"
          className="rounded-lg border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-sm"
        >
          <h3 className="font-semibold">Run a payroll batch</h3>
          <p className="mt-1 text-sm text-slate-500">
            Build a batch of payouts and submit it to{" "}
            <code className="font-mono">execute_batch_payroll</code> with your
            Freighter wallet.
          </p>
        </Link>
        <Link
          href="/ledger"
          className="rounded-lg border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-sm"
        >
          <h3 className="font-semibold">Payout ledger</h3>
          <p className="mt-1 text-sm text-slate-500">
            Recent <code className="font-mono">payout_logged</code> events from
            the off-chain listener.
          </p>
        </Link>
      </div>
    </div>
  );
}