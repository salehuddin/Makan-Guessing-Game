# Local Development Setup

## Prerequisites

- **PHP 8.3+** (Laravel 13 requires `^8.3`; PHP 8.5.7 in use). See `php-setup.md` if your default `php` is older.
- **Composer** 2.8+
- **Node.js** 20+ and **pnpm** 11+ (`npm i -g pnpm`)
- **PostgreSQL 16** with PostGIS (planned; SQLite works for early backend dev)
- **Laragon** (serves the Laravel app)

## 1. PHP version

Laravel 13 requires PHP `^8.3`. This machine now runs **PHP 8.5.7** as the default `php` (at `C:\php`). Verify:

```powershell
php -v   # should print 8.5.7 (or any 8.3+ release)
```

If your default `php` is older than 8.3, see `php-setup.md` to switch to a Laragon-bundled 8.3+ build.

Required PHP extensions (already enabled in `C:\php\php.ini`): `fileinfo`, `zip`, `gd`, `exif`, `mbstring`, `pdo_sqlite`, `pdo_mysql`, `pdo_pgsql`, `pgsql`, `bcmath`, `openssl`, `intl`, `curl`.

## 2. Backend (packages/api)

```bash
cd packages/api
cp .env.example .env      # already done by create-project
php artisan key:generate  # already done
php artisan migrate       # uses sqlite by default; switch to pgsql in .env later
php artisan serve         # http://127.0.0.1:8000
```

Laragon will also serve `packages/api/public` automatically if you map a virtual host.

## 3. Frontend (web)

```bash
# from repo root
pnpm install
pnpm dev:web              # http://127.0.0.1:5173 (proxies /api -> 127.0.0.1:8000)
```

## 4. Mobile (Expo)

```bash
pnpm dev:mobile           # starts Expo dev server; press i / a for simulators
```

## 5. Run everything

```bash
pnpm dev                  # turbo dev — runs api, web, mobile concurrently
```

## 6. opencode + Laravel Boost MCP

`opencode.json` (gitignored, machine-local) wires the `laravel-boost` MCP server:

```json
{
  "mcp": {
    "laravel-boost": {
      "type": "local",
      "command": ["php", "artisan", "boost:mcp"],
      "cwd": "packages/api",
      "enabled": true,
      "timeout": 60000
    }
  }
}
```

The MCP command uses the `php` from PATH (PHP 8.5.7). **Restart opencode** after editing this file. The MCP server provides:

- `search-docs` — semantic search over Laravel 13.x docs (use before writing Laravel code)
- `application-info` — installed package versions
- `database-schema` / `database-query` — inspect the DB
- `last-error` / `read-log-logs` — debug

If you recreate `opencode.json`, copy the snippet above. If `php` is not on PATH, replace `"php"` with the absolute path to your PHP 8.3+ executable.

## Troubleshooting

- **`could not find driver` on migrate** — ensure `pdo_sqlite` (or `pdo_pgsql`) is enabled in your `php.ini` (`php --ini` shows its location).
- **Laravel installs as v12 not v13** — your `php` is still < 8.3. Fix per `php-setup.md`.
- **MCP tools missing in opencode** — restart opencode after changing `opencode.json`.
