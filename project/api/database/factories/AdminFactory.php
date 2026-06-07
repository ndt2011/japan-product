<?php

namespace Database\Factories;

use App\Models\Admin;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Admin>
 */
class AdminFactory extends Factory
{
    protected $model = Admin::class;

    public function definition(): array
    {
        return [
            'login_id' => fake()->unique()->userName(),
            'password' => 'password',
            'full_name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'branch_id' => null,
            'disabled_flag' => false,
            'deleted_flag' => false,
            'created' => now(),
        ];
    }
}
