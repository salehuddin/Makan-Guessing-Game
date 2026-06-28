<?php

namespace App\Http\Requests\Photo;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PhotoUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'photo' => ['required', 'file', 'image', 'mimes:jpeg,png,webp', 'max:10240'],
            'category' => ['required', Rule::in([
                'signature_dish', 'ambience', 'exterior', 'table_setting',
                'staff_uniforms', 'menu_signage', 'general',
            ])],
            'venue_id' => ['nullable', 'uuid', 'exists:venues,id'],
            'venue' => ['nullable', 'array'],
            'venue.name' => ['required_with:venue', 'string', 'max:200'],
            'venue.district' => ['required_with:venue', 'string', 'max:100'],
            'venue.lat' => ['required_with:venue', 'numeric', 'between:-90,90'],
            'venue.lng' => ['required_with:venue', 'numeric', 'between:-180,180'],
            'venue.address' => ['nullable', 'string', 'max:500'],
            'venue.venue_type' => ['nullable', 'string'],
            'venue.cuisine_tags' => ['nullable', 'array'],
            'venue.price_range' => ['nullable', 'integer', 'between:1,3'],
            'venue.halal_status' => ['nullable', 'string'],
            'secondary_tags' => ['nullable', 'array'],
            'secondary_tags.crowded' => ['nullable', Rule::in(['busy', 'moderate', 'quiet', 'empty'])],
            'secondary_tags.outdoor_seating' => ['nullable', 'boolean'],
            'secondary_tags.self_service' => ['nullable', 'boolean'],
            'secondary_tags.tv_visible' => ['nullable', 'boolean'],
            'client_censored' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'photo.max' => 'The photo must not exceed 10MB.',
            'venue_id.required_without' => 'Either an existing venue or a new venue suggestion is required.',
        ];
    }
}
