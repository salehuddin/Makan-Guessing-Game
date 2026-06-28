<?php

namespace App\Http\Controllers;

use App\Services\Otp\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserPhoneController extends Controller
{
    public function __construct(private OtpService $otp) {}

    public function send(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'regex:/^\+601[0-9]{8,9}$/', Rule::unique('users', 'phone')->ignore($request->user()->id)],
        ]);

        $this->otp->send($validated['phone']);

        return response()->json(['message' => 'OTP sent']);
    }

    public function verify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'regex:/^\+601[0-9]{8,9}$/', Rule::unique('users', 'phone')->ignore($request->user()->id)],
            'code' => ['required', 'string', 'size:6'],
        ]);

        if (! $this->otp->verify($validated['phone'], $validated['code'])) {
            return response()->json(['message' => 'Invalid or expired OTP'], 422);
        }

        $user = $request->user();
        $user->forceFill([
            'phone' => $validated['phone'],
            'phone_verified_at' => now(),
        ])->save();

        return response()->json([
            'message' => 'Phone verified',
            'user' => $user->refresh(),
        ]);
    }
}
