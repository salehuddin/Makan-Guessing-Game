<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guesses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('photo_id')->constrained('photos')->cascadeOnDelete();
            $table->foreignId('guesser_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('guessed_venue_id')->nullable()->constrained('venues')->nullOnDelete();
            $table->geography('guessed_pin', subtype: 'point', srid: 4326)->nullable();
            $table->geography('actual_pin', subtype: 'point', srid: 4326);
            $table->float('distance_meters')->nullable();
            $table->integer('time_ms');
            $table->boolean('is_correct_name')->default(false);
            $table->integer('score')->default(0);
            $table->timestamp('created_at')->useCurrent();
        });

        DB::statement('CREATE INDEX guesses_guesser_id_idx ON guesses(guesser_id)');
        DB::statement('CREATE INDEX guesses_photo_id_idx ON guesses(photo_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('guesses');
    }
};
