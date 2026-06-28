<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $values = [
            'value' => json_encode('en'),
            'type' => 'string',
            'group' => 'display',
            'label' => 'Default language',
            'description' => 'Default language for new players when no preference exists.',
            'is_public' => true,
            'updated_at' => now(),
        ];

        if (DB::table('settings')->where('key', 'default_language')->exists()) {
            DB::table('settings')->where('key', 'default_language')->update($values);

            return;
        }

        DB::table('settings')->insert([
            ...$values,
            'key' => 'default_language',
            'created_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('settings')->where('key', 'default_language')->delete();
    }
};
