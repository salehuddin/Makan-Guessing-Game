<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\File;

class TranslationController extends Controller
{
    private const LANGUAGES = ['en', 'ms'];

    public function index(): JsonResponse
    {
        $this->ensureFilesExist();

        return response()->json([
            'translations' => $this->readTranslations(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'translations' => ['required', 'array'],
            'translations.en' => ['required', 'array'],
            'translations.ms' => ['required', 'array'],
        ]);

        $this->ensureDirectoryExists();

        foreach (self::LANGUAGES as $language) {
            $translations = Arr::map(
                $validated['translations'][$language],
                fn (mixed $value): string => is_scalar($value) ? (string) $value : '',
            );

            File::put(
                $this->path($language),
                json_encode($translations, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            );
        }

        return response()->json([
            'translations' => $this->readTranslations(),
        ]);
    }

    private function readTranslations(): array
    {
        $translations = [];

        foreach (self::LANGUAGES as $language) {
            $contents = File::get($this->path($language));
            $translations[$language] = json_decode($contents, true) ?: [];
        }

        return $translations;
    }

    private function ensureFilesExist(): void
    {
        $this->ensureDirectoryExists();

        foreach (self::LANGUAGES as $language) {
            if (! File::exists($this->path($language))) {
                File::put($this->path($language), '{}');
            }
        }
    }

    private function ensureDirectoryExists(): void
    {
        if (! File::isDirectory($this->directory())) {
            File::makeDirectory($this->directory(), 0755, true);
        }
    }

    private function path(string $language): string
    {
        return $this->directory().DIRECTORY_SEPARATOR.$language.'.json';
    }

    private function directory(): string
    {
        return storage_path('translations');
    }
}
