import { Injectable } from '@nestjs/common';
import { metrics, type Counter, type UpDownCounter } from '@opentelemetry/api';

@Injectable()
export class MetricsService {
  private readonly answers: Counter;
  private readonly sessions: Counter;
  private readonly sockets: UpDownCounter;

  constructor() {
    const meter = metrics.getMeter('activities-api');
    this.answers = meter.createCounter('profelink_answers_total', {
      description: 'Respuestas procesadas por la partida',
    });
    this.sessions = meter.createCounter('profelink_sessions_started_total', {
      description: 'Partidas iniciadas',
    });
    this.sockets = meter.createUpDownCounter('profelink_ws_connections', {
      description: 'Conexiones de sala activas',
    });
  }

  answer(result: string): void {
    this.answers.add(1, { result, service_name: 'activities-api' });
  }

  sessionStarted(): void {
    this.sessions.add(1, { service_name: 'activities-api' });
  }

  socket(delta: number): void {
    this.sockets.add(delta, { service_name: 'activities-api' });
  }
}
