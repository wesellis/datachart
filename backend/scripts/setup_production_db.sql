-- Production Database Setup for DataChart SaaS
-- Run this as PostgreSQL superuser to set up production database

-- Create database user
CREATE USER DataChart_user WITH PASSWORD 'secure_password_change_me';

-- Create database
CREATE DATABASE datachart_prod OWNER DataChart_user;

-- Grant privileges to the user
GRANT ALL PRIVILEGES ON DATABASE datachart_prod TO DataChart_user;

-- Connect to the database
\c datachart_prod;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO DataChart_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO DataChart_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO DataChart_user;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- For full-text search
CREATE EXTENSION IF NOT EXISTS "btree_gin";  -- For performance

-- Set timezone
ALTER DATABASE datachart_prod SET timezone TO 'UTC';

-- Performance tuning
ALTER DATABASE datachart_prod SET shared_preload_libraries TO 'pg_stat_statements';

-- Security settings
REVOKE ALL ON DATABASE datachart_prod FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;

COMMENT ON DATABASE datachart_prod IS 'DataChart SaaS Production Database';

-- Create backup user for maintenance
CREATE USER DataChart_backup WITH PASSWORD 'backup_password_change_me';
GRANT CONNECT ON DATABASE datachart_prod TO DataChart_backup;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO DataChart_backup;