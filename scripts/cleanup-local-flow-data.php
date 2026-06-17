<?php

declare(strict_types=1);

$backendPath = getenv('SIRANGKUL_API_PATH') ?: realpath(__DIR__ . '/../../api-sirangkul');

if (!$backendPath || !is_file($backendPath . '/artisan')) {
    fwrite(STDERR, "Backend path tidak ditemukan. Set SIRANGKUL_API_PATH ke path api-sirangkul.\n");
    exit(1);
}

chdir($backendPath);

require $backendPath . '/vendor/autoload.php';

$app = require $backendPath . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Proposal;
use App\Models\Rkam;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

if (app()->environment('production') && getenv('SIRANGKUL_ALLOW_FLOW_CLEANUP') !== '1') {
    fwrite(STDERR, "Cleanup flow diblokir karena APP_ENV=production. Set SIRANGKUL_ALLOW_FLOW_CLEANUP=1 jika benar-benar diperlukan.\n");
    exit(1);
}

$titlePrefix = getenv('SIRANGKUL_FLOW_TITLE_PREFIX') ?: 'FLOW';
$tokenNames = ['local-flow-scenario', 'local-flow-probe'];

$summary = [
    'backend_path' => $backendPath,
    'title_prefix' => $titlePrefix,
    'proposals_deleted' => 0,
    'proposal_attachments_deleted' => 0,
    'payments_deleted' => 0,
    'feedback_deleted' => 0,
    'approval_workflows_deleted' => 0,
    'notifications_deleted' => 0,
    'audit_logs_deleted' => 0,
    'tokens_deleted' => 0,
    'rkams_deleted' => 0,
    'legacy_rkams_deleted' => 0,
    'users_deleted' => 0,
    'users_deactivated' => 0,
    'local_files_deleted' => 0,
    'public_files_deleted' => 0,
    'runtime_file_deleted' => false,
    'warnings' => [],
];

$attachmentPaths = [];
$paymentProofPaths = [];
$flowUserIds = [];

DB::transaction(function () use (
    $titlePrefix,
    $tokenNames,
    &$summary,
    &$attachmentPaths,
    &$paymentProofPaths,
    &$flowUserIds
): void {
    $proposalIds = Proposal::query()
        ->where(function ($query) use ($titlePrefix): void {
            $query->where('title', 'like', $titlePrefix . '-%')
                ->orWhere('title', 'like', 'HTTP Flow Proposal %');
        })
        ->pluck('id')
        ->all();

    $flowUserIds = User::query()
        ->where('email', 'like', 'flowtest.%@sirangkul.test')
        ->pluck('id')
        ->all();

    $kepalaId = User::query()->where('email', 'kepala@madrasah.com')->value('id');
    $tokenUserIds = array_values(array_filter(array_merge($flowUserIds, [$kepalaId])));

    if (Schema::hasTable('personal_access_tokens') && $tokenUserIds !== []) {
        $summary['tokens_deleted'] = DB::table('personal_access_tokens')
            ->whereIn('tokenable_id', $tokenUserIds)
            ->whereIn('name', $tokenNames)
            ->delete();
    }

    if ($proposalIds !== []) {
        if (Schema::hasTable('proposal_attachments')) {
            $attachmentPaths = DB::table('proposal_attachments')
                ->whereIn('proposal_id', $proposalIds)
                ->pluck('file_path')
                ->filter()
                ->all();

            $summary['proposal_attachments_deleted'] = DB::table('proposal_attachments')
                ->whereIn('proposal_id', $proposalIds)
                ->delete();
        }

        if (Schema::hasTable('payments')) {
            $paymentProofPaths = DB::table('payments')
                ->whereIn('proposal_id', $proposalIds)
                ->pluck('payment_proof_file')
                ->filter()
                ->all();

            $summary['payments_deleted'] = DB::table('payments')
                ->whereIn('proposal_id', $proposalIds)
                ->delete();
        }

        if (Schema::hasTable('feedback')) {
            $summary['feedback_deleted'] += DB::table('feedback')
                ->whereIn('proposal_id', $proposalIds)
                ->delete();
        }

        if (Schema::hasTable('approval_workflows')) {
            $summary['approval_workflows_deleted'] = DB::table('approval_workflows')
                ->whereIn('proposal_id', $proposalIds)
                ->delete();
        }

        $summary['proposals_deleted'] = DB::table('proposals')
            ->whereIn('id', $proposalIds)
            ->delete();
    }

    if ($flowUserIds !== []) {
        if (Schema::hasTable('notifications')) {
            $summary['notifications_deleted'] = DB::table('notifications')
                ->whereIn('user_id', $flowUserIds)
                ->delete();
        }

        if (Schema::hasTable('feedback')) {
            $summary['feedback_deleted'] += DB::table('feedback')
                ->whereIn('user_id', $flowUserIds)
                ->delete();
        }

        if (Schema::hasTable('audit_logs')) {
            $summary['audit_logs_deleted'] = DB::table('audit_logs')
                ->whereIn('user_id', $flowUserIds)
                ->delete();
        }
    }

    $rkam = new Rkam();
    $rkamTable = $rkam->getTable();
    $rkamIds = Rkam::withoutGlobalScopes()
        ->where('item_name', 'like', 'Flow Test RKAM %')
        ->whereDoesntHave('proposals')
        ->pluck('id')
        ->all();

    if ($rkamIds !== []) {
        $summary['rkams_deleted'] = DB::table($rkamTable)
            ->whereIn('id', $rkamIds)
            ->delete();
    }

    if (Schema::hasTable('rkams')) {
        $summary['legacy_rkams_deleted'] = DB::table('rkams')
            ->where('item_name', 'like', 'Flow Test RKAM %')
            ->delete();
    }
});

foreach (array_unique($attachmentPaths) as $path) {
    if (Storage::disk('local')->delete($path)) {
        $summary['local_files_deleted']++;
    }
}

foreach (array_unique($paymentProofPaths) as $path) {
    if (Storage::disk('public')->delete($path)) {
        $summary['public_files_deleted']++;
    }
}

foreach (User::query()->where('email', 'like', 'flowtest.%@sirangkul.test')->get() as $user) {
    try {
        $user->delete();
        $summary['users_deleted']++;
    } catch (Throwable $exception) {
        $user->forceFill([
            'status' => 'Inactive',
            'is_active' => false,
        ])->save();

        $summary['users_deactivated']++;
        $summary['warnings'][] = [
            'email' => $user->email,
            'message' => $exception->getMessage(),
        ];
    }
}

$runtimeFile = getenv('SIRANGKUL_FLOW_RUNTIME') ?: realpath(__DIR__ . '/../scratch/local-flow-runtime.json');
if ($runtimeFile && is_file($runtimeFile)) {
    $summary['runtime_file_deleted'] = unlink($runtimeFile);
}

echo json_encode($summary, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
