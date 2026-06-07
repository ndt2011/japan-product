<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\BranchUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class BranchController extends Controller
{
    // GET /branches
    public function index(Request $request): JsonResponse
    {
        $branches = Branch::with('manager:id,branch_id,full_name,login_id')
            ->active()
            ->when($request->region,   fn($q, $r) => $q->byRegion($r))
            ->when($request->province, fn($q, $p) => $q->where('province', $p))
            ->withCount(['users' => fn($q) => $q->where('deleted_flag', 0)])
            ->get();

        return response()->json(['success' => true, 'data' => $branches]);
    }

    // POST /branches
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'branch_cd'   => 'required|string|max:20|unique:branches,branch_cd',
            'branch_name' => 'required|string|max:100',
            'region'      => 'required|in:Bắc,Trung,Nam',
            'province'    => 'required|string|max:100',
            'address'     => 'nullable|string|max:255',
        ]);

        $user   = $request->user();
        $branch = Branch::create(array_merge($validated, [
            'deleted_flag'    => 0,
            'created'         => now(),
            'created_user_id' => $user->id,
        ]));

        return response()->json(['success' => true, 'data' => $branch], 201);
    }

    // GET /branches/{id}
    public function show(int $id): JsonResponse
    {
        $branch = Branch::with([
            'users' => fn($q) => $q->where('deleted_flag', 0)->select('id', 'branch_id', 'full_name', 'login_id', 'role'),
        ])
            ->active()
            ->findOrFail($id);

        return response()->json(['success' => true, 'data' => $branch]);
    }

    // PUT /branches/{id}
    public function update(Request $request, int $id): JsonResponse
    {
        $branch = Branch::active()->findOrFail($id);

        $validated = $request->validate([
            'branch_name' => 'sometimes|string|max:100',
            'region'      => 'sometimes|in:Bắc,Trung,Nam',
            'province'    => 'sometimes|string|max:100',
            'address'     => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $branch->update(array_merge($validated, [
            'modified'         => now(),
            'modified_user_id' => $user->id,
        ]));

        return response()->json(['success' => true, 'data' => $branch]);
    }

    // DELETE /branches/{id}
    public function destroy(Request $request, int $id): JsonResponse
    {
        $branch = Branch::active()->findOrFail($id);
        $user   = $request->user();

        $branch->update([
            'deleted_flag'     => 1,
            'deleted'          => now(),
            'modified_user_id' => $user->id,
        ]);

        return response()->json(['success' => true, 'message' => 'M0200']);
    }
}
