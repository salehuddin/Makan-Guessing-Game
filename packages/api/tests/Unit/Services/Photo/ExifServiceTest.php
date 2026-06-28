<?php

namespace Tests\Unit\Services\Photo;

use App\Services\Photo\ExifService;
use Tests\TestCase;

class ExifServiceTest extends TestCase
{
    private ExifService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new ExifService;
    }

    public function test_derive_time_of_day_morning(): void
    {
        $this->assertSame('morning', $this->service->deriveTimeOfDay('2026-06-19 08:30:00'));
    }

    public function test_derive_time_of_day_afternoon(): void
    {
        $this->assertSame('afternoon', $this->service->deriveTimeOfDay('2026-06-19 14:00:00'));
    }

    public function test_derive_time_of_day_evening(): void
    {
        $this->assertSame('evening', $this->service->deriveTimeOfDay('2026-06-19 19:00:00'));
    }

    public function test_derive_time_of_day_late_night(): void
    {
        $this->assertSame('late_night', $this->service->deriveTimeOfDay('2026-06-19 02:00:00'));
    }

    public function test_derive_time_of_day_null_timestamp(): void
    {
        $this->assertNull($this->service->deriveTimeOfDay(null));
    }

    public function test_validate_gps_proximity_within_50m(): void
    {
        $photoGps = ['lat' => 3.1390, 'lng' => 101.6869];
        $venueGps = ['lat' => 3.1390, 'lng' => 101.6869];

        $this->assertTrue($this->service->validateGpsProximity($photoGps, $venueGps, 50));
    }

    public function test_validate_gps_proximity_beyond_50m(): void
    {
        $photoGps = ['lat' => 3.1390, 'lng' => 101.6869];
        $venueGps = ['lat' => 3.1500, 'lng' => 101.7000];

        $this->assertFalse($this->service->validateGpsProximity($photoGps, $venueGps, 50));
    }

    public function test_extract_gps_from_exif_data(): void
    {
        $exif = [
            'GPSLatitude' => ['3/1', '8/1', '20440/1000'],
            'GPSLatitudeRef' => 'N',
            'GPSLongitude' => ['101/1', '41/1', '12840/1000'],
            'GPSLongitudeRef' => 'E',
        ];

        $gps = $this->service->extractGps($exif);

        $this->assertNotNull($gps);
        $this->assertGreaterThan(3.0, $gps['lat']);
        $this->assertGreaterThan(101.0, $gps['lng']);
    }

    public function test_extract_gps_returns_null_without_data(): void
    {
        $this->assertNull($this->service->extractGps([]));
    }

    public function test_extract_timestamp_from_exif_data(): void
    {
        $exif = ['DateTimeOriginal' => '2026:06:19 12:30:00'];

        $timestamp = $this->service->extractTimestamp($exif);

        $this->assertSame('2026-06-19 12:30:00', $timestamp);
    }
}
