<?php

namespace App\Services\Otp;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class DevOtpService implements OtpService
{
    public function send(string $phone): void
    {
        Cache::put("otp:{$phone}", '123456', now()->addMinutes(5));

        Log::info("Dev OTP sent to {$phone}: 123456");
    }

    public function verify(string $phone, string $code): bool
    {
        $stored = Cache::get("otp:{$phone}");

        if ($stored === null) {
            return false;
        }

        $valid = $stored === $code;

        if ($valid) {
            Cache::forget("otp:{$phone}");
        }

        return $valid;
    }
}
