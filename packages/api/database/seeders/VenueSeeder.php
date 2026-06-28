<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Venue;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class VenueSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::factory()->create([
            'username' => 'guesseat_admin',
            'phone' => '+60123456000',
            'email' => 'admin@guesseat.my',
            'password' => Hash::make('password'),
            'is_admin' => true,
            'trust_tier' => 'curator',
        ]);

        $curator = User::factory()->create([
            'username' => 'makan_curator',
            'phone' => '+60123456001',
            'trust_tier' => 'curator',
            'approved_count' => 200,
        ]);

        $venues = $this->klangValleyVenues();

        foreach ($venues as $venueData) {
            $lat = $venueData['lat'];
            $lng = $venueData['lng'];
            unset($venueData['lat'], $venueData['lng']);

            Venue::create(array_merge($venueData, [
                'location' => DB::raw("ST_SetSRID(ST_MakePoint({$lng}, {$lat}), 4326)::geography"),
                'first_submitted_by' => $curator->id,
            ]));
        }

        $this->command->info('Seeded '.count($venues).' Klang Valley venues.');
    }

    private function klangValleyVenues(): array
    {
        return [
            ['name' => 'Restoran Champor Champor', 'district' => 'KLCC', 'venue_type' => 'restaurant', 'cuisine_tags' => ['malay', 'asian'], 'price_range' => 2, 'halal_status' => 'halal', 'address' => 'Jalan Ampang, KL', 'lat' => 3.1583, 'lng' => 101.7142],
            ['name' => 'Bijan', 'district' => 'Bukit Bintang', 'venue_type' => 'restaurant', 'cuisine_tags' => ['malay'], 'price_range' => 3, 'halal_status' => 'halal', 'address' => 'Jalan Ceylon, KL', 'lat' => 3.1453, 'lng' => 101.7023],
            ['name' => 'Restoran Sri Nirwana Maju', 'district' => 'Bangsar', 'venue_type' => 'mamak', 'cuisine_tags' => ['indian', 'mamak'], 'price_range' => 1, 'halal_status' => 'halal', 'address' => 'Jalan Telawi 3, Bangsar', 'lat' => 3.1298, 'lng' => 101.6737],
            ['name' => 'Antipodean Cafe', 'district' => 'Bangsar', 'venue_type' => 'cafe', 'cuisine_tags' => ['western', 'cafe'], 'price_range' => 2, 'halal_status' => 'non_halal', 'address' => 'Jalan Telawi 2, Bangsar', 'lat' => 3.1295, 'lng' => 101.6725],
            ['name' => 'Restoran Kin Kin', 'district' => 'Petaling Jaya', 'venue_type' => 'hawker_stall', 'cuisine_tags' => ['chinese'], 'price_range' => 1, 'halal_status' => 'non_halal', 'address' => 'Jalan Sultan, PJ', 'lat' => 3.1065, 'lng' => 101.6391],
            ['name' => 'SS2 Murni', 'district' => 'Petaling Jaya', 'venue_type' => 'mamak', 'cuisine_tags' => ['mamak', 'fusion'], 'price_range' => 1, 'halal_status' => 'halal', 'address' => 'Jalan SS 2/75, PJ', 'lat' => 3.1126, 'lng' => 101.6200],
            ['name' => 'Jalan Alor Hawker Stalls', 'district' => 'Bukit Bintang', 'venue_type' => 'food_court', 'cuisine_tags' => ['chinese', 'malay', 'seafood'], 'price_range' => 1, 'halal_status' => 'muslim_friendly', 'address' => 'Jalan Alor, KL', 'lat' => 3.1468, 'lng' => 101.7068],
            ['name' => 'Nasi Lemak Antarabangsa', 'district' => 'Kampung Baru', 'venue_type' => 'hawker_stall', 'cuisine_tags' => ['malay'], 'price_range' => 1, 'halal_status' => 'halal', 'address' => 'Jalan Raja Muda Musa, KL', 'lat' => 3.1670, 'lng' => 101.7029],
            ['name' => 'Yut Kee', 'district' => 'KLCC', 'venue_type' => 'kopitiam', 'cuisine_tags' => ['chinese', 'hainanese'], 'price_range' => 1, 'halal_status' => 'non_halal', 'address' => 'Jalan Dang Wangi, KL', 'lat' => 3.1540, 'lng' => 101.6970],
            ['name' => 'Hakka Restaurant', 'district' => 'KLCC', 'venue_type' => 'restaurant', 'cuisine_tags' => ['chinese', 'hakka'], 'price_range' => 2, 'halal_status' => 'non_halal', 'address' => 'Jalan Kia Peng, KL', 'lat' => 3.1565, 'lng' => 101.7130],
            ['name' => 'Madam Kwan\'s', 'district' => 'KLCC', 'venue_type' => 'restaurant', 'cuisine_tags' => ['malay', 'nyonya'], 'price_range' => 2, 'halal_status' => 'halal', 'address' => 'Suria KLCC, KL', 'lat' => 3.1578, 'lng' => 101.7118],
            ['name' => 'Restoran Gulam Hyder', 'district' => 'Kampung Baru', 'venue_type' => 'mamak', 'cuisine_tags' => ['indian', 'mamak'], 'price_range' => 1, 'halal_status' => 'halal', 'address' => 'Jalan Raja Alang, KL', 'lat' => 3.1663, 'lng' => 101.7012],
            ['name' => 'Concubine KL', 'district' => 'Changkat', 'venue_type' => 'restaurant', 'cuisine_tags' => ['chinese', 'fusion'], 'price_range' => 3, 'halal_status' => 'non_halal', 'address' => 'Jalan Bukit Bintang, KL', 'lat' => 3.1470, 'lng' => 101.7050],
            ['name' => 'Pak Li Kopitiam', 'district' => 'Petaling Jaya', 'venue_type' => 'kopitiam', 'cuisine_tags' => ['chinese', 'local'], 'price_range' => 1, 'halal_status' => 'non_halal', 'address' => 'Centrepoint Bandar Utama, PJ', 'lat' => 3.1472, 'lng' => 101.6165],
            ['name' => 'Kdu Kopitiam', 'district' => 'Subang', 'venue_type' => 'kopitiam', 'cuisine_tags' => ['chinese'], 'price_range' => 1, 'halal_status' => 'non_halal', 'address' => 'SS15, Subang Jaya', 'lat' => 3.0783, 'lng' => 101.5867],
            ['name' => 'Restoran Kanna', 'district' => 'Subang', 'venue_type' => 'hawker_stall', 'cuisine_tags' => ['indian'], 'price_range' => 1, 'halal_status' => 'halal', 'address' => 'SS15, Subang Jaya', 'lat' => 3.0775, 'lng' => 101.5875],
            ['name' => 'Chatterbox KL', 'district' => 'KLCC', 'venue_type' => 'cafe', 'cuisine_tags' => ['western', 'cafe'], 'price_range' => 2, 'halal_status' => 'non_halal', 'address' => 'Jalan Nagasari, KL', 'lat' => 3.1560, 'lng' => 101.7030],
            ['name' => 'Ho Kow Hainan Kopitiam', 'district' => 'KLCC', 'venue_type' => 'kopitiam', 'cuisine_tags' => ['chinese', 'hainanese'], 'price_range' => 1, 'halal_status' => 'non_halal', 'address' => 'Jalan Balai Polis, KL', 'lat' => 3.1438, 'lng' => 101.6955],
            ['name' => 'Restoran Okay', 'district' => 'Cheras', 'venue_type' => 'mamak', 'cuisine_tags' => ['mamak', 'indian'], 'price_range' => 1, 'halal_status' => 'halal', 'address' => 'Jalan 34/154, Cheras', 'lat' => 3.0750, 'lng' => 101.7350],
            ['name' => 'Central Market Food Court', 'district' => 'KLCC', 'venue_type' => 'food_court', 'cuisine_tags' => ['malay', 'chinese', 'indian'], 'price_range' => 1, 'halal_status' => 'halal', 'address' => 'Jalan Hang Kasturi, KL', 'lat' => 3.1437, 'lng' => 101.6957],
        ];
    }
}
