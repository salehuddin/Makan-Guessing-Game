<?php

namespace App\Services\Otp;

use Twilio\Exceptions\TwilioException;
use Twilio\Rest\Client;

class TwilioOtpService implements OtpService
{
    private Client $client;

    public function __construct(
        private string $sid,
        private string $authToken,
        private string $verifyServiceSid,
    ) {
        $this->client = new Client($sid, $authToken);
    }

    public function send(string $phone): void
    {
        $this->client->verify->v2->services($this->verifyServiceSid)
            ->verifications
            ->create($phone, 'sms');
    }

    public function verify(string $phone, string $code): bool
    {
        try {
            $verification = $this->client->verify->v2->services($this->verifyServiceSid)
                ->verificationChecks
                ->create([
                    'to' => $phone,
                    'code' => $code,
                ]);

            return $verification->status === 'approved';
        } catch (TwilioException) {
            return false;
        }
    }
}
