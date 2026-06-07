<?php

namespace App\Http\Controllers;

use App\Models\BranchUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class BranchUserController extends Controller
{
    // GET /branch-users
    // Admin: thấy tất cả. Branch manager: chỉ thấy trong branch của mình.
    public function index(Request $request): JsonResponse
    {
        $actor = $request->user();
        $query = BranchUser::with('branch:id,branch_cd,branch_name')
            ->where('deleted_flag', 0);

        if ($actor->user_type === 'branch_manager') {
            $query->where('branch_id', $actor->branch_id);
        } else {
            // admin — cho phép filter theo branch_id
            $query->when($request->branch_id, fn($q, $id) => $q->where('branch_id', $id));
        }

        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    // POST /branch-users
    // Admin có thể tạo manager + staff.
    // Branch manager chỉ được tạo staff trong branch của mình.
    public function store(Request $request): JsonResponse
    {
        $actor = $request->user();

        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'login_id'  => 'required|string|max:50|unique:branch_users,login_id',
            'password'  => 'required|string|min:8',
            'full_name' => 'required|string|max:100',
            'role'      => 'required|in:manager,staff',
        ]);

        // Branch manager chỉ tạo được staff, và chỉ trong branch của mình
        if ($actor->user_type === 'branch_manager') {
            if ($validated['branch_id'] !== $actor->branch_id) {
                return response()->json(['success' => false, 'message' => 'M4031'], 403);
            }
            if ($validated['role'] !== 'staff') {
                return response()->json(['success' => false, 'message' => 'M4032'], 403);
            }
        }

        $branchUser = BranchUser::create([
            'branch_id'       => $validated['branch_id'],
            'login_id'        => $validated['login_id'],
            'password'        => Hash::make($validated['password']),
            'full_name'       => $validated['full_name'],
            'role'            => $validated['role'],
            'deleted_flag'    => 0,
            'created'         => now(),
            'created_user_id' => $actor->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'M0100',
            'data'    => $branchUser->makeHidden('password'),
        ], 201);
    }

    // PUT /branch-users/{id}
    public function update(Request $request, int $id): JsonResponse
    {
        $actor     = $request->user();
        $branchUser = BranchUser::where('deleted_flag', 0)->findOrFail($id);

        // Branch manager chỉ được sửa user trong branch mình
        if ($actor->user_type === 'branch_manager' && $branchUser->branch_id !== $actor->branch_id) {
            return response()->json(['success' => false, 'message' => 'M4031'], 403);
        }

        $validated = $request->validate([
            'full_name' => 'sometimes|string|max:100',
            'password'  => 'sometimes|string|min:8',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $branchUser->update(array_merge($validated, [
            'modified'         => now(),
            'modified_user_id' => $actor->id,
        ]));

        return response()->json(['success' => true, 'data' => $branchUser->makeHidden('password')]);
    }

    // DELETE /branch-users/{id}
    public function destroy(Request $request, int $id): JsonResponse
    {
        $actor     = $request->user();
        $branchUser = BranchUser::where('deleted_flag', 0)->findOrFail($id);

        if ($actor->user_type === 'branch_manager' && $branchUser->branch_id !== $actor->branch_id) {
            return response()->json(['success' => false, 'message' => 'M4031'], 403);
        }

        $branchUser->update([
            'deleted_flag'     => 1,
            'deleted'          => now(),
            'modified_user_id' => $actor->id,
        ]);

        return response()->json(['success' => true, 'message' => 'M0200']);
    }
}
