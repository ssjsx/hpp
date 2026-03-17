package com.interview.market.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.interview.market.model.PredictRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class PredictClient {

  private final RestTemplate restTemplate;
  private final String predictBaseUrl;

  public PredictClient(
      RestTemplateBuilder builder,
      @Value("${predict.baseUrl:http://127.0.0.1:8000}") String predictBaseUrl) {
    this.restTemplate = builder.build();
    this.predictBaseUrl = predictBaseUrl;
  }

  public double predict(PredictRequest request) {
    ResponseEntity<PredictResponse> response =
        restTemplate.postForEntity(predictBaseUrl + "/predict", request, PredictResponse.class);

    PredictResponse body = response.getBody();
    if (body == null || body.prediction() == null) {
      throw new IllegalStateException("Predict service returned an invalid response");
    }

    return body.prediction();
  }

  private record PredictResponse(@JsonProperty("prediction") Double prediction) {
  }
}
