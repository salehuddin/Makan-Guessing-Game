<?php

use App\Models\IntegrationSetting;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $integrations = [
            ['key' => 'google_admob', 'label' => 'Google AdMob', 'description' => 'Mobile ad network. Configure ad unit IDs in Settings → Ads.', 'enabled' => false, 'mode' => 'dev'],
            ['key' => 'google_adsense', 'label' => 'Google AdSense', 'description' => 'Web ad network. Configure client/slot IDs in Settings → Ads.', 'enabled' => false, 'mode' => 'dev'],
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
            'google_admob',
            'google_adsense',
        ])->delete();
    }
};
