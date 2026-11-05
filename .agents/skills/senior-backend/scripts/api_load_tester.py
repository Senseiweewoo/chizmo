#!/usr/bin/env python3
"""
API Load Tester & Benchmark Analyzer
Measures throughput, latency percentiles (p50, p90, p95, p99), error rates, and connection stability.
"""

import sys
import time
import urllib.request
import urllib.error
import argparse
from concurrent.futures import ThreadPoolExecutor

def send_request(url: str, method: str = "GET", headers: dict = None):
    req = urllib.request.Request(url, method=method, headers=headers or {})
    start = time.perf_counter()
    status = 0
    error_msg = None
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            status = resp.status
            _ = resp.read()
    except urllib.error.HTTPError as e:
        status = e.code
    except Exception as e:
        error_msg = str(e)
    duration_ms = (time.perf_counter() - start) * 1000.0
    return duration_ms, status, error_msg

def run_benchmark(url: str, total_requests: int = 100, concurrency: int = 10):
    print(f"\n=======================================================")
    print(f"  API Load Testing Benchmark")
    print(f"  Target URL:    {url}")
    print(f"  Requests:      {total_requests}")
    print(f"  Concurrency:   {concurrency}")
    print(f"=======================================================\n")

    latencies = []
    statuses = {}
    errors = 0

    overall_start = time.perf_counter()

    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [executor.submit(send_request, url) for _ in range(total_requests)]
        for f in futures:
            dur, status, err = f.result()
            latencies.append(dur)
            statuses[status] = statuses.get(status, 0) + 1
            if err or (status >= 400 and status != 401 and status != 403):
                errors += 1

    total_time_s = time.perf_counter() - overall_start
    latencies.sort()

    p50 = latencies[int(len(latencies) * 0.50)]
    p90 = latencies[int(len(latencies) * 0.90)]
    p95 = latencies[int(len(latencies) * 0.95)]
    p99 = latencies[int(len(latencies) * 0.99)] if len(latencies) >= 100 else latencies[-1]
    avg_latency = sum(latencies) / len(latencies)
    rps = len(latencies) / total_time_s

    print(f"Benchmark Results:")
    print(f"-------------------------------------------------------")
    print(f"Total Completed:    {len(latencies)} requests in {total_time_s:.2f}s")
    print(f"Throughput:         {rps:.1f} req/s")
    print(f"Average Latency:    {avg_latency:.2f} ms")
    print(f"p50 Latency:        {p50:.2f} ms")
    print(f"p90 Latency:        {p90:.2f} ms")
    print(f"p95 Latency:        {p95:.2f} ms")
    print(f"p99 Latency:        {p99:.2f} ms")
    print(f"Status Breakdown:   {statuses}")
    print(f"Error Rate:         {(errors / total_requests) * 100:.1f}%")
    print(f"-------------------------------------------------------\n")
    return 0

def main():
    parser = argparse.ArgumentParser(description="API Load Tester & Benchmark Tool")
    parser.add_argument("url", nargs="?", default="http://localhost:3000/api/health", help="Target API endpoint")
    parser.add_argument("--requests", "-n", type=int, default=50, help="Total number of requests")
    parser.add_argument("--concurrency", "-c", type=int, default=5, help="Concurrent workers")
    args = parser.parse_args()

    return run_benchmark(args.url, args.requests, args.concurrency)

if __name__ == "__main__":
    sys.exit(main())
