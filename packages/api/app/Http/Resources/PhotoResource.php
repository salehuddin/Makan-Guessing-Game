<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PhotoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'venue_id' => $this->venue_id,
            'submitter_id' => $this->submitter_id,
            'category' => $this->category,
            'status' => $this->status,
            'censored_url' => $this->censored_url,
            'thumbnail_url' => $this->thumbnail_url,
            'quality_score' => $this->quality_score,
            'total_guesses' => $this->total_guesses,
            'avg_rating' => $this->avg_rating,
            'correct_guesses' => $this->correct_guesses,
            'created_at' => $this->created_at,
            'venue' => VenueResource::make($this->whenLoaded('venue')),
            'submitter' => [
                'id' => $this->whenLoaded('submitter', fn () => $this->submitter->id),
                'username' => $this->whenLoaded('submitter', fn () => $this->submitter->username),
            ],
        ];
    }
}
