<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Branch;
use App\Models\BranchUser;
use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BranchTest extends TestCase
{
    use RefreshDatabase;

    private function createBranchWithUsers(): array
    {
        $branch = Branch::query()->create([
            'branch_cd' => 'CN-HN-01',
            'branch_name' => 'Chi nhánh Hà Nội',
            'region' => 'Bắc',
            'province' => 'Hà Nội',
            'disabled_flag' => false,
            'created' => now(),
            'created_user_id' => 1,
            'deleted_flag' => false,
        ]);

        $manager = BranchUser::query()->create([
            'branch_id' => $branch->id,
            'login_id' => 'hn_manager',
            'password' => 'Manager@123',
            'full_name' => 'HN Manager',
            'role' => 'manager',
            'disabled_flag' => false,
            'created' => now(),
            'created_user_id' => 1,
            'deleted_flag' => false,
        ]);

        $staff = BranchUser::query()->create([
            'branch_id' => $branch->id,
            'login_id' => 'hn_staff',
            'password' => 'Staff@123',
            'full_name' => 'HN Staff',
            'role' => 'staff',
            'disabled_flag' => false,
            'created' => now(),
            'created_user_id' => 1,
            'deleted_flag' => false,
        ]);

        return compact('branch', 'manager', 'staff');
    }

    private function createProduct(): Product
    {
        $category = ProductCategory::query()->create([
            'category_name' => 'Test Cat',
            'disabled_flag' => false,
            'deleted_flag' => false,
        ]);

        return Product::query()->create([
            'product_category_id' => $category->id,
            'product_cd' => 'BR01',
            'product_name' => 'Branch Product',
            'price_vnd' => 100000,
            'cost_jpy' => 500,
            'deleted_flag' => false,
        ]);
    }

    public function test_branch_manager_can_login(): void
    {
        $this->createBranchWithUsers();

        $response = $this->postJson('/api/auth/login', [
            'login_id' => 'hn_manager',
            'password' => 'Manager@123',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.user.user_type', 'branch_manager')
            ->assertJsonPath('data.user.branch.branch_cd', 'CN-HN-01');
    }

    public function test_admin_can_create_branch(): void
    {
        $admin = Admin::factory()->create();
        $token = $admin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/branches', [
                'branch_cd' => 'CN-SG-01',
                'branch_name' => 'Chi nhánh TP.HCM',
                'region' => 'Nam',
                'province' => 'TP. Hồ Chí Minh',
            ]);

        $response->assertCreated()
            ->assertJsonPath('message', 'M1200')
            ->assertJsonPath('data.branch.branch_cd', 'CN-SG-01');
    }

    public function test_branch_staff_can_create_order_for_branch(): void
    {
        ['branch' => $branch] = $this->createBranchWithUsers();
        $product = $this->createProduct();
        $staff = BranchUser::query()->where('login_id', 'hn_staff')->first();
        $token = $staff->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/orders', [
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 2],
                ],
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.order.branch_id', $branch->id)
            ->assertJsonPath('data.order.company_vn_id', null);
    }

    public function test_branch_user_only_sees_own_branch_orders(): void
    {
        ['branch' => $branch] = $this->createBranchWithUsers();
        $product = $this->createProduct();
        $staff = BranchUser::query()->where('login_id', 'hn_staff')->first();
        $token = $staff->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/orders', [
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 1],
                ],
            ]);

        $otherBranch = Branch::query()->create([
            'branch_cd' => 'CN-DN-01',
            'branch_name' => 'Chi nhánh Đà Nẵng',
            'region' => 'Trung',
            'province' => 'Đà Nẵng',
            'disabled_flag' => false,
            'created' => now(),
            'created_user_id' => 1,
            'deleted_flag' => false,
        ]);

        \App\Models\Order::query()->create([
            'branch_id' => $otherBranch->id,
            'company_vn_id' => null,
            'order_no' => 'ORD-TEST-0001',
            'status' => 'DRAFT',
            'order_date' => now()->toDateString(),
            'total_jpy' => '0',
            'total_vnd' => '0',
            'exchange_rate' => 170.5,
            'created' => now(),
            'created_user_id' => 1,
            'deleted_flag' => false,
        ]);

        $list = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/orders');

        $list->assertOk();
        $items = $list->json('data.items');
        $this->assertCount(1, $items);
        $this->assertSame($branch->id, $items[0]['branch_id']);
    }

    public function test_branch_manager_can_create_staff_user(): void
    {
        ['branch' => $branch, 'manager' => $manager] = $this->createBranchWithUsers();
        $token = $manager->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/branches/{$branch->id}/users", [
                'login_id' => 'new_staff',
                'password' => 'Staff@999',
                'full_name' => 'New Staff',
                'role' => 'staff',
            ]);

        $response->assertCreated()
            ->assertJsonPath('message', 'M1202')
            ->assertJsonPath('data.user.role', 'staff');
    }

    public function test_branch_manager_cannot_create_manager_user(): void
    {
        ['branch' => $branch, 'manager' => $manager] = $this->createBranchWithUsers();
        $token = $manager->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/branches/{$branch->id}/users", [
                'login_id' => 'new_manager',
                'password' => 'Manager@999',
                'full_name' => 'New Manager',
                'role' => 'manager',
            ]);

        $response->assertStatus(422);
    }
}
