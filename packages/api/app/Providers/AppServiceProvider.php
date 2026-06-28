<?php

namespace App\Providers;

use App\Services\CredentialService;
use App\Services\Otp\DevOtpService;
use App\Services\Otp\OtpService;
use App\Services\Otp\TwilioOtpService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(OtpService::class, function ($app) {
            $driver = config('services.otp.driver', 'dev');

            if ($driver === 'twilio') {
                return new TwilioOtpService(
                    config('services.twilio.sid'),
                    config('services.twilio.auth_token'),
                    config('services.twilio.verify_service_sid'),
                );
            }

            return new DevOtpService;
        });
    }

    public function boot(): void
    {
        try {
            if ($this->app->runningInConsole() === false || $this->app->runningUnitTests()) {
                $this->app->make(CredentialService::class)->bootstrapConfigs();
            }
        } catch (\Throwable) {
            // Avoid failing during migrations or early bootstrap before DB exists
        }
    }
}
