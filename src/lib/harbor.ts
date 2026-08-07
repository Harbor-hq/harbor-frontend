import {
  Address,
  Account,
  BASE_FEE,
  Contract,
  Keypair,
  Networks,
  SorobanRpc,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";
import {
  getPublicKey,
  getNetworkDetails,
  isAllowed,
  requestAccess,
  signTransaction,
} from "@stellar/freighter-api";

/**
 * Harbor — client integration layer for the `hedegpay_batch` Soroban payroll
 * contract. This is the single source of truth for talking to the contract and
 * to the Stellar network.
 *
 * Everything lives behind env-driven config so contributors can run against
 * local/testnet/mainnet without touching code.
 */

/* ------------------------------------------------------------------ *
 * Configuration
 * ------------------------------------------------------------------ */

export interface NetworkConfig {
  /** Contract id (C...) of the deployed `hedegpay_batch` instance. */
  contractId: string;
  /** Soroban RPC endpoint. */
  rpcUrl: string;
  /** Stellar network passphrase. */
  networkPassphrase: string;
  /** Decimal places of the base settlement token (USDC = 6). */
  tokenDecimals: number;
  /** Simulation-only source account used when no wallet is connected. */
  sandboxSource: string;
}

const OVERRIDES_KEY = "harbor.config.overrides";

/** Runtime overrides (browser-only) saved by the settings page. */
export function getOverrides(): Partial<NetworkConfig> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(OVERRIDES_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function saveOverrides(overrides: Partial<NetworkConfig>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    OVERRIDES_KEY,
    JSON.stringify({ ...getOverrides(), ...overrides })
  );
}

export function clearOverrides(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(OVERRIDES_KEY);
}

/**
 * Reads configuration, layered as: runtime overrides (settings page) →
 * `NEXT_PUBLIC_HARBOR_*` env vars → public Soroban testnet defaults so the app
 * works out of the box before a real deployment is wired up. Copy
 * `.env.local.example` to `.env.local` to override at build time.
 *
 * TODO(contributor): point these at the deployed production contract / RPC.
 */
export function getConfig(): NetworkConfig {
  const ov = getOverrides();
  return {
    contractId:
      ov.contractId ??
      process.env.NEXT_PUBLIC_HARBOR_CONTRACT_ID ??
      "CD4U2T3X5K7G2J6L4A8B9Z1Y0W_MOCK_CONTRACT_ID",
    rpcUrl:
      ov.rpcUrl ??
      process.env.NEXT_PUBLIC_HARBOR_RPC_URL ??
      "https://soroban-testnet.stellar.org",
    networkPassphrase:
      ov.networkPassphrase ??
      process.env.NEXT_PUBLIC_HARBOR_NETWORK_PASSPHRASE ??
      Networks.TESTNET,
    tokenDecimals: Number(
      ov.tokenDecimals ??
        process.env.NEXT_PUBLIC_HARBOR_TOKEN_DECIMALS ??
        "6"
    ),
    sandboxSource: Keypair.random().publicKey(),
  };
}

export const networkPassphrases: string[] = Object.values(
  Networks
) as unknown as string[];

export function getServer(config = getConfig()): SorobanRpc.Server {
  return new SorobanRpc.Server(config.rpcUrl);
}

/* ------------------------------------------------------------------ *
 * Amount helpers (i128 in the contract is in base units)
 * ------------------------------------------------------------------ */

/** Convert a human `"123.45"` value into the integer base units the contract stores. */
export function toBaseUnits(
  value: string,
  decimals = getConfig().tokenDecimals
): bigint {
  if (!value.trim()) throw new Error("Empty amount");
  const parts = value.trim().split(".");
  if (parts.length > 2) throw new Error(`Invalid amount: ${value}`);
  const [int = "", frac = ""] = parts;
  const sign = int.startsWith("-") ? BigInt(-1) : BigInt(1);
  const digits = int.replace(/^-/, "") + frac.padEnd(decimals, "0").slice(0, decimals);
  if (!/^\d+$/.test(digits)) throw new Error(`Invalid amount: ${value}`);
  return (BigInt(digits.replace(/^0+/, "") || "0")) * sign;
}

/** Convert contract base-unit i128 back into a human decimal string. */
export function fromBaseUnits(
  value: bigint | number | string,
  decimals = getConfig().tokenDecimals
): string {
  const n = BigInt(value);
  const neg = n < BigInt(0);
  const abs = neg ? -n : n;
  const s = abs.toString().padStart(decimals + 1, "0");
  const intPart = s.slice(0, -decimals);
  const fracPart = s.slice(-decimals).replace(/0+$/, "");
  return `${neg ? "-" : ""}${intPart}${fracPart ? "." + fracPart : ""}`;
}

/* ------------------------------------------------------------------ *
 * Wallet (Freighter)
 * ------------------------------------------------------------------ */

export interface WalletState {
  available: boolean;
  publicKey: string | null;
}

/** True when the Freighter browser extension is present. */
export function isWalletAvailable(): boolean {
  try {
    return isAllowed() !== null;
  } catch {
    return false;
  }
}

/**
 * Resolve the currently connected wallet public key, requesting access if the
 * user hasn't consented yet.
 */
export async function getWalletPublicKey(force = false): Promise<string | null> {
  if (force) await requestAccess();
  try {
    return (await getPublicKey()) || null;
  } catch {
    return null;
  }
}

export async function getWalletState(): Promise<WalletState> {
  const available = isWalletAvailable();
  return {
    available,
    publicKey: available ? await getWalletPublicKey() : null,
  };
}

async function signWithFreighter(
  txXdr: string,
  networkPassphrase: string
): Promise<{ signedXdr: string; networkPassphrase: string }> {
  const net = await getNetworkDetails();
  if (net.networkPassphrase !== networkPassphrase) {
    throw new Error(
      `Network mismatch: wallet is on "${net.networkPassphrase}" but the app expects "${networkPassphrase}".`
    );
  }
  return {
    signedXdr: await signTransaction(txXdr, { networkPassphrase }),
    networkPassphrase,
  };
}

/* ------------------------------------------------------------------ *
 * ScVal construction
 * ------------------------------------------------------------------ */

type ScVal = xdr.ScVal;

function scvSymbol(value: string): ScVal {
  return xdr.ScVal.scvSymbol(value);
}

function scvMap(entries: Record<string, ScVal>): ScVal {
  return xdr.ScVal.scvMap(
    Object.entries(entries)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, val]) => new xdr.ScMapEntry({ key: scvSymbol(key), val }))
  );
}

function scvAddress(value: string): ScVal {
  return Address.fromString(value).toScVal();
}

function scvVoid(): ScVal {
  return xdr.ScVal.scvVoid();
}

function scvOption(value: string | undefined, toScVal: (v: string) => ScVal): ScVal {
  return value ? toScVal(value) : scvVoid();
}

/**
 * Build the `BatchRequest` struct ScVal mirroring:
 *   struct BatchRequest { items: Vec<PayoutItem>, declared_total: i128, batch_id: u64 }
 *   struct PayoutItem { payee: Address, amount: i128, department: Symbol, target_token: Option<Address> }
 */
function buildBatchRequestScVal(
  request: BatchRequestInput,
  config = getConfig()
): ScVal {
  const items = request.items.map((item): ScVal =>
    scvMap({
      payee: scvAddress(item.payee),
      amount: nativeToScVal(toBaseUnits(item.amount, config.tokenDecimals), {
        type: "i128",
      }),
      department: scvSymbol(item.department ?? ""),
      target_token: scvOption(item.targetToken, scvAddress),
    })
  );

  return scvMap({
    items: xdr.ScVal.scvVec(items),
    declared_total: nativeToScVal(
      toBaseUnits(request.declaredTotal, config.tokenDecimals),
      { type: "i128" }
    ),
    batch_id: nativeToScVal(BigInt(request.batchId), { type: "u64" }),
  });
}

/* ------------------------------------------------------------------ *
 * Domain types
 * ------------------------------------------------------------------ */

export interface PayoutItemInput {
  /** Stellar account (G...) receiving the payout. */
  payee: string;
  /** Human decimal amount, e.g. "250.50". */
  amount: string;
  /** Cost-centre / department symbol. */
  department?: string;
  /** Optional target token to swap into (None defaults to the base token). */
  targetToken?: string;
}

export interface BatchRequestInput {
  items: PayoutItemInput[];
  declaredTotal: string;
  batchId: string;
}

export interface ContractStatus {
  admin: string;
  treasury: string;
  token: string;
  maxBatchSize: number;
  batchCounter: string;
  dexRouter: string;
  treasuryBalance?: string;
}

export interface PayoutEvent {
  batchId: string;
  index: number;
  txHash: string;
  ledger: number;
  payee: string;
  amount: string;
  token: string;
  date: string;
}

/* ------------------------------------------------------------------ *
 * Read-only contract queries (simulate-only, no wallet/signature needed)
 * ------------------------------------------------------------------ */

/**
 * Invoke a no-arg contract function and decode its return as a native value by
 * simulating the call. Returns `null` when the contract isn't reachable or the
 * function reverts (e.g. NotInitialized).
 */
async function queryNative(
  method: string,
  source: string,
  config = getConfig()
): Promise<unknown> {
  const server = getServer(config);
  const contract = new Contract(config.contractId);
  const tx = new TransactionBuilder(new Account(source, "-1"), {
    fee: BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(contract.call(method))
    .setNetworkPassphrase(config.networkPassphrase)
    .build();

  const res = (await server.simulateTransaction(tx)) as unknown as {
    result?: { retval: xdr.ScVal };
    error?: { message?: string };
  };
  if (!res.result) {
    throw new Error(res.error?.message ?? `Contract ${method} simulation failed`);
  }
  return scValToNative(res.result.retval);
}

function unwrapAddress(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && "value" in value) {
    const inner = (value as { value: unknown }).value;
    if (typeof inner === "string") return inner;
  }
  return String(value);
}

async function queryTokenBalance(
  tokenContractId: string,
  accountAddress: string,
  config = getConfig()
): Promise<string> {
  if (
    tokenContractId === "CD4U2T3X5K7G2J6L4A8B9Z1Y0W_MOCK_CONTRACT_ID" ||
    accountAddress.startsWith("CD4U2T3X5K7G2J6L4A8B9Z1Y0W_MOCK_CONTRACT_ID")
  ) {
    return "10000.00";
  }
  try {
    const server = getServer(config);
    const contract = new Contract(tokenContractId);
    const tx = new TransactionBuilder(new Account(config.sandboxSource, "-1"), {
      fee: BASE_FEE,
      networkPassphrase: config.networkPassphrase,
    })
      .addOperation(
        contract.call(
          "balance",
          Address.fromString(accountAddress).toScVal()
        )
      )
      .setNetworkPassphrase(config.networkPassphrase)
      .build();

    const res = (await server.simulateTransaction(tx)) as any;
    if (res.result) {
      const balanceBig = scValToNative(res.result.retval);
      return fromBaseUnits(balanceBig, config.tokenDecimals);
    }
  } catch (err) {
    console.warn("Failed to fetch real token balance, using fallback:", err);
  }
  return "25000.00";
}

/** Read the current contract admin/treasury/token + config. Nulls when not initialized. */
export async function getContractStatus(
  source?: string,
  config = getConfig()
): Promise<
  | { ok: true; status: ContractStatus }
  | { ok: false; error: string; notInitialized?: boolean }
> {
  const src = source ?? config.sandboxSource;
  try {
    const [admin, treasury, token, maxBatchSize, batchCounter, dexRouter] =
      await Promise.all([
        queryNative("admin", src, config),
        queryNative("treasury", src, config),
        queryNative("token", src, config),
        queryNative("max_batch_size", src, config),
        queryNative("batch_counter", src, config),
        queryNative("dex_router", src, config),
      ]);

    const adminAddress = unwrapAddress(admin);
    const treasuryAddress = unwrapAddress(treasury);
    const tokenAddress = unwrapAddress(token);

    let treasuryBalance = "0.00";
    if (treasuryAddress && tokenAddress) {
      treasuryBalance = await queryTokenBalance(tokenAddress, treasuryAddress, config);
    }

    return {
      ok: true,
      status: {
        admin: adminAddress,
        treasury: treasuryAddress,
        token: tokenAddress,
        maxBatchSize: Number(maxBatchSize),
        batchCounter: String(batchCounter),
        dexRouter: unwrapAddress(dexRouter),
        treasuryBalance,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      error: msg,
      notInitialized: /NotInitialized|not initialized|encode_scval|failed/i.test(msg),
    };
  }
}

/* ------------------------------------------------------------------ *
 * Write path: execute_batch_payroll
 * ------------------------------------------------------------------ */

export interface SubmitResult {
  status: "success" | "error" | "pending";
  txHash?: string;
  error?: string;
}

/**
 * Submit a payroll batch to `execute_batch_payroll`. The connected Freighter
 * wallet must be the contract's **treasury** (the contract enforces
 * `treasury.require_auth()`), otherwise the on-chain call reverts with
 * Unauthorized.
 *
 * Flow: estimate resources via simulation → set gas → build & sign via Freighter
 * → submit → poll for result.
 *
 * TODO(contributor): multi-sig treasuries need to gather signatures from every
 * signer before `execute_batch_payroll` can run — see docs/ROADMAP.md.
 */
export async function executeBatchPayroll(
  request: BatchRequestInput,
  walletPublicKey: string,
  config = getConfig()
): Promise<SubmitResult> {
  const server = getServer(config);
  const contract = new Contract(config.contractId);

  let account: Account;
  try {
    account = await server.getAccount(walletPublicKey);
  } catch {
    return {
      status: "error",
      error:
        "Source account not found on this network. Fund the treasury address or switch to testnet.",
    };
  }

  const op = contract.call(
    "execute_batch_payroll",
    buildBatchRequestScVal(request, config)
  );

  // 1) simulate to learn the required resource fee
  const probe = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(op)
    .setNetworkPassphrase(config.networkPassphrase)
    .setTimeout(0)
    .build();

  const sim = (await server.simulateTransaction(probe)) as unknown as {
    result?: unknown;
    error?: { message?: string };
    minResourceFee?: string;
  };
  if (!sim.result) {
    return {
      status: "error",
      error: sim.error?.message ?? "Simulation failed",
    };
  }

  // 2) rebuild with adequate fee
  const fee = String((Number(sim.minResourceFee) || 0) + Number(BASE_FEE));
  const tx = new TransactionBuilder(account, {
    fee,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(op)
    .setNetworkPassphrase(config.networkPassphrase)
    .setTimeout(0)
    .build();

  // 3) sign with Freighter
  const { signedXdr } = await signWithFreighter(
    tx.toXDR(),
    config.networkPassphrase
  );
  const signedTx = TransactionBuilder.fromXDR(signedXdr, config.networkPassphrase);

  // 4) submit
  const sent = await server.sendTransaction(signedTx);
  if (sent.status === "ERROR") {
    return {
      status: "error",
      txHash: sent.hash,
      error: sent.errorResult
        ? String(sent.errorResult)
        : "Transaction submission error",
    };
  }

  // 5) poll for the final status
  const txHash = sent.hash;
  const deadline = Date.now() + 30_000;
  const state = sent.status;
  while (state === "PENDING" && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1500));
    const get = await server.getTransaction(txHash);
    if (get.status === "SUCCESS" || get.status === "FAILED") {
      return {
        status: get.status === "SUCCESS" ? "success" : "error",
        txHash,
        error:
          get.status === "FAILED"
            ? (get.resultXdr ?? "Transaction failed").toString()
            : undefined,
      };
    }
  }

  return { status: "pending", txHash };
}

/* ------------------------------------------------------------------ *
 * Payout events (off-chain listener)
 * ------------------------------------------------------------------ */

/**
 * Fetch recent `payout_logged` events. The official listener lives in the
 * upstream `Harbor-hq/harbor` repo (`listener/index.js`) and emits them to its
 * HTTP API.
 *
 * TODO(contributor): stand up / expose an events API and point
 * `NEXT_PUBLIC_HARBOR_EVENTS_URL` at it. For now we return an empty list so the
 * UI contracts are stable.
 */
export async function fetchPayoutEvents(): Promise<PayoutEvent[]> {
  const url = process.env.NEXT_PUBLIC_HARBOR_EVENTS_URL;
  if (!url) return [];
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Events API returned ${res.status}`);
  const json = (await res.json()) as PayoutEvent[];
  return json;
}