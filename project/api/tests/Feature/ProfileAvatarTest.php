<?php

namespace Tests\Feature;

use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProfileAvatarTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_upload_profile_avatar(): void
    {
        Storage::fake('public');
        config(['filesystems.product_images_disk' => 'public']);

        $admin = Admin::factory()->create();
        $token = $admin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->post('/api/profile/avatar', [
                'avatar' => UploadedFile::fake()->image('avatar.jpg', 200, 200),
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['profile' => ['avatar_url']]]);

        $avatarUrl = $response->json('data.profile.avatar_url');
        $this->assertNotEmpty($avatarUrl);
        $this->assertSame($avatarUrl, $admin->fresh()->avatar_url);
    }
}
