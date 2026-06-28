<?php

namespace Tests\Unit\Services\Photo;

use App\Services\Photo\PHashService;
use Tests\TestCase;

class PHashServiceTest extends TestCase
{
    private PHashService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new PHashService;
    }

    public function test_hash_returns_null_for_nonexistent_file(): void
    {
        $this->assertNull($this->service->hash('/nonexistent/path.jpg'));
    }

    public function test_similarity_of_identical_hashes(): void
    {
        $hash = 'abcdef0123456789';

        $this->assertSame(1.0, $this->service->similarity($hash, $hash));
    }

    public function test_similarity_of_completely_different_hashes(): void
    {
        $hash1 = '0000000000000000';
        $hash2 = 'ffffffffffffffff';

        $this->assertSame(0.0, $this->service->similarity($hash1, $hash2));
    }

    public function test_is_duplicate_above_threshold(): void
    {
        $hash = 'abcdef0123456789';

        $this->assertTrue($this->service->isDuplicate($hash, $hash, 0.85));
    }

    public function test_is_duplicate_below_threshold(): void
    {
        $hash1 = '0000000000000000';
        $hash2 = 'ffffffffffffffff';

        $this->assertFalse($this->service->isDuplicate($hash1, $hash2, 0.85));
    }

    public function test_hash_produces_16_char_hex_string(): void
    {
        $path = $this->createTestImage();

        $hash = $this->service->hash($path);

        $this->assertNotNull($hash);
        $this->assertSame(16, strlen($hash));

        unlink($path);
    }

    public function test_identical_images_produce_identical_hashes(): void
    {
        $path1 = $this->createTestImage();
        $path2 = $this->createTestImage();

        $hash1 = $this->service->hash($path1);
        $hash2 = $this->service->hash($path2);

        $this->assertSame($hash1, $hash2);
        $this->assertTrue($this->service->isDuplicate($hash1, $hash2));

        unlink($path1);
        unlink($path2);
    }

    private function createTestImage(): string
    {
        $path = tempnam(sys_get_temp_dir(), 'phash_test').'.jpg';

        $image = imagecreatetruecolor(100, 100);
        $color = imagecolorallocate($image, 200, 100, 50);
        imagefilledrectangle($image, 10, 10, 90, 90, $color);
        imagejpeg($image, $path, 90);
        imagedestroy($image);

        return $path;
    }
}
