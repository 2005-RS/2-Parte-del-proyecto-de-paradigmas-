import { metrics, type Counter } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

const counters = new Map<string, Counter>();

export function startTelemetry(serviceName: string): void {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) return;

  const sdk = new NodeSDK({
    serviceName,
    traceExporter: new OTLPTraceExporter({ url: `${endpoint}/v1/traces` }),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({ url: `${endpoint}/v1/metrics` }),
      exportIntervalMillis: 10000,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  sdk.start();
  process.on('SIGTERM', () => {
    void sdk.shutdown();
  });
}

export function countRequest(serviceName: string, method: string, status: number): void {
  let counter = counters.get(serviceName);
  if (!counter) {
    counter = metrics.getMeter(serviceName).createCounter('profelink_http_requests_total', {
      description: 'Solicitudes HTTP atendidas',
    });
    counters.set(serviceName, counter);
  }
  counter.add(1, { service_name: serviceName, method, status: String(status) });
}
