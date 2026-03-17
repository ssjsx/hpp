package com.interview.market.model;

public record PropertyRecord(
    int id,
    double squareFootage,
    double bedrooms,
    double bathrooms,
    double yearBuilt,
    double lotSize,
    double distanceToCityCenter,
    double schoolRating,
    double price
) {
}
