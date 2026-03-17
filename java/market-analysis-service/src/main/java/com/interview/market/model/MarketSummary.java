package com.interview.market.model;

public record MarketSummary(
    int totalCount,
    double avgPrice,
    double medianPrice,
    double minPrice,
    double maxPrice,
    double avgPricePerSqft
) {
}
