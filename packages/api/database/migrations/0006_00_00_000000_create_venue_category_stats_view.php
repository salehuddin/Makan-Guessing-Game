<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement(<<<'SQL'
            CREATE VIEW venue_category_stats AS
            SELECT
                venue_id,
                category,
                COUNT(*) AS photo_count,
                AVG(avg_rating) AS avg_category_rating,
                AVG(CAST(correct_guesses AS FLOAT) / NULLIF(total_guesses, 0)) AS category_accuracy
            FROM photos
            WHERE status = 'approved'
            GROUP BY venue_id, category
        SQL);
    }

    public function down(): void
    {
        DB::statement('DROP VIEW IF EXISTS venue_category_stats');
    }
};
