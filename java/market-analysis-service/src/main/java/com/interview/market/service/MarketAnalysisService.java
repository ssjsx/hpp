package com.interview.market.service;

import com.interview.market.model.MarketFilters;
import com.interview.market.model.MarketOverviewResponse;
import com.interview.market.model.MarketSegmentPoint;
import com.interview.market.model.MarketSummary;
import com.interview.market.model.PropertyRecord;
import com.interview.market.model.WhatIfRequest;
import com.interview.market.model.WhatIfResponse;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import java.io.BufferedReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class MarketAnalysisService {

  private static final Logger log = LoggerFactory.getLogger(MarketAnalysisService.class);

  private final PredictClient predictClient;
  private final Path datasetPath;
  private volatile List<PropertyRecord> records;

  public MarketAnalysisService(
      PredictClient predictClient,
      @Value("${market.datasetPath}") String datasetPath) {
    this.predictClient = predictClient;
    this.datasetPath = Path.of(datasetPath);
  }

  @Cacheable(value = "marketOverview", key = "#filters.cacheKey()")
  public MarketOverviewResponse getOverview(MarketFilters filters) {
    List<PropertyRecord> data = applyFilters(loadRecords(), filters);
    List<PropertyRecord> pageRows = applyPagingAndSorting(data, filters);

    List<Double> prices = data.stream().map(PropertyRecord::price).sorted().toList();
    double totalPrice = prices.stream().mapToDouble(Double::doubleValue).sum();
    double totalSqft = data.stream().mapToDouble(PropertyRecord::squareFootage).sum();

    MarketSummary summary = new MarketSummary(
        data.size(),
        data.isEmpty() ? 0 : totalPrice / data.size(),
        median(prices),
        data.isEmpty() ? 0 : prices.get(0),
        data.isEmpty() ? 0 : prices.get(prices.size() - 1),
        totalSqft == 0 ? 0 : totalPrice / totalSqft);

    return new MarketOverviewResponse(
        summary,
        buildSegmentDistribution(data),
        buildPriceBuckets(data),
        pageRows,
        data.size(),
        Instant.now());
  }

  @Cacheable(value = "marketCsv", key = "#filters.cacheKey()")
  public String exportCsv(MarketFilters filters) {
    List<PropertyRecord> data = applyFilters(loadRecords(), filters);
    String header = "id,square_footage,bedrooms,bathrooms,year_built,lot_size,distance_to_city_center,school_rating,price";

    List<String> lines = new ArrayList<>();
    lines.add(header);
    data.forEach(row -> lines.add(String.join(",",
        String.valueOf(row.id()),
        String.valueOf(row.squareFootage()),
        String.valueOf(row.bedrooms()),
        String.valueOf(row.bathrooms()),
        String.valueOf(row.yearBuilt()),
        String.valueOf(row.lotSize()),
        String.valueOf(row.distanceToCityCenter()),
        String.valueOf(row.schoolRating()),
        String.valueOf(row.price()))));

    return String.join("\n", lines);
  }

  public WhatIfResponse runWhatIf(WhatIfRequest request) {
    double prediction = predictClient.predict(com.interview.market.model.PredictRequest.fromWhatIf(request));
    double marketAveragePrice = getMarketAveragePrice();

    double variance =
        marketAveragePrice == 0 ? 0 : ((prediction - marketAveragePrice) / marketAveragePrice) * 100;
    return new WhatIfResponse(prediction, variance);
  }

  private double getMarketAveragePrice() {
    return loadRecords().stream()
        .mapToDouble(PropertyRecord::price)
        .average()
        .orElse(0);
  }

  private List<PropertyRecord> loadRecords() {
    if (records != null) {
      return records;
    }

    synchronized (this) {
      if (records != null) {
        return records;
      }

      try (BufferedReader bufferedReader = Files.newBufferedReader(datasetPath);
          CSVReader csvReader = new CSVReader(bufferedReader)) {
        List<PropertyRecord> loaded = new ArrayList<>();
        String[] row;
        int rowNumber = 0;

        while ((row = csvReader.readNext()) != null) {
          rowNumber++;
          if (rowNumber == 1 && isHeaderRow(row)) {
            continue;
          }

          try {
            loaded.add(parseLine(row, rowNumber));
          } catch (IllegalArgumentException ex) {
            // Skip malformed rows to keep service available while surfacing data quality
            // issues.
            log.warn("Skipping invalid CSV row {}: {}", rowNumber, ex.getMessage());
          }
        }

        records = List.copyOf(loaded);
        return records;
      } catch (IOException | CsvValidationException e) {
        throw new IllegalStateException("Failed to read dataset from " + datasetPath, e);
      }
    }
  }

  private boolean isHeaderRow(String[] row) {
    return row.length > 0 && "id".equalsIgnoreCase(row[0].trim());
  }

  private PropertyRecord parseLine(String[] fields, int rowNumber) {
    if (fields.length < 9) {
      throw new IllegalArgumentException(
          "Row " + rowNumber + " has " + fields.length + " columns, expected 9");
    }

    try {
      return new PropertyRecord(
          parseInt(fields[0], "id", rowNumber),
          parseDouble(fields[1], "square_footage", rowNumber),
          parseDouble(fields[2], "bedrooms", rowNumber),
          parseDouble(fields[3], "bathrooms", rowNumber),
          parseDouble(fields[4], "year_built", rowNumber),
          parseDouble(fields[5], "lot_size", rowNumber),
          parseDouble(fields[6], "distance_to_city_center", rowNumber),
          parseDouble(fields[7], "school_rating", rowNumber),
          parseDouble(fields[8], "price", rowNumber));
    } catch (NumberFormatException ex) {
      throw new IllegalArgumentException(
          "Row " + rowNumber + " contains invalid numeric value: " + ex.getMessage(), ex);
    }
  }

  private int parseInt(String value, String column, int rowNumber) {
    try {
      return Integer.parseInt(value.trim());
    } catch (NumberFormatException ex) {
      throw new NumberFormatException(column + "=" + value + " at row " + rowNumber);
    }
  }

  private double parseDouble(String value, String column, int rowNumber) {
    try {
      return Double.parseDouble(value.trim());
    } catch (NumberFormatException ex) {
      throw new NumberFormatException(column + "=" + value + " at row " + rowNumber);
    }
  }

  private List<PropertyRecord> applyFilters(List<PropertyRecord> data, MarketFilters filters) {
    return data.stream()
        .filter(row -> filters.minPrice() == null || row.price() >= filters.minPrice())
        .filter(row -> filters.maxPrice() == null || row.price() <= filters.maxPrice())
        .filter(row -> filters.minBedrooms() == null || row.bedrooms() >= filters.minBedrooms())
        .filter(row -> filters.maxDistance() == null || row.distanceToCityCenter() <= filters.maxDistance())
        .filter(row -> filters.minSchoolRating() == null || row.schoolRating() >= filters.minSchoolRating())
        .filter(row -> {
          if (filters.search() == null || filters.search().isBlank()) {
            return true;
          }
          String query = filters.search().trim().toLowerCase();
          String rowText = String.join(" ",
              String.valueOf(row.id()),
              String.valueOf(row.yearBuilt()),
              String.valueOf(row.bedrooms()),
              String.valueOf(row.price())).toLowerCase();
          return rowText.contains(query);
        })
        .toList();
  }

  private List<PropertyRecord> applyPagingAndSorting(List<PropertyRecord> data, MarketFilters filters) {
    String sortBy = Optional.ofNullable(filters.sortBy()).orElse("price");
    String sortOrder = Optional.ofNullable(filters.sortOrder()).orElse("desc");
    int page = Optional.ofNullable(filters.page()).orElse(1);
    int pageSize = Optional.ofNullable(filters.pageSize()).orElse(20);

    Comparator<PropertyRecord> comparator = switch (sortBy) {
      case "square_footage" -> Comparator.comparingDouble(PropertyRecord::squareFootage);
      case "school_rating" -> Comparator.comparingDouble(PropertyRecord::schoolRating);
      case "year_built" -> Comparator.comparingDouble(PropertyRecord::yearBuilt);
      default -> Comparator.comparingDouble(PropertyRecord::price);
    };

    if ("desc".equalsIgnoreCase(sortOrder)) {
      comparator = comparator.reversed();
    }

    int skip = Math.max(0, (page - 1) * pageSize);

    return data.stream()
        .sorted(comparator)
        .skip(skip)
        .limit(pageSize)
        .toList();
  }

  private List<MarketSegmentPoint> buildSegmentDistribution(List<PropertyRecord> data) {
    Map<String, List<PropertyRecord>> grouped = data.stream()
        .collect(Collectors.groupingBy(row -> Math.round(row.bedrooms()) + " bed"));

    return grouped.entrySet().stream()
        .map(entry -> {
          List<PropertyRecord> segmentRows = entry.getValue();
          double avgPrice = segmentRows.stream().mapToDouble(PropertyRecord::price).average().orElse(0);
          return new MarketSegmentPoint(entry.getKey(), segmentRows.size(), avgPrice);
        })
        .sorted((a, b) -> Integer.compare(b.count(), a.count()))
        .toList();
  }

  private List<MarketSegmentPoint> buildPriceBuckets(List<PropertyRecord> data) {
    return List.of(
        bucket("<200k", data, 0, 200000),
        bucket("200k-250k", data, 200000, 250000),
        bucket("250k-300k", data, 250000, 300000),
        bucket("300k-350k", data, 300000, 350000),
        bucket(">350k", data, 350000, Double.MAX_VALUE));
  }

  private MarketSegmentPoint bucket(String label, List<PropertyRecord> data, double min, double max) {
    List<PropertyRecord> rows = data.stream()
        .filter(r -> r.price() >= min && r.price() < max)
        .toList();
    double avg = rows.stream().mapToDouble(PropertyRecord::price).average().orElse(0);
    return new MarketSegmentPoint(label, rows.size(), avg);
  }

  private double median(List<Double> sortedValues) {
    if (sortedValues.isEmpty()) {
      return 0;
    }
    int size = sortedValues.size();
    int mid = size / 2;
    if (size % 2 == 0) {
      return (sortedValues.get(mid - 1) + sortedValues.get(mid)) / 2;
    }
    return sortedValues.get(mid);
  }
}
