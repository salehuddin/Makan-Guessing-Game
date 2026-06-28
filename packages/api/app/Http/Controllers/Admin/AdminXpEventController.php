<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\XpEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminXpEventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = XpEvent::query()
            ->with(['user', 'photo', 'guess'])
            ->latest('created_at');

        if ($type = $request->string('type')) {
            $query->where('type', $type);
        }

        if ($search = $request->string('search')) {
            $query->whereHas('user', fn ($q) => $q->where('username', 'ILIKE', "%{$search}%"));
        }

        if ($from = $request->string('from')) {
            $query->where('created_at', '>=', $from);
        }

        if ($to = $request->string('to')) {
            $query->where('created_at', '<=', $to);
        }

        $events = $query->paginate(25);

        return response()->json([
            'data' => $events->through(fn (XpEvent $event) => [
                'id' => $event->id,
                'user' => $event->user ? [
                    'id' => $event->user->id,
                    'username' => $event->user->username,
                ] : null,
                'photo_id' => $event->photo_id,
                'guess_id' => $event->guess_id,
                'type' => $event->type,
                'amount' => $event->amount,
                'breakdown' => $event->breakdown,
                'created_at' => $event->created_at,
            ]),
            'meta' => [
                'current_page' => $events->currentPage(),
                'last_page' => $events->lastPage(),
                'per_page' => $events->perPage(),
                'total' => $events->total(),
            ],
        ]);
    }

    public function show(XpEvent $xpEvent): JsonResponse
    {
        $xpEvent->load(['user', 'photo.venue', 'guess']);

        return response()->json([
            'data' => [
                'id' => $xpEvent->id,
                'user' => $xpEvent->user ? [
                    'id' => $xpEvent->user->id,
                    'username' => $xpEvent->user->username,
                ] : null,
                'photo' => $xpEvent->photo ? [
                    'id' => $xpEvent->photo->id,
                    'category' => $xpEvent->photo->category,
                    'venue' => $xpEvent->photo->venue ? [
                        'id' => $xpEvent->photo->venue->id,
                        'name' => $xpEvent->photo->venue->name,
                    ] : null,
                ] : null,
                'guess_id' => $xpEvent->guess_id,
                'type' => $xpEvent->type,
                'amount' => $xpEvent->amount,
                'breakdown' => $xpEvent->breakdown,
                'created_at' => $xpEvent->created_at,
            ],
        ]);
    }
}
