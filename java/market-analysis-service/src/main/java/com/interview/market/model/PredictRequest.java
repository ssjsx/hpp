package com.interview.market.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public record PredictRequest(
    @JsonProperty("square_footage") double squareFootage,
    @JsonProperty("bedrooms") double bedrooms,
    @JsonProperty("bathrooms") double bathrooms,
    @JsonProperty("year_built") double yearBuilt,
    @JsonProperty("lot_size") double lotSize,
    @JsonProperty("distance_to_city_center") double distanceToCityCenter,
    @JsonProperty("school_rating") double schoolRating
) {

  public static PredictRequest fromWhatIf(WhatIfRequest request) {
    return new PredictRequest(
        request.square_footage(),
        request.bedrooms(),
        request.bathrooms(),
        request.year_built(),
        request.lot_size(),
        request.distance_to_city_center(),
        request.school_rating());
  }
}
