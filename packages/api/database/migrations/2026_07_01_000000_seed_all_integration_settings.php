<?php

use App\Models\IntegrationSetting;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $integrations = [
            ['key' => 'google_auth', 'label' => 'Google Login', 'description' => 'Google OAuth login. Requires GOOGLE_CLIENT_ID in .env.', 'enabled' => false, 'mode' => 'dev'],
            ['key' => 'facebook_auth', 'label' => 'Facebook / Meta Login', 'description' => 'Facebook login. Requires FACEBOOK_CLIENT_ID in .env.', 'enabled' => false, 'mode' => 'dev'],
            ['key' => 'apple_auth', 'label' => 'Apple Login', 'description' => 'Sign in with Apple. Requires APPLE_CLIENT_ID in .env and signed ID token verification before production use.', 'enabled' => false, 'mode' => 'dev'],
            ['key' => 'tiktok_auth', 'label' => 'TikTok Login', 'description' => 'TikTok login. Requires TIKTOK_CLIENT_KEY in .env.', 'enabled' => false, 'mode' => 'dev'],
            ['key' => 'twilio', 'label' => 'Twilio Phone OTP', 'description' => 'SMS OTP via Twilio Verify API. Disabled in dev (use code 123456).', 'enabled' => false, 'mode' => 'dev'],
            ['key' => 'r2', 'label' => 'Cloudflare R2 Storage', 'description' => 'Photo storage. Requires R2 credentials in .env.', 'enabled' => false, 'mode' => 'dev'],
            ['key' => 'redis', 'label' => 'Redis Cache', 'description' => 'Cache and queue driver. Falls back to database when disabled.', 'enabled' => false, 'mode' => 'dev'],
            ['key' => 'google_vision', 'label' => 'Google Cloud Vision', 'description' => 'Server-side face/NSFW/license-plate censorship. Phase 2 feature.', 'enabled' => false, 'mode' => 'dev'],
            ['key' => 'grabfood', 'label' => 'GrabFood Affiliate', 'description' => 'Post-guess affiliate deep links. Phase 2 feature.', 'enabled' => false, 'mode' => 'dev'],
            ['key' => 'reverb', 'label' => 'Laravel Reverb WebSockets', 'description' => 'Real-time duels and leaderboards. Phase 3 feature.', 'enabled' => false, 'mode' => 'dev'],
            ['key' => 'google_admob', 'label' => 'Google AdMob', 'description' => 'Mobile ad network. Configure ad unit IDs in Settings → Ads.', 'enabled' => false, 'mode' => 'dev'],
            ['key' => 'google_adsense', 'label' => 'Google AdSense', 'description' => 'Web ad network. Configure client/slot IDs in Settings → Ads.', 'enabled' => false, 'mode' => 'dev'],
            ['key' => 'google_maps', 'label' => 'Google Maps Places', 'description' => 'Place autocomplete and details for venue search. Requires GOOGLE_MAPS_API_KEY in .env.', 'enabled' => false, 'mode' => 'dev'],
        ];

        foreach ($integrations as $integration) {
            IntegrationSetting::updateOrCreate(
                ['key' => $integration['key']],
                $integration
            );
        }
    }

    public function down(): void
    {
        IntegrationSetting::whereIn('key', [
            'google_auth', 'facebook_auth', 'apple_auth', 'tiktok_auth',
            'twilio', 'r2', 'redis', 'google_vision', 'grabfood', 'reverb',
            'google_admob', 'google_adsense', 'google_maps',
        ])->delete();
    }
};
