<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_modes', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('enabled')->default(true);
            $table->boolean('is_builtin')->default(false);
            $table->integer('round_count')->nullable();
            $table->integer('option_count')->default(4);
            $table->string('category_filter')->nullable();
            $table->string('district_filter')->nullable();
            $table->string('selection_strategy')->default('weighted_random');
            $table->jsonb('settings')->nullable();
            $table->timestamps();
        });

        DB::statement("ALTER TABLE game_modes ADD CONSTRAINT game_modes_selection_strategy_check CHECK (selection_strategy IN ('weighted_random', 'curated_daily', 'fixed_sequence'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('game_modes');
    }
};
