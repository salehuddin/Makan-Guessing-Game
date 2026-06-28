<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class GooglePlacesService
{
    private const AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';

    private const DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

    private const PLACE_TYPE_MAP = [
        'restaurant' => 'restaurant',
        'cafe' => 'cafe',
        'food' => 'restaurant',
        'meal_takeaway' => 'hawker_stall',
        'meal_delivery' => 'restaurant',
    ];

    public function __construct(
        private ?string $apiKey = null,
    ) {
        $this->apiKey ??= config('services.google_maps.api_key');
    }

    /** @return array<int, array{place_id: string, name: string, address: string}> */
    public function autocomplete(string $query, ?float $lat = null, ?float $lng = null): array
    {
        if (empty($this->apiKey)) {
            throw new RuntimeException('GOOGLE_MAPS_API_KEY is not set in .env.');
        }

        $params = [
            'input' => $query,
            'key' => $this->apiKey,
            'components' => 'country:my',
            'types' => 'establishment',
        ];

        if ($lat !== null && $lng !== null) {
            $params['location'] = "{$lat},{$lng}";
            $params['radius'] = '50000';
        }

        try {
            $response = Http::get(self::AUTOCOMPLETE_URL, $params);
        } catch (ConnectionException $e) {
            throw new RuntimeException('Google Places autocomplete request failed: '.$e->getMessage());
        }

        if (! $response->ok()) {
            throw new RuntimeException('Google Places autocomplete returned status '.$response->status());
        }

        $data = $response->json();

        if (($data['status'] ?? '') === 'REQUEST_DENIED') {
            throw new RuntimeException('Google Places API denied: '.($data['error_message'] ?? 'Unknown error.'));
        }

        return collect($data['predictions'] ?? [])
            ->map(fn ($prediction) => [
                'place_id' => $prediction['place_id'],
                'name' => $prediction['structured_formatting']['main_text'] ?? $prediction['description'],
                'address' => $prediction['structured_formatting']['secondary_text'] ?? $prediction['description'],
            ])
            ->values()
            ->all();
    }

    /** @return array{place_id: string, name: string, address: string, lat: float, lng: float, district: string, venue_type: string} */
    public function getPlaceDetails(string $placeId): array
    {
        if (empty($this->apiKey)) {
            throw new RuntimeException('GOOGLE_MAPS_API_KEY is not set in .env.');
        }

        $params = [
            'place_id' => $placeId,
            'key' => $this->apiKey,
            'fields' => 'name,formatted_address,geometry,address_components,types',
        ];

        try {
            $response = Http::get(self::DETAILS_URL, $params);
        } catch (ConnectionException $e) {
            throw new RuntimeException('Google Places details request failed: '.$e->getMessage());
        }

        if (! $response->ok()) {
            throw new RuntimeException('Google Places details returned status '.$response->status());
        }

        $data = $response->json();

        if (($data['status'] ?? '') !== 'OK' || ! isset($data['result'])) {
            throw new RuntimeException('Google Places details error: '.($data['error_message'] ?? $data['status'] ?? 'Unknown'));
        }

        $result = $data['result'];

        $venueType = $this->mapVenueType($result['types'] ?? []);
        $district = $this->extractDistrict($result['address_components'] ?? []);

        return [
            'place_id' => $placeId,
            'name' => $result['name'] ?? '',
            'address' => $result['formatted_address'] ?? '',
            'lat' => $result['geometry']['location']['lat'] ?? 0,
            'lng' => $result['geometry']['location']['lng'] ?? 0,
            'district' => $district,
            'venue_type' => $venueType,
        ];
    }

    /** @param array<int, string> $types */
    private function mapVenueType(array $types): string
    {
        foreach ($types as $type) {
            if (isset(self::PLACE_TYPE_MAP[$type])) {
                return self::PLACE_TYPE_MAP[$type];
            }
        }

        return 'restaurant';
    }

    /** @param array<int, array{types: array<int, string>, long_name: string, short_name: string}> $components */
    private function extractDistrict(array $components): string
    {
        foreach ($components as $component) {
            $types = $component['types'] ?? [];
            if (in_array('sublocality', $types, true) || in_array('sublocality_level_1', $types, true)) {
                return $component['long_name'] ?? '';
            }
        }

        foreach ($components as $component) {
            $types = $component['types'] ?? [];
            if (in_array('locality', $types, true)) {
                return $component['long_name'] ?? '';
            }
        }

        return '';
    }
}
