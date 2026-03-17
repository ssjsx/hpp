package com.interview.market.model;

public record WhatIfResponse(
    double prediction,
    double varianceFromAverage
) {
}
