import asyncio
import asyncpg

async def setup_test_db():
    # Connect to default postgres database to create test database
    conn = await asyncpg.connect('postgresql://postgres:aw2555@localhost:5432/postgres')

    # Check if test database exists
    exists = await conn.fetchval(
        "SELECT 1 FROM pg_database WHERE datname = 'authz_authn_test_db'"
    )

    if not exists:
        await conn.execute('CREATE DATABASE authz_authn_test_db')
        print("Created database authz_authn_test_db")
    else:
        print("Database authz_authn_test_db already exists")

    await conn.close()

    # Now connect to the test database and create the schema
    conn = await asyncpg.connect('postgresql://postgres:aw2555@localhost:5432/authz_authn_test_db')

    # Check if tables exist
    tables = await conn.fetchval(
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
    )

    if tables == 0:
        # Create extensions
        await conn.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")
        await conn.execute("CREATE EXTENSION IF NOT EXISTS \"pgcrypto\"")

        # Create events table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS events (
                event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                event_version BIGINT NOT NULL DEFAULT 1,
                entity_id UUID NOT NULL,
                entity_type VARCHAR(100) NOT NULL,
                event_type VARCHAR(100) NOT NULL,
                event_category VARCHAR(50) NOT NULL,
                payload JSONB NOT NULL,
                previous_payload JSONB,
                actor_id UUID NOT NULL,
                actor_role VARCHAR(50) NOT NULL,
                actor_username VARCHAR(255) NOT NULL,
                correlation_id UUID,
                causation_id UUID,
                timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                context JSONB,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                created_at_timestamptid TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT events_immutable CHECK (
                    created_at = created_at_timestamptid AND
                    event_version = 1
                )
            )
        """)

        # Create audit_logs table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                actor_id UUID NOT NULL,
                actor_role VARCHAR(50) NOT NULL,
                actor_username VARCHAR(255) NOT NULL,
                action VARCHAR(100) NOT NULL,
                resource_type VARCHAR(100) NOT NULL,
                resource_id UUID,
                scope_granted VARCHAR(100),
                request_id UUID,
                request_path VARCHAR(500),
                request_method VARCHAR(10),
                user_agent TEXT,
                ip_address INET,
                success BOOLEAN NOT NULL,
                error_message TEXT,
                status_code INTEGER,
                timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                context JSONB,
                CONSTRAINT audit_immutable CHECK (timestamp = CURRENT_TIMESTAMP)
            )
        """)

        # Create data_entries table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS data_entries (
                entry_id UUID PRIMARY KEY,
                data JSONB NOT NULL,
                status VARCHAR(50) NOT NULL,
                created_by UUID NOT NULL,
                created_by_role VARCHAR(50) NOT NULL,
                created_by_username VARCHAR(255) NOT NULL,
                submitted_at TIMESTAMP WITH TIME ZONE,
                confirmed_by UUID,
                confirmed_at TIMESTAMP WITH TIME ZONE,
                confirmed_by_username VARCHAR(255),
                rejected_by UUID,
                rejected_at TIMESTAMP WITH TIME ZONE,
                rejected_by_username VARCHAR(255),
                rejected_reason TEXT,
                correction_count INTEGER DEFAULT 0,
                last_corrected_at TIMESTAMP WITH TIME ZONE,
                last_corrected_by UUID,
                last_corrected_by_username VARCHAR(255),
                version BIGINT NOT NULL DEFAULT 1,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CHECK (
                    status IN ('draft', 'submitted', 'confirmed', 'rejected', 'corrected')
                )
            )
        """)

        # Create projections table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS projections (
                projection_name VARCHAR(255) PRIMARY KEY,
                last_processed_event_id UUID NOT NULL,
                last_processed_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)

        print("Created tables")
    else:
        print(f"Tables already exist ({tables} tables found)")

    await conn.close()
    print("Database setup complete!")

asyncio.run(setup_test_db())
