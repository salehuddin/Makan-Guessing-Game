<?php

namespace Database\Seeders;

use App\Models\AppSetting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            ['key' => 'classic_guess_enabled', 'value' => true, 'type' => 'boolean', 'group' => 'game', 'label' => 'Classic Guess enabled', 'description' => 'Enable the Classic Guess game mode for players.', 'is_public' => true],
            ['key' => 'daily_challenge_enabled', 'value' => true, 'type' => 'boolean', 'group' => 'game', 'label' => 'Daily Challenge enabled', 'description' => 'Enable the Daily Challenge game mode for players.', 'is_public' => true],
            ['key' => 'photo_upload_enabled', 'value' => true, 'type' => 'boolean', 'group' => 'content', 'label' => 'Photo upload enabled', 'description' => 'Allow players to submit new photos.', 'is_public' => true],
            ['key' => 'venue_suggestions_enabled', 'value' => true, 'type' => 'boolean', 'group' => 'content', 'label' => 'Venue suggestions enabled', 'description' => 'Allow players to suggest new venues.', 'is_public' => true],
            ['key' => 'classic_option_count', 'value' => 4, 'type' => 'integer', 'group' => 'game', 'label' => 'Classic Guess option count', 'description' => 'Number of multiple-choice options shown per Classic round.', 'is_public' => false],
            ['key' => 'daily_round_count', 'value' => 5, 'type' => 'integer', 'group' => 'game', 'label' => 'Daily Challenge round count', 'description' => 'Number of photos in a Daily Challenge.', 'is_public' => true],
            ['key' => 'exclude_own_submissions', 'value' => true, 'type' => 'boolean', 'group' => 'game', 'label' => 'Exclude own submissions', 'description' => 'Prevent players from guessing photos they submitted.', 'is_public' => false],
            ['key' => 'exclude_already_guessed_photos', 'value' => true, 'type' => 'boolean', 'group' => 'game', 'label' => 'Exclude already guessed photos', 'description' => 'Prevent players from guessing the same photo twice.', 'is_public' => false],
            ['key' => 'require_approved_photos', 'value' => true, 'type' => 'boolean', 'group' => 'content', 'label' => 'Require approved photos', 'description' => 'Only serve photos with approved status.', 'is_public' => false],
            ['key' => 'require_censored_url', 'value' => true, 'type' => 'boolean', 'group' => 'content', 'label' => 'Require censored URL', 'description' => 'Only serve photos that have a public censored image URL.', 'is_public' => false],
            ['key' => 'underplayed_photo_threshold', 'value' => 10, 'type' => 'integer', 'group' => 'game', 'label' => 'Underplayed photo threshold', 'description' => 'Photos with fewer guesses than this get a staleness boost.', 'is_public' => false],
            ['key' => 'freshness_boost_days', 'value' => 30, 'type' => 'integer', 'group' => 'game', 'label' => 'Freshness boost days', 'description' => 'New photos get a freshness boost for this many days.', 'is_public' => false],
            ['key' => 'show_submitter_credit', 'value' => true, 'type' => 'boolean', 'group' => 'display', 'label' => 'Show submitter credit', 'description' => 'Display the submitter username on photos during gameplay.', 'is_public' => true],
            ['key' => 'show_category_tag', 'value' => true, 'type' => 'boolean', 'group' => 'display', 'label' => 'Show category tag', 'description' => 'Display the photo category tag during gameplay.', 'is_public' => true],
            ['key' => 'default_language', 'value' => 'en', 'type' => 'string', 'group' => 'display', 'label' => 'Default language', 'description' => 'Default language for new players when no preference exists.', 'is_public' => true],
            ['key' => 'return_correct_answer_before_guess', 'value' => false, 'type' => 'boolean', 'group' => 'security', 'label' => 'Return correct answer before guess', 'description' => 'EXPOSES the correct venue in the play response. Keep OFF for production to prevent cheating.', 'is_public' => false],
            ['key' => 'ads_enabled_mobile', 'value' => false, 'type' => 'boolean', 'group' => 'ads', 'label' => 'Mobile ads enabled', 'description' => 'Enable ads in the mobile app (AdMob).', 'is_public' => true],
            ['key' => 'ads_enabled_web', 'value' => false, 'type' => 'boolean', 'group' => 'ads', 'label' => 'Web ads enabled', 'description' => 'Enable ads in the web app (AdSense).', 'is_public' => true],
            ['key' => 'ads_provider_mobile', 'value' => 'google_admob', 'type' => 'string', 'group' => 'ads', 'label' => 'Mobile ad provider', 'description' => 'Ad provider for mobile: google_admob, applovin, none.', 'is_public' => true],
            ['key' => 'ads_provider_web', 'value' => 'google_adsense', 'type' => 'string', 'group' => 'ads', 'label' => 'Web ad provider', 'description' => 'Ad provider for web: google_adsense, none.', 'is_public' => true],
            ['key' => 'ads_placement_home_banner', 'value' => true, 'type' => 'boolean', 'group' => 'ads', 'label' => 'Home banner ad', 'description' => 'Show a banner ad on the home screen.', 'is_public' => true],
            ['key' => 'ads_placement_play_bottom', 'value' => true, 'type' => 'boolean', 'group' => 'ads', 'label' => 'Play screen bottom banner', 'description' => 'Show a banner ad at the bottom of the play screen.', 'is_public' => true],
            ['key' => 'ads_placement_interstitial_interval', 'value' => 5, 'type' => 'integer', 'group' => 'ads', 'label' => 'Interstitial interval', 'description' => 'Show a full-screen interstitial ad every N classic rounds. Set 0 to disable.', 'is_public' => true],
            ['key' => 'ads_rewarded_streak_freeze', 'value' => true, 'type' => 'boolean', 'group' => 'ads', 'label' => 'Rewarded: streak freeze', 'description' => 'Allow watching a rewarded ad to freeze a broken streak.', 'is_public' => true],
            ['key' => 'ads_rewarded_double_xp', 'value' => true, 'type' => 'boolean', 'group' => 'ads', 'label' => 'Rewarded: double XP', 'description' => 'Allow watching a rewarded ad to double the last guess score.', 'is_public' => true],
            ['key' => 'ads_admob_app_id_android', 'value' => 'ca-app-pub-3940256099942544~3347511713', 'type' => 'string', 'group' => 'ads', 'label' => 'AdMob Android App ID', 'description' => 'Google AdMob Android App ID. Test ID seeded by default.', 'is_public' => true],
            ['key' => 'ads_admob_app_id_ios', 'value' => 'ca-app-pub-3940256099942544~1458002511', 'type' => 'string', 'group' => 'ads', 'label' => 'AdMob iOS App ID', 'description' => 'Google AdMob iOS App ID. Test ID seeded by default.', 'is_public' => true],
            ['key' => 'ads_admob_banner_unit_id', 'value' => 'ca-app-pub-3940256099942544/6300978111', 'type' => 'string', 'group' => 'ads', 'label' => 'AdMob Banner Unit ID', 'description' => 'Google AdMob Banner ad unit ID. Test ID seeded by default.', 'is_public' => true],
            ['key' => 'ads_admob_interstitial_id', 'value' => 'ca-app-pub-3940256099942544/1033173712', 'type' => 'string', 'group' => 'ads', 'label' => 'AdMob Interstitial Unit ID', 'description' => 'Google AdMob Interstitial ad unit ID. Test ID seeded by default.', 'is_public' => true],
            ['key' => 'ads_admob_rewarded_id', 'value' => 'ca-app-pub-3940256099942544/5224354917', 'type' => 'string', 'group' => 'ads', 'label' => 'AdMob Rewarded Unit ID', 'description' => 'Google AdMob Rewarded video ad unit ID. Test ID seeded by default.', 'is_public' => true],
            ['key' => 'ads_adsense_client_id', 'value' => 'ca-pub-3940256099942544', 'type' => 'string', 'group' => 'ads', 'label' => 'AdSense Client ID', 'description' => 'Google AdSense Publisher ID (ca-pub-xxx). Test ID seeded by default.', 'is_public' => true],
            ['key' => 'ads_adsense_slot_id', 'value' => '', 'type' => 'string', 'group' => 'ads', 'label' => 'AdSense Slot ID', 'description' => 'Google AdSense ad slot ID. Leave empty to use auto-ads.', 'is_public' => true],
        ];

        foreach ($settings as $setting) {
            AppSetting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }

        $this->command->info('Seeded '.count($settings).' app settings.');
    }
}
