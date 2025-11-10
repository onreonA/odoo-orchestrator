# Monitoring & Observability Setup

## 🎯 Overview

Production ortamında uygulamanın sağlığını, performansını ve hatalarını izlemek için monitoring setup'ı.

## 📊 Monitoring Stack

### 1. Error Tracking

#### Sentry (Önerilen)

```bash
npm install @sentry/nextjs
```

**Setup:**

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  beforeSend(event, hint) {
    // Sensitive data filtering
    if (event.request) {
      delete event.request.cookies;
    }
    return event;
  },
});
```

```typescript
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

**Usage:**

```typescript
import * as Sentry from "@sentry/nextjs";

try {
  // Your code
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

#### Alternative: LogRocket

```bash
npm install logrocket
```

```typescript
import LogRocket from 'logrocket';

LogRocket.init(process.env.NEXT_PUBLIC_LOGROCKET_APP_ID);
```

### 2. Performance Monitoring

#### Vercel Analytics (Vercel kullanıyorsanız)

Otomatik olarak aktif. Dashboard'dan görüntülenebilir.

#### Custom Performance Monitoring

```typescript
// lib/utils/performance.ts
export function measurePerformance(name: string, fn: () => Promise<any>) {
  return async (...args: any[]) => {
    const start = performance.now();
    try {
      const result = await fn(...args);
      const duration = performance.now() - start;
      
      // Log to analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'performance', {
          name,
          duration,
        });
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`Performance error for ${name}:`, error);
      throw error;
    }
  };
}
```

### 3. Database Monitoring

#### Supabase Dashboard

- Supabase Dashboard > Database > Performance
- Query performance metrics
- Connection pool monitoring
- Index usage statistics

#### Custom Query Monitoring

```typescript
// lib/utils/db-monitor.ts
export async function monitorQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await queryFn();
    const duration = Date.now() - start;
    
    // Log slow queries
    if (duration > 1000) {
      console.warn(`Slow query: ${queryName} took ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`Query error: ${queryName} failed after ${duration}ms`, error);
    throw error;
  }
}
```

### 4. Uptime Monitoring

#### UptimeRobot (Free)

1. [UptimeRobot](https://uptimerobot.com/) hesabı oluştur
2. New Monitor ekle:
   - Type: HTTP(s)
   - URL: `https://your-domain.com/api/health`
   - Interval: 5 minutes
   - Alert contacts: Email/SMS

#### Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Check database connection
    const supabase = await createClient();
    const { error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error && error.code !== 'PGRST116') {
      return NextResponse.json(
        { status: 'unhealthy', database: 'error' },
        { status: 503 }
      );
    }
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'Internal error' },
      { status: 503 }
    );
  }
}
```

### 5. Logging

#### Structured Logging

```typescript
// lib/utils/logger.ts
type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

export function log(level: LogLevel, message: string, context?: Record<string, any>) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };
  
  // In production, send to logging service
  if (process.env.NODE_ENV === 'production') {
    // Send to logging service (e.g., Logtail, Datadog)
    fetch(process.env.LOGGING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    }).catch(console.error);
  } else {
    console[level](entry);
  }
}

export const logger = {
  info: (message: string, context?: Record<string, any>) => log('info', message, context),
  warn: (message: string, context?: Record<string, any>) => log('warn', message, context),
  error: (message: string, context?: Record<string, any>) => log('error', message, context),
};
```

#### API Request Logging

```typescript
// middleware.ts (extend existing)
export async function middleware(request: NextRequest) {
  const start = Date.now();
  
  // ... existing middleware code ...
  
  const response = NextResponse.next();
  const duration = Date.now() - start;
  
  // Log API requests
  if (request.nextUrl.pathname.startsWith('/api')) {
    logger.info('API Request', {
      method: request.method,
      path: request.nextUrl.pathname,
      status: response.status,
      duration,
    });
  }
  
  return response;
}
```

## 🔔 Alerting

### Email Alerts

```typescript
// lib/utils/alerts.ts
export async function sendAlert(
  severity: 'low' | 'medium' | 'high' | 'critical',
  message: string,
  context?: Record<string, any>
) {
  // Send email via your email service
  // Example: SendGrid, Resend, etc.
  
  const emailBody = `
    Severity: ${severity}
    Message: ${message}
    Context: ${JSON.stringify(context, null, 2)}
    Time: ${new Date().toISOString()}
  `;
  
  // Implement email sending
}
```

### Slack/Discord Webhooks

```typescript
export async function sendSlackAlert(message: string, context?: Record<string, any>) {
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: message,
      attachments: [
        {
          color: 'danger',
          fields: Object.entries(context || {}).map(([key, value]) => ({
            title: key,
            value: String(value),
            short: true,
          })),
        },
      ],
    }),
  });
}
```

## 📈 Metrics Dashboard

### Custom Dashboard (Örnek)

```typescript
// app/api/metrics/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  
  // Get metrics
  const [
    { count: companies },
    { count: projects },
    { count: users },
    { count: activeUsers },
  ] = await Promise.all([
    supabase.from('companies').select('count', { count: 'exact', head: true }),
    supabase.from('projects').select('count', { count: 'exact', head: true }),
    supabase.from('profiles').select('count', { count: 'exact', head: true }),
    supabase.from('profiles').select('count', { count: 'exact', head: true }).gt('last_login', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);
  
  return NextResponse.json({
    companies: companies || 0,
    projects: projects || 0,
    users: users || 0,
    activeUsers: activeUsers || 0,
  });
}
```

## 🚀 Quick Start

1. **Error Tracking Setup:**
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```

2. **Health Check:**
   - `/api/health` endpoint'ini test et
   - UptimeRobot'a ekle

3. **Logging:**
   - Environment variable'ları ayarla
   - Logger'ı kullanmaya başla

4. **Monitoring Dashboard:**
   - Sentry dashboard'u kur
   - Vercel Analytics'i aktif et
   - Custom metrics endpoint'ini oluştur

## 📚 Resources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Supabase Monitoring](https://supabase.com/docs/guides/platform/metrics)

