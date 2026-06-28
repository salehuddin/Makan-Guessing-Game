<?php

namespace App\Services\Otp;

interface OtpService
{
    public function send(string $phone): void;

    public function verify(string $phone, string $code): bool;
}
