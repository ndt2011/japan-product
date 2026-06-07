<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProductImageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        config(['filesystems.product_images_disk' => 'public']);
    }

    private function authHeaders(): array
    {
        $admin = Admin::factory()->create();
        $token = $admin->createToken('test')->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
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
            'product_cd' => 'IMG01',
            'product_name' => 'Image Product',
            'deleted_flag' => false,
        ]);
    }

    public function test_can_upload_product_image(): void
    {
        $product = $this->createProduct();
        $file = UploadedFile::fake()->image('product.jpg', 400, 400);

        $response = $this->postJson("/api/products/{$product->id}/images", [
            'image' => $file,
            'is_primary' => true,
        ], $this->authHeaders());

        $response->assertCreated()
            ->assertJsonPath('message', 'M0301')
            ->assertJsonPath('data.image.is_primary', true);

        $product->refresh();
        $this->assertNotNull($product->image_path);
    }

    public function test_can_list_product_images(): void
    {
        $product = $this->createProduct();
        $file = UploadedFile::fake()->image('product.png');

        $this->postJson("/api/products/{$product->id}/images", [
            'image' => $file,
        ], $this->authHeaders());

        $response = $this->getJson("/api/products/{$product->id}/images", $this->authHeaders());

        $response->assertOk()
            ->assertJsonCount(1, 'data.items');
    }

    public function test_can_delete_product_image(): void
    {
        $product = $this->createProduct();
        $file = UploadedFile::fake()->image('product.webp');

        $upload = $this->postJson("/api/products/{$product->id}/images", [
            'image' => $file,
            'is_primary' => true,
        ], $this->authHeaders());

        $imageId = $upload->json('data.image.id');

        $response = $this->deleteJson(
            "/api/products/{$product->id}/images/{$imageId}",
            [],
            $this->authHeaders(),
        );

        $response->assertOk()
            ->assertJsonPath('message', 'M0303');

        $product->refresh();
        $this->assertNull($product->image_path);
    }
}
