<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('profile_bio', 160)->nullable()->after('district');
            $table->string('avatar_url')->nullable()->after('profile_bio');
            $table->string('cover_url')->nullable()->after('avatar_url');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['profile_bio', 'avatar_url', 'cover_url']);
        });
    }
};
