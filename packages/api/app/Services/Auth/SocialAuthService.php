<?php

namespace App\Services\Auth;

use App\Services\IntegrationService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class SocialAuthService
{
    public function __construct(private IntegrationService $integrations) {}

    public function verify(string $provider, string $token): array
    {
        if (! $this->integrations->enabled("{$provider}_auth")) {
            throw new RuntimeException(ucfirst($provider).' login is disabled.');
        }

        if (app()->environment(['local', 'testing']) && Str::startsWith($token, 'mock:')) {
            return $this->mockProfile($provider, $token);
        }

        return match ($provider) {
            'google' => $this->google($token),
            'facebook' => $this->facebook($token),
            'apple' => $this->apple($token),
            'tiktok' => $this->tiktok($token),
            default => throw new RuntimeException('Unsupported social provider.'),
        };
    }

    private function mockProfile(string $provider, string $token): array
    {
        $email = Str::after($token, 'mock:') ?: "{$provider}@example.test";

        return [
            'provider_id' => "mock-{$provider}-{$email}",
            'email' => $email,
            'name' => Str::before($email, '@'),
        ];
    }

    private function google(string $token): array
    {
        $response = Http::get('https://oauth2.googleapis.com/tokeninfo', [
            'id_token' => $token,
        ]);

        if (! $response->ok() || ! $response->json('sub')) {
            throw new RuntimeException('Invalid Google token.');
        }

        return [
            'provider_id' => $response->json('sub'),
            'email' => $response->json('email'),
            'name' => $response->json('name'),
        ];
    }

    private function facebook(string $token): array
    {
        $response = Http::get('https://graph.facebook.com/me', [
            'fields' => 'id,name,email',
            'access_token' => $token,
        ]);

        if (! $response->ok() || ! $response->json('id')) {
            throw new RuntimeException('Invalid Facebook token.');
        }

        return [
            'provider_id' => $response->json('id'),
            'email' => $response->json('email'),
            'name' => $response->json('name'),
        ];
    }

    private function apple(string $token): array
    {
        throw new RuntimeException('Apple login requires signed ID token verification before it can be enabled.');
    }

    private function tiktok(string $token): array
    {
        $response = Http::withToken($token)->get('https://open.tiktokapis.com/v2/user/info/', [
            'fields' => 'open_id,union_id,avatar_url,display_name',
        ]);

        $user = $response->json('data.user');
        if (! $response->ok() || empty($user['open_id'])) {
            throw new RuntimeException('Invalid TikTok token.');
        }

        return [
            'provider_id' => $user['open_id'],
            'email' => null,
            'name' => $user['display_name'] ?? null,
        ];
    }
}
