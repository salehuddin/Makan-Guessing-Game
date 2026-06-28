<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('guesses', function (Blueprint $table) {
            $table->string('game_mode_slug')->nullable()->after('score');
            $table->uuid('daily_challenge_id')->nullable()->after('game_mode_slug');
            $table->jsonb('shown_option_ids')->nullable()->after('daily_challenge_id');
            $table->timestamp('answered_at')->nullable()->after('shown_option_ids');
        });

        Schema::table('guesses', function (Blueprint $table) {
            $table->index('game_mode_slug');
            $table->foreign('daily_challenge_id', 'guesses_daily_challenge_fk')->references('id')->on('daily_challenges')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('guesses', function (Blueprint $table) {
            $table->dropForeign('guesses_daily_challenge_fk');
            $table->dropIndex(['game_mode_slug']);
            $table->dropColumn(['game_mode_slug', 'daily_challenge_id', 'shown_option_ids', 'answered_at']);
        });
    }
};
