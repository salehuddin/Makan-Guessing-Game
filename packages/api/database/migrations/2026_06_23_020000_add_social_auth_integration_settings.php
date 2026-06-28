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
            'google_auth',
            'facebook_auth',
            'apple_auth',
            'tiktok_auth',
        ])->delete();
    }
};
