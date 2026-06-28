<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\DB;

class VenueResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'address' => $this->address,
            'district' => $this->district,
            'venue_type' => $this->venue_type,
            'cuisine_tags' => $this->cuisine_tags,
            'price_range' => $this->price_range,
            'halal_status' => $this->halal_status,
            'location' => $this->getLocation(),
            'total_photos' => $this->whenCounted('photos'),
            'first_submitted_by' => $this->first_submitted_by,
            'google_place_id' => $this->google_place_id,
            'created_at' => $this->created_at,
        ];
    }

    private function getLocation(): ?array
    {
        if ($this->location === null) {
            return null;
        }

        $result = DB::selectOne(
            'SELECT ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat FROM venues WHERE id = ?',
            [$this->id]
        );

        if ($result === null) {
            return null;
        }

        return ['lat' => (float) $result->lat, 'lng' => (float) $result->lng];
    }
}
