<?php

namespace App\Services\Game;

use App\Models\Venue;
use Illuminate\Support\Collection;

class DistractorService
{
    public function generate(string $correctVenueId, string $district, int $count = 3): Collection
    {
        $sameDistrict = Venue::where('id', '!=', $correctVenueId)
            ->where('district', $district)
            ->inRandomOrder()
            ->limit($count)
            ->get();

        if ($sameDistrict->count() >= $count) {
            return $sameDistrict;
        }

        $needed = $count - $sameDistrict->count();
        $excludeIds = $sameDistrict->pluck('id')->push($correctVenueId)->toArray();

        $otherDistricts = Venue::whereNotIn('id', $excludeIds)
            ->inRandomOrder()
            ->limit($needed)
            ->get();

        return $sameDistrict->concat($otherDistricts);
    }
}
