package com.interview.market.model;

public record MarketFilters(
    Double minPrice,
    Double maxPrice,
    Double minBedrooms,
    Double maxDistance,
    Double minSchoolRating,
    String search,
    String sortBy,
    String sortOrder,
    Integer page,
    Integer pageSize
) {

  public String cacheKey() {
    return String.join("|",
        safe(minPrice),
        safe(maxPrice),
        safe(minBedrooms),
        safe(maxDistance),
        safe(minSchoolRating),
        safe(search),
        safe(sortBy),
        safe(sortOrder),
        safe(page),
        safe(pageSize));
  }

  private static String safe(Object value) {
    return value == null ? "" : String.valueOf(value);
  }
}
