package com.interview.market.controller;

import com.interview.market.model.MarketFilters;
import com.interview.market.model.MarketOverviewResponse;
import com.interview.market.model.WhatIfRequest;
import com.interview.market.model.WhatIfResponse;
import com.interview.market.service.MarketAnalysisService;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/market")
@Tag(name = "Market Analysis", description = "Market overview, what-if analysis, and export APIs")
public class MarketAnalysisController {

  private final MarketAnalysisService service;

  public MarketAnalysisController(MarketAnalysisService service) {
    this.service = service;
  }

  @GetMapping("/overview")
  @Operation(summary = "Get market overview", description = "Returns summary statistics and filtered market data")
  public MarketOverviewResponse overview(
      @RequestParam(required = false) Double minPrice,
      @RequestParam(required = false) Double maxPrice,
      @RequestParam(required = false) Double minBedrooms,
      @RequestParam(required = false) Double maxDistance,
      @RequestParam(required = false) Double minSchoolRating,
      @RequestParam(required = false) String search,
      @RequestParam(required = false, defaultValue = "price") String sortBy,
      @RequestParam(required = false, defaultValue = "desc") String sortOrder,
      @RequestParam(required = false, defaultValue = "1") Integer page,
      @RequestParam(required = false, defaultValue = "20") Integer pageSize) {

    return service.getOverview(new MarketFilters(
        minPrice,
        maxPrice,
        minBedrooms,
        maxDistance,
        minSchoolRating,
        search,
        sortBy,
        sortOrder,
        page,
        pageSize));
  }

  @PostMapping("/what-if")
  @Operation(summary = "Run what-if analysis", description = "Compares predicted price against market average")
  public WhatIfResponse whatIf(@Valid @RequestBody WhatIfRequest request) {
    return service.runWhatIf(request);
  }

  @GetMapping("/export/csv")
  @Operation(summary = "Export filtered data as CSV")
  public ResponseEntity<byte[]> exportCsv(
      @RequestParam(required = false) Double minPrice,
      @RequestParam(required = false) Double maxPrice,
      @RequestParam(required = false) Double minBedrooms,
      @RequestParam(required = false) Double maxDistance,
      @RequestParam(required = false) Double minSchoolRating,
      @RequestParam(required = false) String search,
      @RequestParam(required = false, defaultValue = "price") String sortBy,
      @RequestParam(required = false, defaultValue = "desc") String sortOrder) {

    String csv = service.exportCsv(new MarketFilters(
        minPrice,
        maxPrice,
        minBedrooms,
        maxDistance,
        minSchoolRating,
        search,
        sortBy,
        sortOrder,
        1,
        50000));

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.valueOf("text/csv"));
    headers.setContentDisposition(ContentDisposition.attachment().filename("market-analysis.csv").build());

    return ResponseEntity.ok()
        .headers(headers)
        .body(csv.getBytes(StandardCharsets.UTF_8));
  }

  @GetMapping("/export/pdf")
  @Operation(summary = "Export market summary as PDF")
  public ResponseEntity<byte[]> exportPdf(
      @RequestParam(required = false) Double minPrice,
      @RequestParam(required = false) Double maxPrice,
      @RequestParam(required = false) Double minBedrooms,
      @RequestParam(required = false) Double maxDistance,
      @RequestParam(required = false) Double minSchoolRating,
      @RequestParam(required = false) String search,
      @RequestParam(required = false, defaultValue = "price") String sortBy,
      @RequestParam(required = false, defaultValue = "desc") String sortOrder) {

    MarketOverviewResponse overview = service.getOverview(new MarketFilters(
        minPrice,
        maxPrice,
        minBedrooms,
        maxDistance,
        minSchoolRating,
        search,
        sortBy,
        sortOrder,
        1,
        20));

    byte[] pdf = renderPdf(overview);
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_PDF);
    headers.setContentDisposition(ContentDisposition.attachment().filename("market-analysis.pdf").build());

    return ResponseEntity.ok().headers(headers).body(pdf);
  }

  private byte[] renderPdf(MarketOverviewResponse overview) {
    try {
      ByteArrayOutputStream output = new ByteArrayOutputStream();
      Document document = new Document();
      PdfWriter.getInstance(document, output);
      document.open();

      document.add(new Paragraph("Property Market Analysis"));
      document.add(new Paragraph("Total properties: " + overview.summary().totalCount()));
      document.add(new Paragraph("Average price: " + overview.summary().avgPrice()));
      document.add(new Paragraph("Median price: " + overview.summary().medianPrice()));
      document.add(new Paragraph("Price range: "
          + overview.summary().minPrice() + " - " + overview.summary().maxPrice()));

      document.close();
      return output.toByteArray();
    } catch (DocumentException ex) {
      throw new IllegalStateException("Failed to render PDF", ex);
    }
  }
}
