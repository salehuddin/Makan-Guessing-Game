<?php

namespace App\Jobs;

use App\Models\Photo;
use App\Services\Photo\ExifService;
use App\Services\Photo\PHashService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Http\File;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessPhotoJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 120;

    public function __construct(
        public string $photoId
    ) {}

    public function handle(
        ExifService $exifService,
        PHashService $pHashService,
    ): void {
        $photo = Photo::with(['venue', 'submitter'])->find($this->photoId);

        if ($photo === null) {
            Log::warning("ProcessPhotoJob: photo {$this->photoId} not found");

            return;
        }

        if ($photo->status !== 'pending') {
            Log::info("ProcessPhotoJob: photo {$this->photoId} already processed (status: {$photo->status})");

            return;
        }

        $disk = Storage::disk($this->storageDisk());
        $rawPath = "raw/{$photo->id}.jpg";

        if (! $disk->exists($rawPath)) {
            $photo->update(['status' => 'rejected', 'needs_human_review' => true]);
            Log::error("ProcessPhotoJob: raw file missing for photo {$photo->id}");

            return;
        }

        $localPath = $this->downloadToLocal($disk, $rawPath, $photo->id);

        try {
            $exifData = $exifService->extract($localPath);
            $this->validateGps($photo, $exifService, $exifData);

            $phash = $pHashService->hash($localPath);
            $this->checkDuplicates($photo, $pHashService, $phash);

            $qualityScore = $this->assessQuality($localPath);
            $photo->update(['quality_score' => $qualityScore]);

            if ($phash !== null) {
                $photo->update(['phash' => $phash]);
            }

            if ($exifData !== null && $exifData['gps'] !== null) {
                $photo->update([
                    'exif_gps' => DB::raw("ST_SetSRID(ST_MakePoint({$exifData['gps']['lng']}, {$exifData['gps']['lat']}), 4326)::geography"),
                ]);
            }

            $this->generateThumbnail($localPath, $photo);
            $this->generateGameplayImage($localPath, $photo);

            $this->determineStatus($photo);

            $disk->delete("local/{$photo->id}.jpg");

            Log::info("ProcessPhotoJob: photo {$photo->id} processed -> {$photo->fresh()->status}");
        } catch (\Exception $e) {
            Log::error("ProcessPhotoJob error for photo {$photo->id}: {$e->getMessage()}");

            $photo->update([
                'status' => 'quarantined',
                'needs_human_review' => true,
            ]);

            throw $e;
        } finally {
            if (file_exists($localPath)) {
                @unlink($localPath);
            }
        }
    }

    private function validateGps(Photo $photo, ExifService $exifService, ?array $exifData): void
    {
        if ($exifData === null || $exifData['gps'] === null) {
            throw new \RuntimeException('Photo has no EXIF GPS data');
        }

        $venueLocation = $photo->venue->location;
        $venueGeojson = json_decode($venueLocation);
        $venueGps = [
            'lat' => $venueGeojson->coordinates[1],
            'lng' => $venueGeojson->coordinates[0],
        ];

        if (! $exifService->validateGpsProximity($exifData['gps'], $venueGps, 50)) {
            throw new \RuntimeException('Photo GPS is more than 50m from the venue location');
        }
    }

    private function checkDuplicates(Photo $photo, PHashService $pHashService, ?string $phash): void
    {
        if ($phash === null) {
            return;
        }

        $existingPhotos = Photo::where('venue_id', $photo->venue_id)
            ->where('id', '!=', $photo->id)
            ->whereNotNull('phash')
            ->get(['phash']);

        foreach ($existingPhotos as $existing) {
            if ($pHashService->isDuplicate($phash, $existing->phash, 0.85)) {
                throw new \RuntimeException('Photo is a duplicate of an existing photo for this venue');
            }
        }
    }

    private function assessQuality(string $path): float
    {
        $imageInfo = @getimagesize($path);

        if ($imageInfo === false) {
            return 0.0;
        }

        $width = $imageInfo[0];
        $height = $imageInfo[1];

        if ($width < 720 || $height < 720) {
            throw new \RuntimeException('Photo resolution is below 720p');
        }

        $image = $this->loadImage($path);

        if ($image === null) {
            return 0.5;
        }

        $variance = $this->laplacianVariance($image);
        imagedestroy($image);

        $quality = min(1.0, $variance / 500.0);

        if ($variance < 50) {
            throw new \RuntimeException('Photo is too blurry (Laplacian variance below threshold)');
        }

        return round($quality, 2);
    }

    private function laplacianVariance(\GdImage $image): float
    {
        $width = imagesx($image);
        $height = imagesy($image);

        $sampleW = min(256, $width);
        $sampleH = min(256, $height);

        $laplacian = [
            [0, 1, 0],
            [1, -4, 1],
            [0, 1, 0],
        ];

        $values = [];

        for ($y = 1; $y < $sampleH - 1; $y++) {
            for ($x = 1; $x < $sampleW - 1; $x++) {
                $sum = 0;
                for ($ky = -1; $ky <= 1; $ky++) {
                    for ($kx = -1; $kx <= 1; $kx++) {
                        $color = imagecolorat($image, $x + $kx, $y + $ky);
                        $gray = ($color >> 16) & 0xFF;
                        $sum += $gray * $laplacian[$ky + 1][$kx + 1];
                    }
                }
                $values[] = $sum;
            }
        }

        $count = count($values);
        if ($count === 0) {
            return 0.0;
        }

        $mean = array_sum($values) / $count;
        $variance = 0.0;

        foreach ($values as $v) {
            $variance += ($v - $mean) ** 2;
        }

        return $variance / $count;
    }

    private function generateThumbnail(string $localPath, Photo $photo): void
    {
        $image = $this->loadImage($localPath);

        if ($image === null) {
            return;
        }

        $width = imagesx($image);
        $height = imagesy($image);

        $thumbWidth = 400;
        $thumbHeight = (int) ($height * $thumbWidth / $width);

        $thumb = imagecreatetruecolor($thumbWidth, $thumbHeight);
        imagecopyresampled($thumb, $image, 0, 0, 0, 0, $thumbWidth, $thumbHeight, $width, $height);

        $tempThumb = sys_get_temp_dir()."/thumb_{$photo->id}.webp";
        imagewebp($thumb, $tempThumb, 80);

        imagedestroy($image);
        imagedestroy($thumb);

        $disk = Storage::disk($this->storageDisk());
        $disk->putFileAs('thumb', new File($tempThumb), "{$photo->id}.webp");

        $photo->update([
            'thumbnail_url' => "thumb/{$photo->id}.webp",
        ]);

        @unlink($tempThumb);
    }

    private function generateGameplayImage(string $localPath, Photo $photo): void
    {
        $image = $this->loadImage($localPath);

        if ($image === null) {
            return;
        }

        $width = imagesx($image);
        $height = imagesy($image);

        $maxDimension = 1920;

        if ($width > $maxDimension || $height > $maxDimension) {
            if ($width >= $height) {
                $newWidth = $maxDimension;
                $newHeight = (int) ($height * $maxDimension / $width);
            } else {
                $newHeight = $maxDimension;
                $newWidth = (int) ($width * $maxDimension / $height);
            }
        } else {
            $newWidth = $width;
            $newHeight = $height;
        }

        $gameplayImage = imagecreatetruecolor($newWidth, $newHeight);
        imagecopyresampled($gameplayImage, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

        $tempCensored = sys_get_temp_dir()."/censored_{$photo->id}.webp";

        imagewebp($gameplayImage, $tempCensored, 80);

        imagedestroy($image);
        imagedestroy($gameplayImage);

        $disk = Storage::disk($this->storageDisk());
        $disk->putFileAs('censored', new File($tempCensored), "{$photo->id}.webp");

        $photo->update([
            'censored_url' => "censored/{$photo->id}.webp",
        ]);

        @unlink($tempCensored);
    }

    private function loadImage(string $path): ?\GdImage
    {
        $imageInfo = @getimagesize($path);

        if ($imageInfo === false) {
            return null;
        }

        $mime = $imageInfo[2];

        return match ($mime) {
            IMAGETYPE_JPEG => @imagecreatefromjpeg($path) ?: null,
            IMAGETYPE_PNG => @imagecreatefrompng($path) ?: null,
            IMAGETYPE_WEBP => @imagecreatefromwebp($path) ?: null,
            default => null,
        };
    }

    private function determineStatus(Photo $photo): void
    {
        $submitter = $photo->submitter;

        if ($submitter->trust_tier === 'new') {
            $photo->update(['status' => 'quarantined', 'needs_human_review' => true]);
        } else {
            $photo->update(['status' => 'approved']);
        }
    }

    private function downloadToLocal($disk, string $path, string $photoId): string
    {
        $localPath = sys_get_temp_dir()."/guesseat_raw_{$photoId}.jpg";

        $stream = $disk->readStream($path);
        $local = fopen($localPath, 'w');

        stream_copy_to_stream($stream, $local);

        fclose($stream);
        fclose($local);

        return $localPath;
    }

    private function storageDisk(): string
    {
        return config('filesystems.default', 'local');
    }
}
