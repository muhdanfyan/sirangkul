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

use App\Models\Bidang;
use App\Models\Rkam;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

$password = 'Password123!';

$bidangDefinitions = [
    'pendidikan' => [
        'id' => '11111111-1111-1111-1111-111111111111',
        'name' => 'Pendidikan',
        'description' => 'Flow test bidang Pendidikan.',
        'color' => '#2563eb',
        'sort_order' => 2,
        'rkam' => 'Flow Test RKAM Pendidikan',
    ],
    'humas' => [
        'id' => '44444444-4444-4444-4444-444444444444',
        'name' => 'HUMAS',
        'description' => 'Flow test bidang HUMAS.',
        'color' => '#7c3aed',
        'sort_order' => 1,
        'rkam' => 'Flow Test RKAM HUMAS',
    ],
    'sarpras' => [
        'id' => '33333333-3333-3333-3333-333333333333',
        'name' => 'Sarana dan Prasarana',
        'description' => 'Flow test bidang Sarana dan Prasarana.',
        'color' => '#d97706',
        'sort_order' => 3,
        'rkam' => 'Flow Test RKAM Sarana dan Prasarana',
    ],
    'sekretariat' => [
        'id' => '22222222-2222-2222-2222-222222222222',
        'name' => 'Sekretariat Komite',
        'description' => 'Flow test bidang Sekretariat Komite.',
        'color' => '#0f766e',
        'sort_order' => 4,
        'rkam' => 'Flow Test RKAM Sekretariat Komite',
    ],
];

$summary = [
    'backend_path' => $backendPath,
    'password' => $password,
    'bidangs' => [],
    'users' => [],
    'rkams' => [],
    'counts' => [],
    'runtime_file' => null,
];

$runtime = [
    'api_base_url' => getenv('SIRANGKUL_API_BASE_URL') ?: 'http://127.0.0.1:8000/api',
    'title_prefix' => getenv('SIRANGKUL_FLOW_TITLE_PREFIX') ?: 'FLOW',
    'accounts' => [
        'pengusul' => [],
        'verifikator' => [],
        'kepala_madrasah' => 'kepala@madrasah.com',
        'ketua_komite' => 'flowtest.ketua-komite@sirangkul.test',
        'bendahara' => 'flowtest.bendahara@sirangkul.test',
        'administrator' => 'flowtest.admin@sirangkul.test',
    ],
    'tokens' => [],
];

DB::transaction(function () use ($bidangDefinitions, $password, &$summary, &$runtime): void {
    foreach ($bidangDefinitions as $slug => $definition) {
        $bidang = Bidang::query()->where('name', $definition['name'])->first();

        if (!$bidang) {
            $bidang = new Bidang();
            $bidang->id = $definition['id'];
            $bidang->fill([
                'name' => $definition['name'],
                'description' => $definition['description'],
                'color' => $definition['color'],
                'sort_order' => $definition['sort_order'],
            ]);
        } else {
            $bidang->fill([
                'name' => $definition['name'],
                'description' => $bidang->description ?: $definition['description'],
                'color' => $bidang->color ?: $definition['color'],
                'sort_order' => $bidang->sort_order ?? $definition['sort_order'],
            ]);
        }
        $bidang->save();

        if (Schema::hasTable('categories')) {
            DB::table('categories')->updateOrInsert(
                ['id' => $bidang->id],
                [
                    'name' => $definition['name'],
                    'description' => $bidang->description ?: $definition['description'],
                    'color' => $bidang->color ?: $definition['color'],
                    'sort_order' => $bidang->sort_order ?? $definition['sort_order'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }

        $summary['bidangs'][$slug] = [
            'id' => $bidang->id,
            'name' => $bidang->name,
        ];

        $users = [
            "flowtest.pengusul.{$slug}@sirangkul.test" => [
                'full_name' => 'Flow Test Pengusul ' . $definition['name'],
                'role' => 'pengusul',
                'bidang_id' => $bidang->id,
            ],
            "flowtest.verifikator.{$slug}@sirangkul.test" => [
                'full_name' => 'Flow Test Verifikator ' . $definition['name'],
                'role' => 'verifikator',
                'bidang_id' => $bidang->id,
            ],
        ];

        foreach ($users as $email => $data) {
            $user = User::query()->updateOrCreate(
                ['email' => $email],
                [
                    'full_name' => $data['full_name'],
                    'role' => $data['role'],
                    'status' => 'Active',
                    'is_active' => true,
                    'bidang_id' => $data['bidang_id'],
                    'password' => Hash::make($password),
                ],
            );

            $summary['users'][$email] = [
                'id' => $user->id,
                'role' => $user->role,
                'bidang_id' => $user->bidang_id,
            ];

            $user->tokens()->where('name', 'local-flow-scenario')->delete();
            $runtime['tokens'][$email] = $user->createToken('local-flow-scenario')->plainTextToken;
            $runtime['accounts'][$data['role']][$slug] = $email;
        }

        $rkam = Rkam::withoutGlobalScopes()
            ->where('tahun_anggaran', 2026)
            ->where('item_name', $definition['rkam'])
            ->whereNull('parent_id')
            ->first();

        if (!$rkam) {
            $rkam = new Rkam();
            $rkam->parent_id = null;
            $rkam->item_name = $definition['rkam'];
            $rkam->tahun_anggaran = 2026;
        }

        $rkam->fill([
            'category_id' => $bidang->id,
            'bidang_id' => $bidang->id,
            'kategori' => $definition['name'],
            'bidang' => $definition['name'],
            'pagu' => 1000000000,
            'volume' => 1,
            'satuan' => 'Paket',
            'unit_price' => 1000000000,
            'dana_bos' => 1000000000,
            'dana_komite' => 0,
            'description' => 'RKAM lokal untuk skenario flow approval dokumen.',
            'deskripsi' => 'RKAM lokal untuk skenario flow approval dokumen.',
            'sort_order' => 900 + (int) $definition['sort_order'],
        ]);
        $rkam->save();

        if (Schema::hasTable('rkams')) {
            $legacyColumns = Schema::getColumnListing('rkams');
            $legacyPayload = [];

            foreach ($rkam->getAttributes() as $column => $value) {
                if (in_array($column, $legacyColumns, true)) {
                    $legacyPayload[$column] = $value;
                }
            }

            $legacyPayload['id'] = $rkam->id;
            if (in_array('created_at', $legacyColumns, true) && empty($legacyPayload['created_at'])) {
                $legacyPayload['created_at'] = now();
            }
            if (in_array('updated_at', $legacyColumns, true)) {
                $legacyPayload['updated_at'] = now();
            }

            DB::table('rkams')->updateOrInsert(['id' => $rkam->id], $legacyPayload);
        }

        $summary['rkams'][$slug] = [
            'id' => $rkam->id,
            'item_name' => $rkam->item_name,
            'bidang_id' => $rkam->bidang_id,
            'pagu' => (float) $rkam->pagu,
            'sisa' => (float) $rkam->sisa,
        ];
    }

    $globalUsers = [
        'kepala@madrasah.com' => [
            'full_name' => 'Kepala Madrasah Global',
            'role' => 'kepala_madrasah',
            'bidang_id' => null,
        ],
        'flowtest.bendahara@sirangkul.test' => [
            'full_name' => 'Flow Test Bendahara',
            'role' => 'bendahara',
            'bidang_id' => null,
        ],
        'flowtest.ketua-komite@sirangkul.test' => [
            'full_name' => 'Flow Test Ketua Komite',
            'role' => 'ketua_komite',
            'bidang_id' => null,
        ],
        'flowtest.admin@sirangkul.test' => [
            'full_name' => 'Flow Test Administrator',
            'role' => 'administrator',
            'bidang_id' => null,
        ],
    ];

    foreach ($globalUsers as $email => $data) {
        $user = User::query()->updateOrCreate(
            ['email' => $email],
            [
                'full_name' => $data['full_name'],
                'role' => $data['role'],
                'status' => 'Active',
                'is_active' => true,
                'bidang_id' => $data['bidang_id'],
                'password' => Hash::make($password),
            ],
        );

        $summary['users'][$email] = [
            'id' => $user->id,
            'role' => $user->role,
            'bidang_id' => $user->bidang_id,
        ];

        $user->tokens()->where('name', 'local-flow-scenario')->delete();
        $runtime['tokens'][$email] = $user->createToken('local-flow-scenario')->plainTextToken;
        $runtime['accounts'][$data['role']] = $email;
    }
});

$summary['counts'] = [
    'users' => User::query()->count(),
    'rkams' => Rkam::withoutGlobalScopes()->count(),
    'proposals' => App\Models\Proposal::query()->count(),
    'kepala_madrasah' => User::query()->where('role', 'kepala_madrasah')->count(),
];

$scratchPath = realpath(__DIR__ . '/../scratch') ?: (__DIR__ . '/../scratch');
if (!is_dir($scratchPath)) {
    mkdir($scratchPath, 0777, true);
}

$runtimeFile = $scratchPath . '/local-flow-runtime.json';
file_put_contents($runtimeFile, json_encode($runtime, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
$summary['runtime_file'] = $runtimeFile;

echo json_encode($summary, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
