<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_challenges', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('date')->unique();
            $table->string('title')->nullable();
            $table->string('status')->default('draft');
            $table->foreignId('generated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });

        DB::statement("ALTER TABLE daily_challenges ADD CONSTRAINT daily_challenges_status_check CHECK (status IN ('draft', 'scheduled', 'published', 'archived'))");

        Schema::create('daily_challenge_photos', function (Blueprint $table) {
            $table->id();
            $table->uuid('daily_challenge_id');
            $table->foreignUuid('photo_id')->constrained('photos')->cascadeOnDelete();
            $table->integer('position');
            $table->timestamps();

            $table->foreign('daily_challenge_id', 'dcp_daily_challenge_fk')->references('id')->on('daily_challenges')->cascadeOnDelete();
            $table->unique(['daily_challenge_id', 'photo_id'], 'dcp_challenge_photo_unique');
            $table->unique(['daily_challenge_id', 'position'], 'dcp_challenge_position_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_challenge_photos');
        Schema::dropIfExists('daily_challenges');
    }
};
