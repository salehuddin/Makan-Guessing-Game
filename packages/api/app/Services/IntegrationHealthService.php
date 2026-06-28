<?php

namespace App\Services;

use App\Models\IntegrationSetting;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Twilio\Exceptions\TwilioException;
use Twilio\Rest\Client as TwilioClient;

class IntegrationHealthService
{
    /** @return array{status:string,error:?string} */
    public function test(IntegrationSetting $integration): array
    {
        try {
            $result = match ($integration->key) {
                'google_auth', 'facebook_auth', 'apple_auth', 'tiktok_auth' => $this->testSocialProvider($integration->key),
                'twilio' => $this->testTwilio(),
                'r2' => $this->testR2Storage(),
                'redis' => $this->testRedis(),
                'reverb' => $this->testReverb(),
                'google_vision' => $this->testGoogleVision(),
                'google_admob' => $this->testGoogleAdmob(),
                'google_adsense' => $this->testGoogleAdsense(),
                'google_maps' => $this->testGoogleMaps(),
                'grabfood' => ['status' => 'pending', 'error' => 'GrabFood affiliate API details not configured yet.'],
                default => ['status' => 'pending', 'error' => "No health check defined for '{$integration->key}'."],
            };
        } catch (RuntimeException $e) {
            return ['status' => 'error', 'error' => $e->getMessage()];
        } catch (ConnectionException $e) {
            return ['status' => 'error', 'error' => $e->getMessage()];
        } catch (\Throwable $e) {
            return ['status' => 'error', 'error' => $e->getMessage()];
        }

        return $result;
    }

    /** @return array{status:string,error:?string} */
    private function testSocialProvider(string $key): array
    {
        $provider = str_replace('_auth', '', $key);

        $configKey = match ($provider) {
            'google' => 'services.google.client_id',
            'facebook' => 'services.facebook.client_id',
            'apple' => 'services.apple.client_id',
            'tiktok' => 'services.tiktok.client_key',
            default => null,
        };

        if ($configKey === null) {
            throw new RuntimeException("Unknown social provider '{$provider}'.");
        }

        $value = config($configKey);

        if (empty($value)) {
            throw new RuntimeException(strtoupper($provider).'_'.($provider === 'tiktok' ? 'CLIENT_KEY' : 'CLIENT_ID').' is not set in .env.');
        }

        return ['status' => 'ok', 'error' => null];
    }

    /** @return array{status:string,error:?string} */
    private function testTwilio(): array
    {
        $sid = config('services.twilio.sid');
        $authToken = config('services.twilio.auth_token');
        $verifyServiceSid = config('services.twilio.verify_service_sid');

        if (empty($sid) || empty($authToken) || empty($verifyServiceSid)) {
            throw new RuntimeException('TWILIO_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID must be set in .env.');
        }

        if (app()->environment(['local', 'testing'])) {
            return ['status' => 'ok', 'error' => null];
        }

        try {
            $client = new TwilioClient($sid, $authToken);
            $client->verify->v2->services($verifyServiceSid)->fetch();
        } catch (TwilioException $e) {
            throw new RuntimeException('Twilio API error: '.$e->getMessage());
        }

        return ['status' => 'ok', 'error' => null];
    }

    /** @return array{status:string,error:?string} */
    private function testR2Storage(): array
    {
        $disk = Storage::disk('r2');

        if (! $disk instanceof Filesystem) {
            throw new RuntimeException('R2 filesystem disk is not configured.');
        }

        $key = getenv('AWS_ACCESS_KEY_ID');
        $bucket = getenv('AWS_BUCKET');
        $endpoint = getenv('AWS_ENDPOINT');

        if (empty($key) || empty($bucket) || empty($endpoint)) {
            throw new RuntimeException('R2_ACCESS_KEY_ID, AWS_BUCKET, and AWS_ENDPOINT must be set in .env.');
        }

        if (app()->environment(['local', 'testing'])) {
            return ['status' => 'ok', 'error' => null];
        }

        try {
            $disk->exists('guesseat-health-check.txt');
        } catch (\Throwable $e) {
            throw new RuntimeException('R2 storage error: '.$e->getMessage());
        }

        return ['status' => 'ok', 'error' => null];
    }

    /** @return array{status:string,error:?string} */
    private function testRedis(): array
    {
        $host = getenv('REDIS_HOST');
        $port = getenv('REDIS_PORT');

        if (empty($host) || empty($port)) {
            throw new RuntimeException('REDIS_HOST and REDIS_PORT must be set in .env.');
        }

        if (app()->environment('testing')) {
            return ['status' => 'ok', 'error' => null];
        }

        try {
            Redis::connection('cache')->ping();
        } catch (\Throwable $e) {
            throw new RuntimeException('Redis connection error: '.$e->getMessage());
        }

        return ['status' => 'ok', 'error' => null];
    }

    /** @return array{status:string,error:?string} */
    private function testReverb(): array
    {
        $appId = getenv('REVERB_APP_ID');
        $key = getenv('REVERB_APP_KEY');

        if (empty($appId) || empty($key)) {
            throw new RuntimeException('REVERB_APP_ID and REVERB_APP_KEY must be set in .env.');
        }

        return ['status' => 'ok', 'error' => null];
    }

    /** @return array{status:string,error:?string} */
    private function testGoogleVision(): array
    {
        $credentials = getenv('GOOGLE_CLOUD_CREDENTIALS')
            ?: getenv('GOOGLE_APPLICATION_CREDENTIALS');

        if (empty($credentials)) {
            throw new RuntimeException('GOOGLE_CLOUD_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS must be set in .env.');
        }

        return ['status' => 'ok', 'error' => null];
    }

    /** @return array{status:string,error:?string} */
    private function testGoogleAdmob(): array
    {
        $settings = app(SettingsService::class);

        $required = [
            'ads_admob_app_id_android',
            'ads_admob_app_id_ios',
            'ads_admob_banner_unit_id',
            'ads_admob_interstitial_id',
            'ads_admob_rewarded_id',
        ];

        $missing = [];
        foreach ($required as $key) {
            if (empty($settings->string($key))) {
                $missing[] = $key;
            }
        }

        if (count($missing) > 0) {
            throw new RuntimeException('Missing AdMob settings: '.implode(', ', $missing).'. Configure them in Settings → Ads.');
        }

        return ['status' => 'ok', 'error' => null];
    }

    /** @return array{status:string,error:?string} */
    private function testGoogleAdsense(): array
    {
        $settings = app(SettingsService::class);

        $clientId = $settings->string('ads_adsense_client_id');

        if (empty($clientId)) {
            throw new RuntimeException('Missing ads_adsense_client_id. Configure it in Settings → Ads.');
        }

        return ['status' => 'ok', 'error' => null];
    }

    /** @return array{status:string,error:?string} */
    private function testGoogleMaps(): array
    {
        $apiKey = config('services.google_maps.api_key');

        if (empty($apiKey)) {
            throw new RuntimeException('GOOGLE_MAPS_API_KEY is not set in .env.');
        }

        return ['status' => 'ok', 'error' => null];
    }
}
