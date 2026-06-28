# PHP Setup on Windows (Laravel 13 requirement)

Laravel 13 requires PHP `^8.3`. This machine now runs **PHP 8.5.7** as the default CLI `php` (at `C:\php`), which satisfies the constraint.

## Current state

| Path | Version | Notes |
|---|---|---|
| `C:\php` | 8.5.7 | In Machine PATH (default `php`) — **used by this project** |
| `C:\laragon\bin\php\php-8.5.7-nts-Win32-vs17-x64` | 8.5.7 | Laragon bundle (web server) |
| `C:\laragon\bin\php\php-8.3.*` | 8.3.x | Older Laragon bundles (fallback) |

`php -v` should print 8.5.7. If it doesn't, restart your terminal after any PATH change.

## Required extensions

Enabled in `C:\php\php.ini` (run `php --ini` to confirm the loaded ini):

| Extension | Why |
|---|---|
| `fileinfo` | Required by Laravel 13 (`league/flysystem-local`) |
| `zip` | Required by Composer for dist downloads |
| `gd` | Image processing (thumbnails, blur detection) |
| `exif` | EXIF GPS extraction from uploaded photos |
| `mbstring` | Laravel default |
| `openssl` | Laravel default |
| `pdo_sqlite` | Default dev DB (current) |
| `pdo_mysql` | MySQL fallback |
| `pdo_pgsql`, `pgsql` | PostgreSQL + PostGIS (production target) |
| `bcmath`, `intl`, `curl` | Laravel / app needs |

To enable an extension, uncomment its line in `php.ini` (e.g. `extension=pdo_sqlite`) and restart the terminal/web server.

## If your default `php` is older than 8.3

Run PowerShell **as Administrator** and prepend a Laragon-bundled 8.3+ build:

```powershell
$php = "C:\laragon\bin\php\php-8.5.7-nts-Win32-vs17-x64"
$old = [Environment]::GetEnvironmentVariable("Path", "Machine")
[Environment]::SetEnvironmentVariable("Path", "$php;$old", "Machine")
```

Restart your terminal. Verify: `php -v` should print 8.5.7 (or another 8.3+ release).

## Per-session override (no admin rights)

```powershell
$env:Path = "C:\laragon\bin\php\php-8.5.7-nts-Win32-vs17-x64;" + $env:Path
php artisan serve
```

The opencode Laravel Boost MCP uses the `php` from PATH, so it picks up whichever PHP is active.

## Laragon UI method (web server only)

Right-click the Laragon tray icon → **PHP** → **php-8.5.7-nts-Win32-vs17-x64**. This swaps the web server PHP, but does **not** change the CLI `php` in PATH — you still need the PATH fix above for `php artisan` and `composer`.
