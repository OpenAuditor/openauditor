# WebSocket Security

WebSockets are long-lived, bidirectional connections. They bypass many traditional HTTP security controls and require explicit auth and validation.

---

## Authentication

HTTP middleware doesn't automatically protect WebSocket connections. You must authenticate at connection time.

```javascript
// Node.js / ws library
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws, req) => {
  // Extract token from query param or header
  const url = new URL(req.url, 'http://localhost');
  const token = url.searchParams.get('token');
  
  if (!token) {
    ws.close(4001, 'Authentication required');
    return;
  }
  
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET!);
    ws.userId = user.id; // attach user to connection
  } catch {
    ws.close(4001, 'Invalid token');
    return;
  }
  
  ws.on('message', (data) => {
    // ws.userId is always set here
    handleMessage(ws.userId, data);
  });
});
```

---

## Message Validation

Every message received over a WebSocket is user input and must be validated.

```javascript
ws.on('message', (data) => {
  let message;
  
  // Parse safely
  try {
    message = JSON.parse(data.toString());
  } catch {
    ws.send(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }
  
  // Validate schema
  const result = MessageSchema.safeParse(message);
  if (!result.success) {
    ws.send(JSON.stringify({ error: 'Invalid message format' }));
    return;
  }
  
  // Authorise the action
  if (!canPerformAction(ws.userId, result.data.action)) {
    ws.send(JSON.stringify({ error: 'Forbidden' }));
    return;
  }
  
  handleValidMessage(ws.userId, result.data);
});
```

---

## Origin Validation

WebSocket handshakes don't enforce CORS — you must check the `Origin` header yourself.

```javascript
const wss = new WebSocketServer({
  port: 8080,
  verifyClient: ({ req }, cb) => {
    const origin = req.headers.origin;
    const allowedOrigins = ['https://yourapp.com', 'https://www.yourapp.com'];
    
    if (!origin || !allowedOrigins.includes(origin)) {
      cb(false, 403, 'Forbidden');
      return;
    }
    
    cb(true);
  },
});
```

---

## Rate Limiting WebSocket Messages

```javascript
const messageCount = new Map<string, number>();

ws.on('message', (data) => {
  const now = Date.now();
  const key = `${ws.userId}:${Math.floor(now / 1000)}`; // per second
  const count = (messageCount.get(key) || 0) + 1;
  messageCount.set(key, count);
  
  if (count > 20) { // max 20 messages per second
    ws.send(JSON.stringify({ error: 'Rate limit exceeded' }));
    return;
  }
  
  // process message
});
```

---

## Checklist

- [ ] WebSocket connections authenticated on connect
- [ ] Token verified server-side (not just client-side)
- [ ] Origin header validated on handshake
- [ ] All messages validated with schema validation
- [ ] Actions authorised per-user
- [ ] Rate limiting on messages per connection
- [ ] Connections closed after auth failure
- [ ] WebSocket connections use WSS (not WS) in production

---

## Learn More

- [Auth Best Practices](./auth-best-practices.md)
- [Input Validation](./input-validation.md)
