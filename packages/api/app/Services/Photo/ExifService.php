<?php

namespace App\Services\Photo;

class ExifService
{
    public function extract(string $path): ?array
    {
        if (! file_exists($path)) {
            return null;
        }

        $data = @exif_read_data($path, 'ANY_TAG', true);

        if ($data === false) {
            return null;
        }

        $gps = $this->extractGps($data);
        $timestamp = $this->extractTimestamp($data);

        if ($gps === null && $timestamp === null) {
            return null;
        }

        return [
            'gps' => $gps,
            'timestamp' => $timestamp,
            'time_of_day' => $this->deriveTimeOfDay($timestamp),
        ];
    }

    public function extractGps(array $exif): ?array
    {
        if (! isset($exif['GPSLatitude']) || ! isset($exif['GPSLongitude'])) {
            return null;
        }

        $lat = $this->convertGpsCoordinate(
            $exif['GPSLatitude'],
            $exif['GPSLatitudeRef'] ?? 'N',
        );

        $lng = $this->convertGpsCoordinate(
            $exif['GPSLongitude'],
            $exif['GPSLongitudeRef'] ?? 'E',
        );

        if ($lat === null || $lng === null) {
            return null;
        }

        return ['lat' => $lat, 'lng' => $lng];
    }

    public function extractTimestamp(array $exif): ?string
    {
        foreach (['DateTimeOriginal', 'DateTime', 'FileDateTime'] as $key) {
            if (isset($exif[$key]) && is_string($exif[$key])) {
                try {
                    $date = \DateTime::createFromFormat('Y:m:d H:i:s', $exif[$key]);

                    if ($date !== false) {
                        return $date->format('Y-m-d H:i:s');
                    }
                } catch (\Exception) {
                    continue;
                }
            }
        }

        if (isset($exif['FileDateTime'])) {
            return date('Y-m-d H:i:s', $exif['FileDateTime']);
        }

        return null;
    }

    public function deriveTimeOfDay(?string $timestamp): ?string
    {
        if ($timestamp === null) {
            return null;
        }

        $hour = (int) date('H', strtotime($timestamp));

        return match (true) {
            $hour >= 5 && $hour < 12 => 'morning',
            $hour >= 12 && $hour < 17 => 'afternoon',
            $hour >= 17 && $hour < 22 => 'evening',
            default => 'late_night',
        };
    }

    public function validateGpsProximity(array $photoGps, array $venueGps, int $maxMeters = 50): bool
    {
        $distance = $this->haversineDistance(
            $photoGps['lat'],
            $photoGps['lng'],
            $venueGps['lat'],
            $venueGps['lng'],
        );

        return $distance <= $maxMeters;
    }

    private function convertGpsCoordinate(array $coordinate, string $hemisphere): ?float
    {
        if (count($coordinate) !== 3) {
            return null;
        }

        $degrees = $this->divide($coordinate[0]);
        $minutes = $this->divide($coordinate[1]);
        $seconds = $this->divide($coordinate[2]);

        if ($degrees === null || $minutes === null || $seconds === null) {
            return null;
        }

        $decimal = $degrees + ($minutes / 60) + ($seconds / 3600);

        if (in_array($hemisphere, ['S', 'W'])) {
            $decimal *= -1;
        }

        return round($decimal, 6);
    }

    private function divide(string $value): ?float
    {
        $parts = explode('/', $value);

        if (count($parts) === 1) {
            return (float) $parts[0];
        }

        $denominator = (float) $parts[1];

        if ($denominator === 0.0) {
            return null;
        }

        return (float) $parts[0] / $denominator;
    }

    private function haversineDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371000;

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
