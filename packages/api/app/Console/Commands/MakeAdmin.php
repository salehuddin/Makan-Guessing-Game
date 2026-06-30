<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class MakeAdmin extends Command
{
    protected $signature = 'guesseat:make-admin {email} {--revoke : Remove admin instead}';

    protected $description = 'Promote (or revoke) a user as admin';

    public function handle(): int
    {
        $user = User::where('email', $this->argument('email'))->first();

        if (! $user) {
            $this->error('User not found.');

            return self::FAILURE;
        }

        $user->is_admin = ! $this->option('revoke');
        $user->save();

        $action = $user->is_admin ? 'granted' : 'revoked';
        $this->info("Admin {$action} for {$user->email} (id: {$user->id}).");

        return self::SUCCESS;
    }
}
