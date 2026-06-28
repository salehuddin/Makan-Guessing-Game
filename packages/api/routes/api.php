<?php

use App\Http\Controllers\AdController;
use App\Http\Controllers\Admin\AdminAdViewController as AdminAdViews;
use App\Http\Controllers\Admin\AdminDailyChallengeController as AdminDailyChallenges;
use App\Http\Controllers\Admin\AdminDashboardController as AdminDashboard;
use App\Http\Controllers\Admin\AdminGameModeController as AdminGameModes;
use App\Http\Controllers\Admin\AdminGuessController as AdminGuesses;
use App\Http\Controllers\Admin\AdminIntegrationController as AdminIntegrations;
use App\Http\Controllers\Admin\AdminPhotoController as AdminPhotos;
use App\Http\Controllers\Admin\AdminSettingsController as AdminSettings;
use App\Http\Controllers\Admin\AdminUserController as AdminUsers;
use App\Http\Controllers\Admin\AdminVenueController as AdminVenues;
use App\Http\Controllers\Admin\AdminXpEventController as AdminXpEvents;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\OtpController;
use App\Http\Controllers\DailyChallengeController;
use App\Http\Controllers\GuessController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\ModerationController;
use App\Http\Controllers\PhotoController;
use App\Http\Controllers\PlayController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\TranslationController;
use App\Http\Controllers\UserPhoneController;
use App\Http\Controllers\UserProfileController;
use App\Http\Controllers\VenueController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('social', [AuthController::class, 'social']);
    Route::post('otp/send', [OtpController::class, 'send']);
    Route::post('otp/verify', [OtpController::class, 'verify']);
    Route::post('logout', [OtpController::class, 'logout'])->middleware('auth:sanctum');
});

Route::get('/settings', [SettingsController::class, 'public']);
Route::get('/translations', [TranslationController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', fn (Request $request) => ['user' => $request->user()]);
    Route::patch('/user', [UserProfileController::class, 'update']);
    Route::post('/user/phone/send-otp', [UserPhoneController::class, 'send']);
    Route::post('/user/phone/verify-otp', [UserPhoneController::class, 'verify']);

    Route::prefix('venues')->group(function () {
        Route::get('/search', [VenueController::class, 'search']);
        Route::get('/google-lookup', [VenueController::class, 'googleLookup']);
        Route::get('/{venue}', [VenueController::class, 'show']);
        Route::post('/suggest', [VenueController::class, 'suggest'])->middleware('phone.verified');
    });

    Route::prefix('photos')->group(function () {
        Route::post('/', [PhotoController::class, 'upload'])->middleware('phone.verified');
        Route::get('/', [PhotoController::class, 'index']);
        Route::get('/{photo}', [PhotoController::class, 'show']);
    });

    Route::prefix('play')->group(function () {
        Route::post('/classic', [PlayController::class, 'classic']);
    });

    Route::prefix('daily-challenge')->group(function () {
        Route::get('/', [DailyChallengeController::class, 'show']);
        Route::post('/guesses', [DailyChallengeController::class, 'submit']);
    });

    Route::post('/guesses', [GuessController::class, 'submit']);

    Route::prefix('leaderboards')->group(function () {
        Route::get('/guessers', [LeaderboardController::class, 'guessers']);
        Route::get('/submitters', [LeaderboardController::class, 'submitters']);
    });

    Route::prefix('ads')->group(function () {
        Route::post('/rewarded/callback', [AdController::class, 'rewardedCallback']);
    });
});

Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/dashboard', [AdminDashboard::class, 'stats']);

    Route::get('/photos/pending', [ModerationController::class, 'pending']);
    Route::post('/photos/{photo}/approve', [ModerationController::class, 'approve']);
    Route::post('/photos/{photo}/reject', [ModerationController::class, 'reject']);
    Route::post('/photos/{photo}/quarantine', [AdminPhotos::class, 'quarantine']);

    Route::get('/photos', [AdminPhotos::class, 'index']);
    Route::get('/photos/{photo}', [AdminPhotos::class, 'show']);
    Route::patch('/photos/{photo}', [AdminPhotos::class, 'update']);

    Route::get('/users', [AdminUsers::class, 'index']);
    Route::get('/users/{user}', [AdminUsers::class, 'show']);
    Route::patch('/users/{user}', [AdminUsers::class, 'update']);

    Route::get('/venues', [AdminVenues::class, 'index']);
    Route::post('/venues', [AdminVenues::class, 'store']);
    Route::get('/venues/{venue}', [AdminVenues::class, 'show']);
    Route::patch('/venues/{venue}', [AdminVenues::class, 'update']);
    Route::delete('/venues/{venue}', [AdminVenues::class, 'destroy']);

    Route::get('/game-modes', [AdminGameModes::class, 'index']);
    Route::patch('/game-modes/{gameMode}', [AdminGameModes::class, 'update']);

    Route::get('/daily-challenges', [AdminDailyChallenges::class, 'index']);
    Route::post('/daily-challenges', [AdminDailyChallenges::class, 'store']);
    Route::get('/daily-challenges/{challenge}', [AdminDailyChallenges::class, 'show']);
    Route::patch('/daily-challenges/{challenge}', [AdminDailyChallenges::class, 'update']);
    Route::post('/daily-challenges/{challenge}/generate', [AdminDailyChallenges::class, 'generate']);
    Route::post('/daily-challenges/{challenge}/publish', [AdminDailyChallenges::class, 'publish']);
    Route::delete('/daily-challenges/{challenge}', [AdminDailyChallenges::class, 'destroy']);

    Route::get('/settings', [AdminSettings::class, 'index']);
    Route::patch('/settings', [AdminSettings::class, 'update']);

    Route::get('/integrations', [AdminIntegrations::class, 'index']);
    Route::patch('/integrations/{integration}', [AdminIntegrations::class, 'update']);
    Route::post('/integrations/{integration}/test', [AdminIntegrations::class, 'test']);

    Route::get('/guesses', [AdminGuesses::class, 'index']);
    Route::get('/guesses/{guess}', [AdminGuesses::class, 'show']);

    Route::get('/xp-events', [AdminXpEvents::class, 'index']);
    Route::get('/xp-events/{xpEvent}', [AdminXpEvents::class, 'show']);

    Route::get('/ad-views', [AdminAdViews::class, 'index']);
    Route::get('/ad-views/stats', [AdminAdViews::class, 'stats']);

    Route::post('/translations', [TranslationController::class, 'update']);
});
