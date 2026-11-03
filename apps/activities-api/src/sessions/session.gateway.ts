import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { DomainError } from '../common/domain-error';
import type { AuthUser } from '../auth/auth-user';
import { TokenVerifier } from '../auth/token-verifier';
import { MetricsService } from '../telemetry/metrics.service';
import { presentSession } from './domain/present-session';
import { SessionService } from './session.service';

type ClientEvent = { code?: string; questionId?: string; value?: boolean };

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class SessionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(SessionGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly sessions: SessionService,
    private readonly tokens: TokenVerifier,
    private readonly metrics: MetricsService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const raw = client.handshake.auth?.token || client.handshake.headers.authorization || '';
      const token = String(raw).replace(/^Bearer\s+/i, '');
      client.data.user = await this.tokens.verify(token);
      this.metrics.socket(1);
    } catch (error) {
      client.emit('game.error', this.publicError(error, 'Inicia sesión para entrar a la sala.'));
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    if (client.data.user) this.metrics.socket(-1);
  }

  @SubscribeMessage('session.watch')
  async watch(@ConnectedSocket() client: Socket, @MessageBody() body: ClientEvent) {
    try {
      const user = this.user(client);
      await this.sessions.assertWatch(body.code || '', user.id);
      await client.join(this.room(body.code || ''));
      client.emit('session.state', await this.sessions.present(body.code || '', user.id));
    } catch (error) {
      client.emit('game.error', this.publicError(error));
    }
  }

  @SubscribeMessage('session.join')
  async join(@ConnectedSocket() client: Socket, @MessageBody() body: ClientEvent) {
    const room = this.room(body.code || '');
    try {
      const user = this.user(client);
      await client.join(room);
      await this.sessions.join(body.code || '', user);
    } catch (error) {
      await client.leave(room);
      client.emit('game.error', this.publicError(error));
    }
  }

  @SubscribeMessage('answer.submit')
  async submit(@ConnectedSocket() client: Socket, @MessageBody() body: ClientEvent) {
    try {
      const user = this.user(client);
      await this.sessions.answer(body.code || '', user.id, body.questionId || '', Boolean(body.value));
    } catch (error) {
      client.emit('game.error', this.publicError(error));
    }
  }

  @SubscribeMessage('host.start')
  start(@ConnectedSocket() client: Socket, @MessageBody() body: ClientEvent) {
    return this.host(client, body, (code, userId) => this.sessions.start(code, userId));
  }

  @SubscribeMessage('host.close')
  close(@ConnectedSocket() client: Socket, @MessageBody() body: ClientEvent) {
    return this.host(client, body, (code, userId) => this.sessions.close(code, userId));
  }

  @SubscribeMessage('host.next')
  next(@ConnectedSocket() client: Socket, @MessageBody() body: ClientEvent) {
    return this.host(client, body, (code, userId) => this.sessions.next(code, userId));
  }

  @SubscribeMessage('host.finish')
  finish(@ConnectedSocket() client: Socket, @MessageBody() body: ClientEvent) {
    return this.host(client, body, (code, userId) => this.sessions.finish(code, userId));
  }

  @OnEvent('realtime.publish')
  async publish(code: string): Promise<void> {
    if (!this.server) return;
    try {
      const snapshot = await this.sessions.loadSnapshot(code);
      const sockets = await this.server.in(this.room(code)).fetchSockets();
      for (const socket of sockets) {
        const user = socket.data.user as AuthUser | undefined;
        if (!user) continue;
        socket.emit('session.state', presentSession(snapshot, user.id));
      }
    } catch (error) {
      this.logger.warn(`No se pudo publicar la sala ${code}`);
    }
  }

  private async host(
    client: Socket,
    body: ClientEvent,
    action: (code: string, userId: string) => Promise<unknown>,
  ) {
    try {
      const user = this.user(client);
      await action(body.code || '', user.id);
    } catch (error) {
      client.emit('game.error', this.publicError(error));
    }
  }

  private user(client: Socket): AuthUser {
    const user = client.data.user as AuthUser | undefined;
    if (!user) throw new DomainError('UNAUTHORIZED', 'Inicia sesión para entrar a la sala.', 401);
    return user;
  }

  private room(code: string): string {
    return `session:${(code || '').trim().toUpperCase()}`;
  }

  private publicError(error: unknown, fallback = 'No se pudo completar la acción en la sala.') {
    if (error instanceof DomainError) return { code: error.code, message: error.message };
    return { code: 'INTERNAL', message: fallback };
  }
}
