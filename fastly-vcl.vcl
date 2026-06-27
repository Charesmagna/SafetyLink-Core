# Fastly VCL file for SafetyLink Core
# Edge Caching & Real-time PURGE of Tactical Dispatches

backend default {
  .host = "api.safetylink.co.za";
  .port = "443";
  .ssl = true;
  .ssl_cert_hostname = "api.safetylink.co.za";
}

sub vcl_recv {
  # Direct pass on authenticated actions
  if (req.request == "POST" || req.request == "PUT" || req.request == "DELETE" || req.request == "PATCH") {
    return(pass);
  }

  # Only cache GET requests
  if (req.request != "GET" && req.request != "HEAD") {
    return(pass);
  }

  # Route critical telemetry streams and live alerts directly without cache
  if (req.url ~ "/api/alerts/active" || req.url ~ "/api/incidents/active") {
    return(pass);
  }

  return(lookup);
}

sub vcl_fetch {
  # Edge-cache public metadata and regional stats, with instant revalidation
  if (req.url ~ "/api/regions" || req.url ~ "/api/system/status") {
    set beresp.ttl = 300s;
    set beresp.grace = 60s;
    set beresp.http.Surrogate-Control = "max-age=300, stale-while-revalidate=60";
    set beresp.http.Surrogate-Key = "system-meta";
  }

  # Ensure alert records use surrogate keys for targeted instant invalidation (PURGE)
  if (req.url ~ "/api/alerts/summary") {
    set beresp.ttl = 10s;
    set beresp.grace = 30s;
    set beresp.http.Surrogate-Control = "max-age=10, stale-while-revalidate=30";
    set beresp.http.Surrogate-Key = "alerts-summary";
  }

  return(deliver);
}

sub vcl_deliver {
  # Add debug header for testing
  if (obj.hits > 0) {
    set resp.http.X-Cache = "HIT";
    set resp.http.X-Cache-Hits = obj.hits;
  } else {
    set resp.http.X-Cache = "MISS";
  }
  return(deliver);
}
