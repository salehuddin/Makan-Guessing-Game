<?php

namespace App\Http\Controllers;

use App\Services\Game\DistractorService;
use App\Services\Game\PhotoSelectionService;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlayController extends Controller
{
    public function __construct(
        private PhotoSelectionService $selectionService,
        private DistractorService $distractorService,
        private SettingsService $settings,
    ) {}

    public function classic(Request $request): JsonResponse
    {
        if (! $this->settings->bool('classic_guess_enabled', true)) {
            return response()->json(['message' => 'Classic Guess is currently disabled.'], 403);
        }

        $user = $request->user();

        $photo = $this->selectionService->selectForUser($user);

        if ($photo === null) {
            return response()->json([
                'message' => 'No more photos available to guess. Try again later or submit some photos!',
            ], 404);
        }

        $photo->load(['venue', 'submitter']);

        $optionCount = $this->settings->int('classic_option_count', 4);
        $showSubmitter = $this->settings->bool('show_submitter_credit', true);
        $showCategory = $this->settings->bool('show_category_tag', true);
        $exposeAnswer = $this->settings->bool('return_correct_answer_before_guess', false);

        $distractors = $this->distractorService->generate(
            $photo->venue_id,
            $photo->venue->district,
            max(0, $optionCount - 1),
        );

        $options = $distractors->concat([$photo->venue])
            ->shuffle()
            ->map(fn ($venue) => [
                'id' => $venue->id,
                'name' => $venue->name,
            ])
            ->values();

        $photoData = [
            'id' => $photo->id,
            'censored_url' => $photo->censored_url,
            'thumbnail_url' => $photo->thumbnail_url,
            'created_at' => $photo->created_at,
        ];

        if ($showCategory) {
            $photoData['category'] = $photo->category;
        }
        if ($showSubmitter) {
            $photoData['submitter'] = $photo->submitter->username;
        }

        $response = [
            'photo' => $photoData,
            'options' => $options,
        ];

        if ($exposeAnswer) {
            $response['correct_venue_id'] = $photo->venue_id;
        }

        return response()->json($response);
    }
}
