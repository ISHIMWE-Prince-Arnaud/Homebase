# WebSocket Implementation Guide

Complete guide to Homebase's real-time communication system using Socket.IO.

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    Socket.IO Gateway                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Connection Management:                                       │
│  • Auth via cookie (access_token)                            │
│  • Join room: `household:{id}`                                 │
│  • Disconnect cleanup                                         │
│                                                              │
│  Event Categories:                                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │  Household  │ │    Chores   │ │  Expenses   │            │
│  │  Events     │ │   Events    │ │   Events    │            │
│  ├─────────────┤ ├─────────────┤ ├─────────────┤            │
│  │ memberJoined│ │ created     │ │ created     │            │
│  │ memberLeft  │ │ updated     │ │ updated     │            │
│  │ deleted     │ │ completed   │ │ deleted     │            │
│  │ inviteRegen │ │ assigned    │ │ balanceUpdated│           │
│  │             │ │ deleted     │ │             │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │   Needs     │ │  Payments   │ │ Notifications│            │
│  │   Events    │ │   Events    │ │   Events     │            │
│  ├─────────────┤ ├─────────────┤ ├─────────────┤            │
│  │ itemAdded   │ │ recorded    │ │ new         │            │
│  │ itemUpdated │ │             │ │ read        │            │
│  │ itemPurchased│ │            │ │ allRead     │            │
│  │ expenseCreated│ │            │ │ deleted     │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Authentication Flow

### Cookie-Based Authentication

Unlike typical WebSocket implementations that use query parameters or headers, Homebase authenticates via the `access_token` httpOnly cookie sent automatically by the browser.

**Connection Process:**

```typescript
// Client side
const socket = io(API_URL, {
  withCredentials: true, // Essential for cookie transmission
});
```

```typescript
// Server side (WebSocketGateway)
@WebSocketGateway({
  cors: { origin: FRONTEND_URL, credentials: true }
})
export class RealtimeGateway {
  handleConnection(client: Socket) {
    // Extract JWT from cookie
    const token = client.handshake.headers.cookie
      ?.split(';')
      .find(c => c.trim().startsWith('access_token='))
      ?.split('=')[1];
    
    // Validate JWT and attach user to socket
    const user = this.jwtService.verify(token);
    client.data.user = user;
  }
}
```

### Security Considerations

1. **Always use `withCredentials: true`** on both client and server
2. **Validate JWT on every connection** - don't trust client-side state
3. **Check household membership** before allowing room joins
4. **Same CORS configuration** as REST API

## Event Reference

### Household Events

| Event | Payload | Trigger | Direction |
|-------|---------|---------|-----------|
| `household:memberJoined` | `{ userId: number, userName: string }` | User joins household | Server → Client |
| `household:memberLeft` | `{ userId: number }` | User leaves household | Server → Client |
| `household:deleted` | `{ householdId: number }` | Last member leaves | Server → Client |
| `household:inviteRegenerated` | `{ inviteCode: string }` | New invite code generated | Server → Client |

### Chore Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `chores:created` | `{ id, title, description, dueDate, assignedToId, householdId, isComplete, createdAt }` | New chore created |
| `chores:updated` | `{ id, ...updatedFields }` | Chore details changed |
| `chores:completed` | `{ id, isComplete: true, completedAt? }` | Marked complete/incomplete |
| `chores:deleted` | `{ id }` | Chore removed |
| `chores:assigned` | `{ id, assignedToId }` | Assignment changed |

### Expense Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `expenses:created` | Full expense object with participants | New expense added |
| `expenses:updated` | `{ id, ...updatedFields }` | Expense modified |
| `expenses:deleted` | `{ id }` | Expense removed |
| `expenses:balanceUpdated` | `{ reason: string, balances: Record<string, number> }` | Balance recalculated |

### Payment Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `payments:recorded` | Full payment object | Payment recorded |

### Need Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `needs:itemAdded` | Full need object | Item added to list |
| `needs:itemUpdated` | `{ id, ...updatedFields }` | Need modified |
| `needs:itemPurchased` | `{ id, isPurchased: true, purchasedById, purchasedAt }` | Marked as purchased |
| `needs:expenseCreated` | `{ expenseId, needIds: number[] }` | Auto-expense from purchase |

### Notification Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `notifications:new` | Full notification object | New notification created |
| `notifications:read` | `{ id }` or `{ all: true }` | Marked as read |
| `notifications:deleted` | `{ id }` | Notification removed |

## Client Connection Lifecycle

### Joining a Household Room

```typescript
// Client-side pattern
const socket = io(API_URL, { withCredentials: true });

// After authentication confirmed
socket.emit('join-household', householdId);

// Listen for events
socket.on('chores:created', (chore) => {
  // Handle new chore
});
```

### Server-Side Room Management

```typescript
@SubscribeMessage('join-household')
handleJoinHousehold(client: Socket, householdId: number) {
  // Verify user belongs to this household
  if (client.data.user.householdId !== householdId) {
    throw new WsException('Not a member of this household');
  }
  
  // Join the room
  client.join(`household:${householdId}`);
  
  return { status: 'joined', householdId };
}
```

### Automatic Cleanup

On disconnect, Socket.IO automatically removes the client from all rooms.

## Server-Side Broadcasting Patterns

### Broadcasting to Household

```typescript
// In RealtimeService
emitToHousehold(householdId: number, event: string, payload: any) {
  this.server.to(`household:${householdId}`).emit(event, payload);
}

// Usage in services
this.realtimeService.emitToHousehold(
  householdId,
  'chores:created',
  newChore
);
```

### Broadcasting to Specific User

```typescript
emitToUser(userId: number, event: string, payload: any) {
  // Find socket by user ID (requires tracking connections)
  const socketId = this.userSocketMap.get(userId);
  if (socketId) {
    this.server.to(socketId).emit(event, payload);
  }
}
```

### Excluding the Sender

```typescript
// When sender shouldn't receive their own broadcast
client.to(`household:${householdId}`).emit('event', payload);
```

## Error Handling & Reconnection

### Client-Side Reconnection Strategy

```typescript
const socket = io(API_URL, {
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

// Handle reconnection
socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
  // Re-join household room
  socket.emit('join-household', householdId);
});

socket.on('reconnect_error', (error) => {
  console.error('Reconnection error:', error);
});

socket.on('connect_error', (error) => {
  if (error.message === 'Authentication error') {
    // Redirect to login
    window.location.href = '/login';
  }
});
```

### Server-Side Error Handling

```typescript
@WebSocketGateway()
export class RealtimeGateway {
  handleConnection(client: Socket) {
    try {
      // Auth validation
    } catch (error) {
      client.disconnect(true); // Force disconnect on auth failure
    }
  }
  
  @SubscribeMessage('event')
  handleEvent(client: Socket, data: any) {
    try {
      // Process event
    } catch (error) {
      // Return error to client
      return { error: error.message };
    }
  }
}
```

## Testing WebSocket Events

### Unit Testing Gateway

```typescript
describe('RealtimeGateway', () => {
  let gateway: RealtimeGateway;
  let mockServer: any;
  let mockClient: any;
  
  beforeEach(() => {
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn()
    };
    mockClient = {
      join: jest.fn(),
      data: { user: { id: 1, householdId: 1 } }
    };
    gateway = new RealtimeGateway();
    gateway.server = mockServer;
  });
  
  it('should broadcast to household room', () => {
    gateway.emitToHousehold(1, 'test:event', { data: 'test' });
    expect(mockServer.to).toHaveBeenCalledWith('household:1');
    expect(mockServer.emit).toHaveBeenCalledWith('test:event', { data: 'test' });
  });
});
```

### E2E Testing with Socket.IO Client

```typescript
describe('WebSocket E2E', () => {
  let app: INestApplication;
  let socket: Socket;
  
  beforeAll(async () => {
    // Start test server
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(3001);
  });
  
  beforeEach(async () => {
    // Authenticate and get cookie
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@test.com', password: 'password' });
    
    const cookies = response.headers['set-cookie'];
    
    // Connect with cookie
    socket = io('http://localhost:3001', {
      extraHeaders: { cookie: cookies[0] }
    });
    
    await new Promise((resolve) => socket.on('connect', resolve));
  });
  
  it('should receive chore events', (done) => {
    socket.emit('join-household', 1);
    
    socket.on('chores:created', (chore) => {
      expect(chore.title).toBeDefined();
      done();
    });
    
    // Trigger event via API
    request(app.getHttpServer())
      .post('/chores')
      .set('Cookie', cookies)
      .send({ title: 'Test Chore', householdId: 1 });
  });
  
  afterAll(async () => {
    socket.close();
    await app.close();
  });
});
```

## Frontend Query Invalidation

Homebase uses TanStack Query with WebSocket events for automatic cache synchronization:

```typescript
// eventQueryMap.ts
export const eventQueryMap: Record<string, string[]> = {
  'chores:created': ['chores'],
  'chores:updated': ['chores'],
  'chores:completed': ['chores'],
  'chores:deleted': ['chores'],
  'expenses:created': ['expenses', 'balance', 'settlements'],
  'expenses:updated': ['expenses', 'balance'],
  'expenses:deleted': ['expenses', 'balance'],
  'expenses:balanceUpdated': ['balance', 'settlements'],
  'payments:recorded': ['payments', 'balance', 'settlements'],
  'needs:itemAdded': ['needs'],
  'needs:itemUpdated': ['needs'],
  'needs:itemPurchased': ['needs'],
  'notifications:new': ['notifications'],
};

// In RealtimeProvider
Object.entries(eventQueryMap).forEach(([event, queryKeys]) => {
  socket.on(event, () => {
    queryKeys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  });
});
```

## Performance Considerations

### Connection Limits

- Monitor active connections per server instance
- Consider horizontal scaling with Redis adapter for multi-instance deployments
- Implement connection limits per user to prevent abuse

### Payload Size

- Keep event payloads minimal (include IDs, not full objects when possible)
- Use query invalidation pattern instead of sending full updated state
- Compress large payloads if necessary

### Event Frequency

- Debounce rapid updates (e.g., typing indicators)
- Batch related events when possible
- Use appropriate rooms to limit broadcast scope

## Troubleshooting

### Connection Fails

1. **Check CORS configuration** - Must match REST API CORS settings exactly
2. **Verify cookie settings** - `withCredentials: true` required on both ends
3. **Check JWT expiry** - Expired tokens cause immediate disconnect
4. **Inspect network tab** - Look for WebSocket handshake failures

### Events Not Received

1. **Verify room membership** - Client must join `household:{id}` room
2. **Check event name spelling** - Case-sensitive, exact match required
3. **Inspect server logs** - Ensure server is emitting correctly
4. **Test with Socket.IO admin UI** - Use official debugging tools

### Performance Issues

1. **Implement room cleanup** - Ensure clients leave rooms when switching households
2. **Monitor connection count** - Too many connections per server causes degradation
3. **Check for memory leaks** - Ensure proper cleanup on disconnect

## Further Reading

- [Socket.IO Documentation](https://socket.io/docs/)
- [NestJS WebSocket Gateway](https://docs.nestjs.com/websockets/gateways)
- [Socket.IO Redis Adapter](https://socket.io/docs/v4/redis-adapter/) (for scaling)
