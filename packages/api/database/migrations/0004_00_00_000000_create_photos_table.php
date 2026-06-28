<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('photos', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('venue_id')->constrained('venues')->cascadeOnDelete();
            $table->foreignId('submitter_id')->constrained('users')->cascadeOnDelete();
            $table->string('category');
            $table->string('auto_category')->nullable();
            $table->float('auto_category_confidence')->nullable();
            $table->integer('category_flags')->default(0);
            $table->string('censored_url')->nullable();
            $table->string('original_url')->nullable();
            $table->string('thumbnail_url')->nullable();
            $table->geography('exif_gps', subtype: 'point', srid: 4326)->nullable();
            $table->string('phash')->nullable()->index();
            $table->float('quality_score')->default(0);
            $table->string('status')->default('pending');
            $table->boolean('client_censored')->default(false);
            $table->jsonb('server_flags')->nullable();
            $table->boolean('needs_human_review')->default(false);
            $table->integer('total_guesses')->default(0);
            $table->float('avg_rating')->default(0);
            $table->integer('correct_guesses')->default(0);
            $table->timestamps();
        });

        DB::statement("ALTER TABLE photos ADD CONSTRAINT photos_category_check CHECK (category IN ('signature_dish', 'ambience', 'exterior', 'table_setting', 'staff_uniforms', 'menu_signage', 'general'))");
        DB::statement("ALTER TABLE photos ADD CONSTRAINT photos_status_check CHECK (status IN ('pending', 'approved', 'quarantined', 'rejected'))");

        DB::statement('ALTER TABLE photos ADD COLUMN IF NOT EXISTS secondary_tags text[]');

        DB::statement("CREATE INDEX idx_photos_status_approved ON photos(status) WHERE status = 'approved'");
        DB::statement("CREATE INDEX idx_photos_category_approved ON photos(category) WHERE status = 'approved'");
        DB::statement('CREATE INDEX idx_photos_venue_category ON photos(venue_id, category)');
        DB::statement('CREATE INDEX photos_exif_gps_idx ON photos USING GIST (exif_gps)');
    }

    public function down(): void
    {
        Schema::dropIfExists('photos');
    }
};
