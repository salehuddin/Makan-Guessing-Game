<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ad_views', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('platform');
            $table->string('ad_type');
            $table->string('placement');
            $table->string('reward_type')->nullable();
            $table->foreignUuid('guess_id')->nullable()->constrained('guesses')->nullOnDelete();
            $table->integer('reward_amount')->default(0);
            $table->string('ad_unit_id')->nullable();
            $table->string('network')->nullable();
            $table->timestamp('viewed_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ad_views');
    }
};
