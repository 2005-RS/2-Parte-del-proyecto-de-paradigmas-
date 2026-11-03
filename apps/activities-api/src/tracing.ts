import { startTelemetry } from './telemetry';

startTelemetry(process.env.OTEL_SERVICE_NAME || 'activities-api');
