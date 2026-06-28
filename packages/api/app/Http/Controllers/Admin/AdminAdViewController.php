<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdView;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAdViewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AdView::query()
            ->with(['user'])
            ->latest('viewed_at');

        if ($platform = $request->string('platform')) {
            $query->where('platform', $platform);
        }

        if ($placement = $request->string('placement')) {
            $query->where('placement', $placement);
        }

        if ($rewardType = $request->string('reward_type')) {
            $query->where('reward_type', $rewardType);
        }

        if ($search = $request->string('search')) {
            $query->whereHas('user', fn ($q) => $q->where('username', 'ILIKE', "%{$search}%"));
        }

        if ($from = $request->string('from')) {
            $query->where('viewed_at', '>=', $from);
        }

        if ($to = $request->string('to')) {
            $query->where('viewed_at', '<=', $to);
        }

        $ads = $query->paginate(25);

        return response()->json([
            'data' => $ads->through(fn (AdView $view) => [
                'id' => $view->id,
                'user' => $view->user ? [
                    'id' => $view->user->id,
                    'username' => $view->user->username,
                ] : null,
                'platform' => $view->platform,
                'ad_type' => $view->ad_type,
                'placement' => $view->placement,
                'reward_type' => $view->reward_type,
                'reward_amount' => $view->reward_amount,
                'ad_unit_id' => $view->ad_unit_id,
                'network' => $view->network,
                'viewed_at' => $view->viewed_at,
            ]),
            'meta' => [
                'current_page' => $ads->currentPage(),
                'last_page' => $ads->lastPage(),
                'per_page' => $ads->perPage(),
                'total' => $ads->total(),
            ],
        ]);
    }

    public function stats(Request $request): JsonResponse
    {
        $query = AdView::query();

        if ($from = $request->string('from')) {
            $query->where('viewed_at', '>=', $from);
        }

        if ($to = $request->string('to')) {
            $query->where('viewed_at', '<=', $to);
        }

        $total = $query->count();
        $totalRewards = (int) $query->sum('reward_amount');

        $byPlatform = AdView::selectRaw('platform, COUNT(*) as count')
            ->when($from, fn ($q) => $q->where('viewed_at', '>=', $from))
            ->when($to, fn ($q) => $q->where('viewed_at', '<=', $to))
            ->groupBy('platform')
            ->pluck('count', 'platform')
            ->toArray();

        $byPlacement = AdView::selectRaw('placement, COUNT(*) as count')
            ->when($from, fn ($q) => $q->where('viewed_at', '>=', $from))
            ->when($to, fn ($q) => $q->where('viewed_at', '<=', $to))
            ->groupBy('placement')
            ->pluck('count', 'placement')
            ->toArray();

        $byRewardType = AdView::selectRaw('reward_type, COUNT(*) as count, SUM(reward_amount) as total')
            ->when($from, fn ($q) => $q->where('viewed_at', '>=', $from))
            ->when($to, fn ($q) => $q->where('viewed_at', '<=', $to))
            ->whereNotNull('reward_type')
            ->groupBy('reward_type')
            ->get()
            ->keyBy('reward_type')
            ->map(fn ($row) => ['count' => (int) $row->count, 'total' => (int) $row->total])
            ->toArray();

        return response()->json([
            'data' => [
                'total_views' => $total,
                'total_rewards' => $totalRewards,
                'by_platform' => $byPlatform,
                'by_placement' => $byPlacement,
                'by_reward_type' => $byRewardType,
            ],
        ]);
    }
}
