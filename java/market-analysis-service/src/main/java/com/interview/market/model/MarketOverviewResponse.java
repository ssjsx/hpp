package com.interview.market.model;

import java.time.Instant;
import java.util.List;

public record MarketOverviewResponse(
    MarketSummary summary,
    List<MarketSegmentPoint> segmentDistribution,
    List<MarketSegmentPoint> priceBuckets,
    List<PropertyRecord> rows,
    int totalRows,
    Instant generatedAt
) {
}
