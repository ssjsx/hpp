package com.interview.market.model;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record WhatIfRequest(
    @NotNull @DecimalMin(value = "0.1") Double square_footage,
    @NotNull @DecimalMin(value = "0") Double bedrooms,
    @NotNull @DecimalMin(value = "0") Double bathrooms,
    @NotNull @Min(1700) @Max(2100) Integer year_built,
    @NotNull @DecimalMin(value = "0.1") Double lot_size,
    @NotNull @DecimalMin(value = "0") Double distance_to_city_center,
    @NotNull @DecimalMin(value = "0") @DecimalMax(value = "10") Double school_rating
) {
}
