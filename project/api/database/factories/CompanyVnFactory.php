<?php

namespace Database\Factories;

use App\Models\CompanyVn;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CompanyVn>
 */
class CompanyVnFactory extends Factory
{
    protected $model = CompanyVn::class;

    public function definition(): array
    {
        return [
            'company_cd' => fake()->unique()->bothify('VN###'),
            'login_id' => fake()->unique()->userName(),
            'password' => 'password',
            'company_name' => fake()->company(),
            'email' => fake()->unique()->safeEmail(),
            'contact_name' => fake()->name(),
            'disabled_flag' => false,
            'deleted_flag' => false,
            'created' => now(),
        ];
    }
}
