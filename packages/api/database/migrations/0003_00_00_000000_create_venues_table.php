<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('venues', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('address')->nullable();
            $table->geography('location', subtype: 'point', srid: 4326);
            $table->string('district')->index();
            $table->string('venue_type')->default('restaurant');
            $table->string('halal_status')->default('unknown');
            $table->unsignedTinyInteger('price_range')->default(1);
            $table->foreignId('claimed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('first_submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        DB::statement("ALTER TABLE venues ADD CONSTRAINT venues_venue_type_check CHECK (venue_type IN ('restaurant', 'mamak', 'kopitiam', 'hawker_stall', 'warung', 'cafe', 'food_court', 'chain'))");
        DB::statement("ALTER TABLE venues ADD CONSTRAINT venues_halal_status_check CHECK (halal_status IN ('halal', 'non_halal', 'muslim_friendly', 'unknown'))");
        DB::statement('ALTER TABLE venues ADD CONSTRAINT venues_price_range_check CHECK (price_range BETWEEN 1 AND 3)');

        DB::statement('ALTER TABLE venues ADD COLUMN IF NOT EXISTS cuisine_tags text[]');

        DB::statement('CREATE INDEX venues_name_trgm_idx ON venues USING GIN (name gin_trgm_ops)');
        DB::statement('CREATE INDEX venues_location_idx ON venues USING GIST (location)');
    }

    public function down(): void
    {
        Schema::dropIfExists('venues');
    }
};
