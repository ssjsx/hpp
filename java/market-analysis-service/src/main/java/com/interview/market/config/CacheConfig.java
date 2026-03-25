package com.interview.market.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import java.time.Duration;
import java.util.List;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {

  @Bean
  public CacheManager cacheManager(
      @Value("${market.cache.overviewTtl:PT5M}") Duration overviewTtl,
      @Value("${market.cache.csvTtl:PT2M}") Duration csvTtl,
      @Value("${market.cache.overviewMaxSize:200}") long overviewMaxSize,
      @Value("${market.cache.csvMaxSize:20}") long csvMaxSize) {
    SimpleCacheManager manager = new SimpleCacheManager();
    manager.setCaches(
        List.of(
            new CaffeineCache(
                "marketOverview",
                Caffeine.newBuilder()
                    .expireAfterWrite(overviewTtl)
                    .maximumSize(overviewMaxSize)
                    .build()),
            new CaffeineCache(
                "marketCsv",
                Caffeine.newBuilder()
                    .expireAfterWrite(csvTtl)
                    .maximumSize(csvMaxSize)
                    .build())));
    return manager;
  }
}
