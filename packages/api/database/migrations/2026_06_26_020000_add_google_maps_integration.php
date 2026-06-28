<?php

use App\Models\IntegrationSetting;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        IntegrationSetting::updateOrCreate(
            ['key' => 'google_maps'],
            [
                'key' => 'google_maps',
                'label' => 'Google Maps Places',
                'description' => 'Place autocomplete and details for venue search. Requires GOOGLE_MAPS_API_KEY in .env.',
                'enabled' => false,
                'mode' => 'dev',
            ]
        );
    }

    public function down(): void
    {
        IntegrationSetting::where('key', 'google_maps')->delete();
    }
};
