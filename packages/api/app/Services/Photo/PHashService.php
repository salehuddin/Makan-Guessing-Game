<?php

namespace App\Services\Photo;

use GdImage;

class PHashService
{
    private const HASH_SIZE = 8;

    private const IMAGE_SIZE = 32;

    public function hash(string $path): ?string
    {
        if (! file_exists($path)) {
            return null;
        }

        $resized = $this->resizeToGrayscale($path);

        if ($resized === null) {
            return null;
        }

        $dct = $this->computeDct($resized);
        $hash = $this->dctToHash($dct);

        imagedestroy($resized);

        return $hash;
    }

    public function similarity(string $hash1, string $hash2): float
    {
        $bin1 = $this->hashToBinary($hash1);
        $bin2 = $this->hashToBinary($hash2);

        if ($bin1 === null || $bin2 === null) {
            return 0.0;
        }

        $hammingDistance = count(array_diff_assoc(str_split($bin1), str_split($bin2)));

        return 1.0 - ($hammingDistance / 64.0);
    }

    public function isDuplicate(string $hash1, string $hash2, float $threshold = 0.85): bool
    {
        return $this->similarity($hash1, $hash2) >= $threshold;
    }

    private function resizeToGrayscale(string $path): ?GdImage
    {
        $imageInfo = @getimagesize($path);

        if ($imageInfo === false) {
            return null;
        }

        $source = match ($imageInfo[2]) {
            IMAGETYPE_JPEG => @imagecreatefromjpeg($path),
            IMAGETYPE_PNG => @imagecreatefrompng($path),
            IMAGETYPE_WEBP => @imagecreatefromwebp($path),
            default => null,
        };

        if ($source === false || $source === null) {
            return null;
        }

        $resized = imagecreatetruecolor(self::IMAGE_SIZE, self::IMAGE_SIZE);

        imagecopyresampled($resized, $source, 0, 0, 0, 0, self::IMAGE_SIZE, self::IMAGE_SIZE, imagesx($source), imagesy($source));

        imagefilter($resized, IMG_FILTER_GRAYSCALE);

        imagedestroy($source);

        return $resized;
    }

    private function computeDct(GdImage $image): array
    {
        $pixels = [];
        for ($y = 0; $y < self::IMAGE_SIZE; $y++) {
            for ($x = 0; $x < self::IMAGE_SIZE; $x++) {
                $color = imagecolorat($image, $x, $y);
                $pixels[$y][$x] = (float) ($color & 0xFF);
            }
        }

        $dct = [];
        for ($u = 0; $u < self::HASH_SIZE; $u++) {
            for ($v = 0; $v < self::HASH_SIZE; $v++) {
                $sum = 0.0;
                for ($x = 0; $x < self::IMAGE_SIZE; $x++) {
                    for ($y = 0; $y < self::IMAGE_SIZE; $y++) {
                        $sum += $pixels[$y][$x] *
                            cos((2 * $x + 1) * $u * M_PI / (2 * self::IMAGE_SIZE)) *
                            cos((2 * $y + 1) * $v * M_PI / (2 * self::IMAGE_SIZE));
                    }
                }
                $dct[$u][$v] = $sum;
            }
        }

        return $dct;
    }

    private function dctToHash(array $dct): string
    {
        $values = [];
        for ($u = 0; $u < self::HASH_SIZE; $u++) {
            for ($v = 0; $v < self::HASH_SIZE; $v++) {
                if ($u === 0 && $v === 0) {
                    continue;
                }
                $values[] = $dct[$u][$v];
            }
        }

        $median = $this->median($values);

        $bits = '';
        for ($u = 0; $u < self::HASH_SIZE; $u++) {
            for ($v = 0; $v < self::HASH_SIZE; $v++) {
                if ($u === 0 && $v === 0) {
                    $bits .= '0';

                    continue;
                }
                $bits .= $dct[$u][$v] > $median ? '1' : '0';
            }
        }

        return $this->binaryToHex($bits);
    }

    private function median(array $values): float
    {
        sort($values);
        $count = count($values);
        $middle = (int) floor($count / 2);

        if ($count % 2) {
            return $values[$middle];
        }

        return ($values[$middle - 1] + $values[$middle]) / 2;
    }

    private function binaryToHex(string $bits): string
    {
        $hex = '';
        $len = strlen($bits);

        for ($i = 0; $i < $len; $i += 4) {
            $chunk = substr($bits, $i, 4);
            $hex .= base_convert($chunk, 2, 16);
        }

        return $hex;
    }

    private function hashToBinary(string $hash): ?string
    {
        if (strlen($hash) !== 16) {
            return null;
        }

        $binary = '';
        for ($i = 0; $i < strlen($hash); $i++) {
            $bits = base_convert($hash[$i], 16, 2);
            $binary .= str_pad($bits, 4, '0', STR_PAD_LEFT);
        }

        return $binary;
    }
}
