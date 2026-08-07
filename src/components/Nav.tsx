import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/invoices", label: "Invoices" },
  { href: "/ledger", label: "Ledger" },
  { href: "/settings", label: "Settings" },
];

export default function Nav() {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-50">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 dark:bg-slate-100 text-xs font-bold text-white dark:text-slate-900">
            H
          </span>
          Harbor
        </Link>
        <nav className="flex gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}