<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['key', 'label', 'description', 'enabled', 'mode', 'settings', 'last_checked_at', 'last_status', 'last_error'])]
class IntegrationSetting extends Model
{
    protected $table = 'integration_settings';

    protected $casts = [
        'enabled' => 'boolean',
        'settings' => 'array',
        'last_checked_at' => 'datetime',
    ];

    public const INTEGRATIONS = [
        'google_auth' => 'Google Login',
        'facebook_auth' => 'Facebook / Meta Login',
        'apple_auth' => 'Apple Login',
        'tiktok_auth' => 'TikTok Login',
        'twilio' => 'Twilio Phone OTP',
        'r2' => 'Cloudflare R2 Storage',
        'redis' => 'Redis Cache',
        'google_vision' => 'Google Cloud Vision',
        'grabfood' => 'GrabFood Affiliate',
        'reverb' => 'Laravel Reverb WebSockets',
        'google_admob' => 'Google AdMob',
        'google_adsense' => 'Google AdSense',
        'google_maps' => 'Google Maps Places',
    ];

    public const CREDENTIAL_FIELDS = [
        'google_auth' => [
            'client_id' => ['label' => 'Client ID', 'secret' => false, 'env' => 'GOOGLE_CLIENT_ID'],
        ],
        'facebook_auth' => [
            'client_id' => ['label' => 'Client ID', 'secret' => false, 'env' => 'FACEBOOK_CLIENT_ID'],
        ],
        'apple_auth' => [
            'client_id' => ['label' => 'Client ID', 'secret' => false, 'env' => 'APPLE_CLIENT_ID'],
        ],
        'tiktok_auth' => [
            'client_key' => ['label' => 'Client Key', 'secret' => false, 'env' => 'TIKTOK_CLIENT_KEY'],
        ],
        'twilio' => [
            'sid' => ['label' => 'SID', 'secret' => false, 'env' => 'TWILIO_SID'],
            'auth_token' => ['label' => 'Auth Token', 'secret' => true, 'env' => 'TWILIO_AUTH_TOKEN'],
            'verify_service_sid' => ['label' => 'Verify Service SID', 'secret' => false, 'env' => 'TWILIO_VERIFY_SERVICE_SID'],
        ],
        'r2' => [
            'access_key_id' => ['label' => 'Access Key ID', 'secret' => false, 'env' => 'R2_ACCESS_KEY_ID'],
            'secret_access_key' => ['label' => 'Secret Access Key', 'secret' => true, 'env' => 'R2_SECRET_ACCESS_KEY'],
            'bucket' => ['label' => 'Bucket', 'secret' => false, 'env' => 'AWS_BUCKET'],
            'endpoint' => ['label' => 'Endpoint URL', 'secret' => false, 'env' => 'AWS_ENDPOINT'],
        ],
        'redis' => [
            'host' => ['label' => 'Host', 'secret' => false, 'env' => 'REDIS_HOST'],
            'port' => ['label' => 'Port', 'secret' => false, 'env' => 'REDIS_PORT'],
            'password' => ['label' => 'Password', 'secret' => true, 'env' => 'REDIS_PASSWORD'],
        ],
        'reverb' => [
            'app_id' => ['label' => 'App ID', 'secret' => false, 'env' => 'REVERB_APP_ID'],
            'app_key' => ['label' => 'App Key', 'secret' => false, 'env' => 'REVERB_APP_KEY'],
            'app_secret' => ['label' => 'App Secret', 'secret' => true, 'env' => 'REVERB_APP_SECRET'],
        ],
        'google_vision' => [
            'credentials' => ['label' => 'Credentials JSON', 'secret' => true, 'env' => 'GOOGLE_APPLICATION_CREDENTIALS'],
        ],
        'google_maps' => [
            'api_key' => ['label' => 'API Key', 'secret' => true, 'env' => 'GOOGLE_MAPS_API_KEY'],
        ],
        'google_admob' => [],
        'google_adsense' => [],
        'grabfood' => [],
    ];

    public function markChecked(string $status, ?string $error = null): void
    {
        $this->update([
            'last_checked_at' => now(),
            'last_status' => $status,
            'last_error' => $error,
        ]);
    }
}
