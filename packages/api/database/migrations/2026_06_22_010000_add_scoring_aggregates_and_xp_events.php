<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->integer('guesser_score_total')->default(0)->after('xp_total');
            $table->integer('guesses_played_count')->default(0)->after('guesser_score_total');
            $table->integer('correct_guesses_count')->default(0)->after('guesses_played_count');
            $table->integer('best_guess_streak')->default(0)->after('guesser_streak');
        });

        Schema::table('photos', function (Blueprint $table) {
            $table->bigInteger('total_guess_time_ms')->default(0)->after('total_guesses');
            $table->integer('avg_guess_time_ms')->nullable()->after('total_guess_time_ms');
            $table->integer('engagement_xp_awarded')->default(0)->after('correct_guesses');
        });

        Schema::create('xp_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('photo_id')->nullable()->constrained('photos')->nullOnDelete();
            $table->foreignUuid('guess_id')->nullable()->constrained('guesses')->nullOnDelete();
            $table->string('type');
            $table->integer('amount');
            $table->jsonb('breakdown')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['type', 'created_at']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('xp_events');

        Schema::table('photos', function (Blueprint $table) {
            $table->dropColumn(['total_guess_time_ms', 'avg_guess_time_ms', 'engagement_xp_awarded']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['guesser_score_total', 'guesses_played_count', 'correct_guesses_count', 'best_guess_streak']);
        });
    }
};
