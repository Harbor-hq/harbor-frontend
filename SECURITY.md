# Security Policy

## Supported Versions

We actively support and patch security vulnerabilities on the following versions of Harbor:

| Version | Supported |
| ------- | --------- |
| v0.1.x  | :white_check_mark: Yes |
| < v0.1  | :x: No |

## Reporting a Vulnerability

We take the security of Harbor seriously. If you find a security vulnerability, please do **not** open a public issue. Instead, report it privately to our security team.

Please email vulnerability reports to **security@harbor.finance** (or contact the maintainers directly via GitHub/Telegram).

### What to Include
To help us triage and patch the issue quickly, please include:
- A clear description of the vulnerability and its potential impact.
- Step-by-step instructions to reproduce the issue (including any payload or contract parameters).
- The scope/components affected (see below).

## Scope

The following components within the Harbor ecosystem are in scope for security reports:
1. **Frontend:** [harbor-frontend](https://github.com/Harbor-hq/harbor-frontend) (Next.js dashboard portal)
2. **Backend:** [harbor-backend](https://github.com/Harbor-hq/harbor-backend) (Soroban event listener microservice & SQLite indexer)
3. **Smart Contracts:** `hedgepay_batch` (Soroban smart contracts in Rust)

## Expected Response Times

- **Initial Triage:** Within 48 hours of receipt.
- **Vulnerability Patch/Fix:** Usually within 7 business days, depending on severity.
- **Disclosure:** Public disclosure of the vulnerability will be coordinated after a patch is released and deployed.

Thank you for helping keep Harbor secure!
