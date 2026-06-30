# DataChart SaaS - API Documentation

**Version**: 1.0.0  
**Base URL**: `https://api.datachart.app`  
**Authentication**: Bearer Token (JWT)

## Overview

The DataChart SaaS API provides comprehensive access to enterprise Application Performance Management (APM) data through direct integrations with Snowflake, Azure, ServiceNow, and other enterprise data sources. This API enables customers to build custom dashboards, extract data for reporting, and integrate APM insights into their existing workflows.

## Authentication

All API requests require authentication using a Bearer token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

### Getting an Access Token

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@company.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "user-uuid",
    "email": "user@company.com",
    "tenant_id": "tenant-uuid",
    "tier": "professional"
  }
}
```

## Rate Limits

API requests are rate-limited based on your subscription tier:

- **Starter**: 1,000 requests/hour
- **Professional**: 5,000 requests/hour  
- **Enterprise**: 20,000 requests/hour

Rate limit headers are included in every response:

```http
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4999
X-RateLimit-Reset: 1640995200
```

## Data Sources API

### Snowflake Integration

#### Execute Snowflake Query

```http
POST /api/v1/data-sources/snowflake/query
Content-Type: application/json
Authorization: Bearer <token>

{
  "query": "SELECT * FROM monitoring.system_metrics WHERE timestamp >= '2024-01-01'",
  "parameters": {},
  "limit": 1000
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "cpu_usage": 65.2,
      "memory_usage": 78.5,
      "server_name": "web-01"
    }
  ],
  "metadata": {
    "row_count": 1,
    "execution_time_ms": 234,
    "columns": ["timestamp", "cpu_usage", "memory_usage", "server_name"]
  }
}
```

#### Get Available Databases

```http
GET /api/v1/data-sources/snowflake/databases
```

**Response:**
```json
{
  "databases": [
    {
      "name": "MONITORING",
      "schemas": [
        {
          "name": "SYSTEM_METRICS",
          "tables": [
            {
              "name": "CPU_METRICS",
              "columns": ["timestamp", "server_name", "cpu_percent", "load_avg"]
            },
            {
              "name": "MEMORY_METRICS", 
              "columns": ["timestamp", "server_name", "memory_used", "memory_total"]
            }
          ]
        }
      ]
    }
  ]
}
```

### Azure Integration

#### Get Azure Cost Analysis

```http
GET /api/v1/data-sources/azure/cost-analysis
Query Parameters:
- start_date: 2024-01-01
- end_date: 2024-01-31
- granularity: daily|monthly
- group_by: resource_group|service_name|location
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_cost": 12543.67,
    "currency": "USD",
    "period": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    },
    "breakdown": [
      {
        "date": "2024-01-01",
        "cost": 412.34,
        "services": [
          {
            "name": "Virtual Machines",
            "cost": 245.67,
            "usage_quantity": 720,
            "usage_unit": "hours"
          }
        ]
      }
    ]
  }
}
```

#### Get Azure Resource Inventory

```http
GET /api/v1/data-sources/azure/resources
Query Parameters:
- subscription_id: optional
- resource_group: optional
- resource_type: optional
```

**Response:**
```json
{
  "success": true,
  "data": {
    "resources": [
      {
        "id": "/subscriptions/abc-123/resourceGroups/prod-rg/providers/Microsoft.Compute/virtualMachines/web-01",
        "name": "web-01",
        "type": "Microsoft.Compute/virtualMachines",
        "location": "East US",
        "resource_group": "prod-rg",
        "tags": {
          "Environment": "Production",
          "Owner": "WebTeam"
        },
        "properties": {
          "vm_size": "Standard_D2s_v3",
          "power_state": "running"
        }
      }
    ],
    "total_count": 1
  }
}
```

### ServiceNow Integration

#### Get Incidents

```http
GET /api/v1/data-sources/servicenow/incidents
Query Parameters:
- state: new|in_progress|resolved|closed
- priority: 1|2|3|4|5
- assigned_to: user_id
- created_since: 2024-01-01T00:00:00Z
- limit: 100
```

**Response:**
```json
{
  "success": true,
  "data": {
    "incidents": [
      {
        "sys_id": "abc123",
        "number": "INC0010001",
        "short_description": "Web server not responding",
        "description": "Users unable to access main website",
        "state": "in_progress",
        "priority": 2,
        "urgency": 2,
        "impact": 2,
        "assigned_to": {
          "name": "John Doe",
          "email": "john.doe@company.com"
        },
        "opened_at": "2024-01-15T09:30:00Z",
        "resolved_at": null,
        "category": "Infrastructure",
        "subcategory": "Web Services"
      }
    ],
    "total_count": 1
  }
}
```

#### Get Change Requests

```http
GET /api/v1/data-sources/servicenow/changes
Query Parameters:
- state: draft|requested|authorized|scheduled|implement|review|closed
- risk: high|medium|low
- start_date: 2024-01-01
- end_date: 2024-01-31
```

## Dashboard API

### Get Dashboard Data

```http
GET /api/v1/dashboard/data
Query Parameters:
- time_range: 1h|6h|24h|7d|30d
- metrics: cpu,memory,disk,network (comma-separated)
- include_trends: true|false
```

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-01-15T15:30:00Z",
    "time_range": "24h",
    "summary": {
      "total_servers": 25,
      "healthy_servers": 23,
      "warning_servers": 2,
      "critical_servers": 0,
      "average_cpu": 42.3,
      "average_memory": 67.8
    },
    "metrics": {
      "cpu": {
        "current": 42.3,
        "trend": "stable",
        "history": [
          {"timestamp": "2024-01-15T14:30:00Z", "value": 41.2},
          {"timestamp": "2024-01-15T15:00:00Z", "value": 43.1},
          {"timestamp": "2024-01-15T15:30:00Z", "value": 42.3}
        ]
      }
    },
    "alerts": [
      {
        "id": "alert-123",
        "severity": "warning",
        "message": "High memory usage on server web-03",
        "timestamp": "2024-01-15T15:25:00Z",
        "acknowledged": false
      }
    ]
  }
}
```

### Get Executive Dashboard

```http
GET /api/v1/dashboard/executive
Query Parameters:
- period: week|month|quarter|year
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "month",
    "kpis": {
      "system_availability": {
        "value": 99.87,
        "unit": "percent",
        "trend": "up",
        "target": 99.9
      },
      "mean_response_time": {
        "value": 245,
        "unit": "milliseconds", 
        "trend": "stable",
        "target": 200
      },
      "incident_count": {
        "value": 12,
        "unit": "incidents",
        "trend": "down",
        "target": 10
      }
    },
    "charts": {
      "availability_trend": [
        {"date": "2024-01-01", "availability": 99.95},
        {"date": "2024-01-02", "availability": 99.89}
      ],
      "cost_breakdown": [
        {"category": "Compute", "cost": 8543.21},
        {"category": "Storage", "cost": 2103.45}
      ]
    }
  }
}
```

## Customer Management API

### Get Customer Information

```http
GET /api/v1/customers/me
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "customer-uuid",
    "name": "Acme Corporation",
    "email": "admin@acme.com",
    "tenant_id": "tenant-uuid",
    "subscription": {
      "tier": "professional",
      "status": "active",
      "billing_cycle": "monthly",
      "current_period_start": "2024-01-01T00:00:00Z",
      "current_period_end": "2024-02-01T00:00:00Z",
      "amount": 7000
    },
    "api_usage": {
      "current_month": 2543,
      "limit": 5000,
      "percentage_used": 50.86
    },
    "integrations": [
      {
        "type": "snowflake",
        "status": "connected",
        "last_sync": "2024-01-15T15:00:00Z"
      },
      {
        "type": "azure",
        "status": "connected", 
        "last_sync": "2024-01-15T14:45:00Z"
      }
    ]
  }
}
```

### Update Integration Credentials

```http
PUT /api/v1/customers/integrations/{integration_type}
Content-Type: application/json

{
  "credentials": {
    "account": "your_account",
    "username": "your_username", 
    "password": "your_password",
    "warehouse": "your_warehouse",
    "database": "your_database"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Integration credentials updated successfully",
  "integration": {
    "type": "snowflake",
    "status": "connected",
    "last_test": "2024-01-15T15:30:00Z",
    "test_result": "success"
  }
}
```

## Billing API

### Get Billing Information

```http
GET /api/v1/billing/current
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "sub_abc123",
      "tier": "professional",
      "status": "active",
      "amount": 7000,
      "currency": "USD",
      "billing_cycle": "monthly"
    },
    "current_usage": {
      "api_calls": 2543,
      "overage_calls": 0,
      "overage_cost": 0
    },
    "next_bill": {
      "amount": 7000,
      "date": "2024-02-01",
      "includes_overage": false
    },
    "payment_method": {
      "type": "card",
      "last_four": "4242",
      "expires": "12/2026"
    }
  }
}
```

### Get Usage History

```http
GET /api/v1/billing/usage
Query Parameters:
- start_date: 2024-01-01
- end_date: 2024-01-31
- granularity: daily|weekly|monthly
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    },
    "usage": [
      {
        "date": "2024-01-01",
        "api_calls": 156,
        "endpoints": {
          "/api/v1/data-sources/snowflake/query": 89,
          "/api/v1/dashboard/data": 45,
          "/api/v1/data-sources/azure/cost-analysis": 22
        }
      }
    ],
    "summary": {
      "total_api_calls": 2543,
      "daily_average": 82.0,
      "peak_day": "2024-01-15",
      "peak_usage": 234
    }
  }
}
```

## Monitoring API

### Get System Health

```http
GET /api/v1/monitoring/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T15:30:00Z",
  "services": {
    "database": {
      "status": "healthy",
      "response_time_ms": 45.2,
      "details": {
        "active_connections": 12,
        "slow_queries": 0
      }
    },
    "redis": {
      "status": "healthy",
      "response_time_ms": 2.1,
      "details": {
        "connected_clients": 8,
        "used_memory": "256MB"
      }
    },
    "elasticsearch": {
      "status": "healthy",
      "response_time_ms": 89.3,
      "details": {
        "cluster_status": "green",
        "active_shards": 15
      }
    }
  },
  "summary": {
    "total_services": 3,
    "healthy": 3,
    "degraded": 0,
    "unhealthy": 0
  }
}
```

### Get Active Alerts

```http
GET /api/v1/monitoring/alerts
Query Parameters:
- severity: low|medium|high|critical
- resolved: true|false
- limit: 50
```

**Response:**
```json
{
  "alerts": [
    {
      "id": "alert-123",
      "metric_name": "api_response_time",
      "severity": "medium",
      "message": "High API response time for /api/v1/data-sources/snowflake/query",
      "value": 2.5,
      "threshold": 2.0,
      "timestamp": "2024-01-15T15:25:00Z",
      "tenant_id": "tenant-uuid",
      "resolved": false,
      "acknowledged": false
    }
  ],
  "total_count": 1,
  "filtered_count": 1
}
```

## Error Handling

All API endpoints return consistent error responses:

### Error Response Format

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request is invalid",
    "details": "Missing required parameter 'query'",
    "timestamp": "2024-01-15T15:30:00Z",
    "request_id": "req_abc123"
  }
}
```

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized 
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests (Rate Limited)
- `500` - Internal Server Error
- `503` - Service Unavailable

### Common Error Codes

| Code | Description |
|------|-------------|
| `INVALID_REQUEST` | Request is malformed or missing required parameters |
| `UNAUTHORIZED` | Authentication token is missing or invalid |
| `FORBIDDEN` | User doesn't have permission for this action |
| `RATE_LIMITED` | API rate limit exceeded |
| `INTEGRATION_ERROR` | Error connecting to external data source |
| `QUOTA_EXCEEDED` | Monthly API quota exceeded |
| `INVALID_CREDENTIALS` | Data source credentials are invalid |
| `QUERY_ERROR` | Error executing database query |
| `INTERNAL_ERROR` | Unexpected server error |

## SDKs and Libraries

### Python SDK

```bash
pip install datachart-sdk
```

```python
from datachart import DataChartClient

client = DataChartClient(
    api_key="your_api_key",
    base_url="https://api.datachart.app"
)

# Execute Snowflake query
result = client.snowflake.query(
    query="SELECT * FROM monitoring.system_metrics LIMIT 10"
)

# Get dashboard data
dashboard = client.dashboard.get_data(time_range="24h")
```

### JavaScript SDK

```bash
npm install @DataChart/chart-sdk
```

```javascript
import { DataChartClient } from '@DataChart/chart-sdk';

const client = new DataChartClient({
  apiKey: 'your_api_key',
  baseURL: 'https://api.datachart.app'
});

// Get Azure cost analysis
const costs = await client.azure.getCostAnalysis({
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  granularity: 'daily'
});
```

## Webhooks

DataChart can send webhook notifications for important events:

### Webhook Events

- `alert.created` - New alert generated
- `alert.resolved` - Alert resolved
- `integration.connected` - Data source connected
- `integration.failed` - Data source connection failed
- `quota.warning` - API quota at 80% usage
- `quota.exceeded` - API quota exceeded

### Webhook Payload Example

```json
{
  "event": "alert.created",
  "timestamp": "2024-01-15T15:30:00Z",
  "tenant_id": "tenant-uuid",
  "data": {
    "alert": {
      "id": "alert-123",
      "severity": "high",
      "message": "High CPU usage detected",
      "value": 95.2,
      "threshold": 90.0
    }
  }
}
```

### Configuring Webhooks

```http
POST /api/v1/webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/DataChart",
  "events": ["alert.created", "alert.resolved"],
  "secret": "your_webhook_secret"
}
```

## API Changelog

### Version 1.0.0 (Current)
- Initial API release
- Snowflake, Azure, ServiceNow integrations
- Dashboard and monitoring endpoints
- Customer management and billing APIs

## Support

For API support and questions:

- **Documentation**: https://docs.datachart.app
- **Support Email**: api-support@datachart.app
- **Status Page**: https://status.datachart.app
- **Community Forum**: https://community.datachart.app