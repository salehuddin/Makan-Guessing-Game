<?php

namespace App\Http\Requests\Venue;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VenueSuggestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:200'],
            'address' => ['nullable', 'string', 'max:500'],
            'district' => ['required', 'string', 'max:100'],
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
            'venue_type' => ['nullable', Rule::in([
                'restaurant', 'mamak', 'kopitiam', 'hawker_stall',
                'warung', 'cafe', 'food_court', 'chain',
            ])],
            'cuisine_tags' => ['nullable', 'array'],
            'cuisine_tags.*' => ['string', 'max:50'],
            'price_range' => ['nullable', 'integer', 'between:1,3'],
            'halal_status' => ['nullable', Rule::in(['halal', 'non_halal', 'muslim_friendly', 'unknown'])],
            'google_place_id' => ['nullable', 'string', 'max:255'],
        ];
    }
}
