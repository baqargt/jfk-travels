from logging.config import fileConfig
import time

from sqlalchemy import engine_from_config, pool

from alembic import context
from app import models  # noqa: F401
from app.config import settings
from app.database import Base

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)
if config.config_file_name is not None:
    fileConfig(config.config_file_name)
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=settings.database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    # Docker DNS/network can lag on container start; retry instead of crash-looping.
    max_attempts = 15
    delay_seconds = 2
    last_error: Exception | None = None

    for attempt in range(1, max_attempts + 1):
        connectable = engine_from_config(
            config.get_section(config.config_ini_section, {}),
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
        )
        try:
            with connectable.connect() as connection:
                context.configure(
                    connection=connection,
                    target_metadata=target_metadata,
                    compare_type=True,
                )
                with context.begin_transaction():
                    context.run_migrations()
                return
        except Exception as exc:  # noqa: BLE001 - retry transient docker DNS/connect failures
            last_error = exc
            if attempt >= max_attempts:
                break
            time.sleep(delay_seconds)

    assert last_error is not None
    raise last_error


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
