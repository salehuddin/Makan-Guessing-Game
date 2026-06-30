<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('language', 5)->default('en')->after('cover_url');
            $table->boolean('notifications_enabled')->default(true)->after('language');
            $table->string('profile_visibility', 10)->default('public')->after('notifications_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['language', 'notifications_enabled', 'profile_visibility']);
        });
    }
};
