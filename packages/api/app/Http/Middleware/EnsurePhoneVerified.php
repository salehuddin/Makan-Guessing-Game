<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePhoneVerified
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user?->phone || ! $user->phone_verified_at) {
            return response()->json([
                'message' => 'A verified phone number is required to become a submitter.',
                'code' => 'PHONE_REQUIRED',
            ], 403);
        }

        return $next($request);
    }
}
