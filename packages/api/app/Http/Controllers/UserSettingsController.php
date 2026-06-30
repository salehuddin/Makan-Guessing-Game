<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class UserSettingsController extends Controller
{
    public function updatePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', Password::min(8), 'confirmed'],
        ]);

        $user = $request->user();

        if (! Hash::check($validated['current_password'], $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->forceFill([
            'password' => Hash::make($validated['password']),
        ])->save();

        return response()->json(['message' => 'Password updated.']);
    }

    public function updateEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255', 'unique:users,email,'.$request->user()->id],
            'password' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (! Hash::check($validated['password'], $user->password)) {
            return response()->json(['message' => 'Password is incorrect.'], 422);
        }

        $user->forceFill([
            'email' => $validated['email'],
            'email_verified_at' => null,
        ])->save();

        return response()->json([
            'message' => 'Email updated. Please verify your new email.',
            'user' => $user->refresh(),
        ]);
    }

    public function updatePreferences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'language' => ['sometimes', 'string', 'in:en,ms,zh'],
            'notifications_enabled' => ['sometimes', 'boolean'],
            'profile_visibility' => ['sometimes', 'string', 'in:public,private'],
        ]);

        $user = $request->user();
        $user->fill($validated);
        $user->save();

        return response()->json(['user' => $user->refresh()]);
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        return $this->uploadImage($request, 'avatar_url', 'avatars');
    }

    public function uploadCover(Request $request): JsonResponse
    {
        return $this->uploadImage($request, 'cover_url', 'covers');
    }

    public function destroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (! Hash::check($validated['password'], $user->password)) {
            return response()->json(['message' => 'Password is incorrect.'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'Account deleted.']);
    }

    private function uploadImage(Request $request, string $field, string $directory): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'max:5120'],
        ]);

        $user = $request->user();

        if ($user->$field) {
            $oldPath = parse_url($user->$field, PHP_URL_PATH);
            if ($oldPath) {
                $oldPath = ltrim($oldPath, '/');
                Storage::disk($this->storageDisk())->delete($oldPath);
            }
        }

        $uploadedFile = $request->file('image');
        $filename = $directory.'/'.$user->id.'.'.$uploadedFile->getClientOriginalExtension();

        Storage::disk($this->storageDisk())->putFileAs(
            $directory,
            $uploadedFile,
            $user->id.'.'.$uploadedFile->getClientOriginalExtension()
        );

        $url = Storage::disk($this->storageDisk())->url($filename);

        $user->forceFill([$field => $url])->save();

        return response()->json(['user' => $user->refresh()]);
    }

    private function storageDisk(): string
    {
        return config('filesystems.default', 'local');
    }
}
