from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker
from sqlalchemy import String, Text, DateTime, ForeignKey, JSON, Boolean, Integer, UniqueConstraint
from datetime import datetime, timezone
import uuid
from .config import settings

is_sqlite = settings.sqlalchemy_url.startswith("sqlite")
pg_connect_args = {"keepalives": 1, "keepalives_idle": 25, "keepalives_interval": 10, "keepalives_count": 3, "connect_timeout": 15}
connect_args = {"check_same_thread": False} if is_sqlite else pg_connect_args
ro_connect_args = {"check_same_thread": False} if settings.readonly_sqlalchemy_url.startswith("sqlite") else pg_connect_args
engine = create_engine(
    settings.sqlalchemy_url,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=-1 if is_sqlite else 1800,
    connect_args=connect_args,
)
ro_engine = create_engine(
    settings.readonly_sqlalchemy_url,
    pool_size=15,
    max_overflow=25,
    pool_pre_ping=True,
    pool_recycle=-1 if settings.readonly_sqlalchemy_url.startswith("sqlite") else 1800,
    connect_args=ro_connect_args,
)

@event.listens_for(engine, "connect")
@event.listens_for(ro_engine, "connect")
def setup_sqlite_functions(dbapi_conn, conn_record):
    if type(dbapi_conn).__module__.startswith("sqlite3"):
        def to_char(val, fmt):
            if not val: return ''
            if isinstance(val, str):
                try: val = datetime.fromisoformat(val[:19])
                except: return str(val)
            return val.strftime('%d %b')
        dbapi_conn.create_function("TO_CHAR", 2, to_char)
        dbapi_conn.create_function("GREATEST", -1, lambda *args: max(a for a in args if a is not None))

SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

class Conversation(Base):
    __tablename__ = "conversations"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(200), default="New logistics chat")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.id")

class Message(Base):
    __tablename__ = "messages"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(String(20))
    content: Mapped[str] = mapped_column(Text)
    steps: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    conversation = relationship("Conversation", back_populates="messages")

class DockRecommendationApproval(Base):
    __tablename__ = "dock_allocation_approvals"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    reference_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    recommended_facility: Mapped[str] = mapped_column(String(64))
    priority_tier: Mapped[str] = mapped_column(String(32))
    decision: Mapped[str] = mapped_column(String(20))
    reviewed_by: Mapped[str] = mapped_column(String(120))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Role(Base):
    __tablename__ = "roles"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    role_name: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    description: Mapped[str] = mapped_column(String(255))
    users = relationship("User", back_populates="role")
    role_permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")


class Permission(Base):
    __tablename__ = "permissions"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    permission_key: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    permission_name: Mapped[str] = mapped_column(String(150))
    module_name: Mapped[str] = mapped_column(String(100))
    role_permissions = relationship("RolePermission", back_populates="permission", cascade="all, delete-orphan")


class RolePermission(Base):
    __tablename__ = "role_permissions"
    __table_args__ = (UniqueConstraint("role_id", "permission_id", name="uq_role_permission"),)
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id", ondelete="CASCADE"))
    permission_id: Mapped[int] = mapped_column(ForeignKey("permissions.id", ondelete="CASCADE"))
    role = relationship("Role", back_populates="role_permissions")
    permission = relationship("Permission", back_populates="role_permissions")


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    employee_id: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(150))
    username: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(150), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"))
    department: Mapped[str] = mapped_column(String(100), default="Logistics")
    plant_id: Mapped[str] = mapped_column(String(40), default="ALL")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    failed_attempts: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    role = relationship("Role", back_populates="users")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(100))
    module_name: Mapped[str] = mapped_column(String(100))
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)


class PipelineRun(Base):
    __tablename__ = "pipeline_runs"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    run_type: Mapped[str] = mapped_column(String(50), index=True)
    triggered_by: Mapped[str] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(20), index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_ms: Mapped[int] = mapped_column(Integer, default=0)
    records_processed: Mapped[int] = mapped_column(Integer, default=0)
    summary_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)


class AgentExecution(Base):
    __tablename__ = "agent_executions"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    agent_key: Mapped[str] = mapped_column(String(40), index=True)
    run_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    duration_ms: Mapped[int] = mapped_column(Integer, default=0)
    records_processed: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), index=True)
    triggered_by: Mapped[str] = mapped_column(String(120), default="SYSTEM")
    metrics_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)


class BusinessRuleConfig(Base):
    __tablename__ = "business_rule_configs"
    __table_args__ = (UniqueConstraint("agent_key", "rule_key", name="uq_agent_rule_key"),)
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    agent_key: Mapped[str] = mapped_column(String(40), index=True)
    rule_key: Mapped[str] = mapped_column(String(80), index=True)
    rule_name: Mapped[str] = mapped_column(String(150))
    rule_value: Mapped[str] = mapped_column(String(80))
    value_type: Mapped[str] = mapped_column(String(20), default="float")
    unit: Mapped[str] = mapped_column(String(30), default="")
    description: Mapped[str] = mapped_column(Text)
    updated_by: Mapped[str] = mapped_column(String(120), default="SYSTEM")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


def ensure_analytical_views(ddl_conn):
    """Create or update reusable SQL analytical views for all 4 logistics agents."""
    views = [
        """
        CREATE OR REPLACE VIEW public.v_agent1_predictive_delay_features AS
        SELECT s.shipment_id, s.customer_order_id, s.plant_id, s.warehouse_id,
          s.carrier, s.vehicle_type, s.dispatch_date, s.planned_eta, s.actual_delivery_ts,
          s.shipment_qty, s.vehicle_utilization_pct, s.pod_status, s.shipment_status,
          o.priority AS order_priority,
          GREATEST(o.order_qty - o.shipped_qty, 0) AS open_qty,
          c.customer_name, c.service_level, p.plant_name,
          ROUND((EXTRACT(EPOCH FROM (s.planned_eta - s.dispatch_date))/3600.0)::numeric, 1) AS planned_hrs,
          ROUND((EXTRACT(EPOCH FROM (s.actual_delivery_ts - s.dispatch_date))/3600.0)::numeric, 1) AS elapsed_hrs,
          ROUND((GREATEST(EXTRACT(EPOCH FROM (s.actual_delivery_ts - s.planned_eta))/3600.0, 0))::numeric, 1) AS overdue_hrs
        FROM public.fact_shipment_milestone s
        LEFT JOIN public.fact_customer_order o ON s.customer_order_id = o.customer_order_id
        LEFT JOIN public.dim_customer c ON o.customer_id = c.customer_id
        LEFT JOIN public.dim_plant p ON s.plant_id = p.plant_id
        """,
        """
        CREATE OR REPLACE VIEW public.v_agent2_tat_lifecycle_analytics AS
        SELECT s.shipment_id, s.customer_order_id, s.plant_id, p.plant_name, s.warehouse_id,
          s.carrier, s.vehicle_type, s.dispatch_date, s.planned_eta, s.actual_delivery_ts,
          s.shipment_status, s.pod_status, s.vehicle_utilization_pct,
          o.order_date, o.confirmed_delivery_date,
          ROUND((EXTRACT(EPOCH FROM (s.dispatch_date - o.order_date))/3600.0)::numeric, 1) AS order_to_dispatch_hrs,
          ROUND((EXTRACT(EPOCH FROM (s.planned_eta - s.dispatch_date))/3600.0)::numeric, 1) AS planned_corridor_hrs,
          ROUND((EXTRACT(EPOCH FROM (s.actual_delivery_ts - s.dispatch_date))/3600.0)::numeric, 1) AS actual_corridor_tat_hrs,
          ROUND((GREATEST(EXTRACT(EPOCH FROM (s.actual_delivery_ts - s.planned_eta))/3600.0, 0))::numeric, 1) AS eta_slippage_hrs
        FROM public.fact_shipment_milestone s
        LEFT JOIN public.fact_customer_order o ON s.customer_order_id = o.customer_order_id
        LEFT JOIN public.dim_plant p ON s.plant_id = p.plant_id
        """,
        """
        CREATE OR REPLACE VIEW public.v_agent3_dock_staging_queue AS
        SELECT o.customer_order_id AS reference_id, s.shipment_id,
          c.customer_name, o.product_id, o.priority, o.order_status,
          GREATEST(o.order_qty - o.shipped_qty, 0) AS open_qty,
          o.requested_delivery_date,
          COALESCE(s.plant_id, 'IN-KA-01') AS plant_id,
          COALESCE(s.warehouse_id, 'FG-WH-01') AS warehouse_id,
          COALESCE(s.carrier, c.preferred_carrier) AS carrier,
          s.vehicle_type, s.shipment_status,
          a.decision AS approval_status, a.reviewed_by, a.updated_at AS reviewed_at
        FROM public.fact_customer_order o
        LEFT JOIN public.dim_customer c ON o.customer_id = c.customer_id
        LEFT JOIN public.fact_shipment_milestone s ON o.customer_order_id = s.customer_order_id
        LEFT JOIN public.dock_allocation_approvals a ON o.customer_order_id = a.reference_id
        WHERE o.order_qty > o.shipped_qty OR s.shipment_status IN ('IN_TRANSIT', 'DELAYED')
        """,
        """
        CREATE OR REPLACE VIEW public.v_agent4_daily_logistics_kpi AS
        SELECT dispatch_date::date AS dispatch_day,
          plant_id,
          COUNT(*) AS total_dispatches,
          COUNT(*) FILTER (WHERE shipment_status = 'DELIVERED') AS completed_journeys,
          COUNT(*) FILTER (WHERE shipment_status = 'IN_TRANSIT') AS in_transit_vehicles,
          COUNT(*) FILTER (WHERE shipment_status = 'DELAYED') AS delayed_vehicles,
          ROUND(AVG(EXTRACT(EPOCH FROM (actual_delivery_ts - dispatch_date))/3600.0)::numeric, 1) AS avg_tat_hrs,
          ROUND(AVG(vehicle_utilization_pct)::numeric, 1) AS avg_utilization_pct,
          COALESCE(SUM(freight_cost_inr), 0) AS total_freight_inr
        FROM public.fact_shipment_milestone
        GROUP BY dispatch_date::date, plant_id
        """,
    ]
    for v_sql in views:
        ddl_conn.execute(text(v_sql))


def init_db():
    ddl_engine = create_engine(settings.unpooled_sqlalchemy_url, pool_pre_ping=True) if settings.unpooled_sqlalchemy_url.startswith("postgresql") else engine
    Base.metadata.create_all(ddl_engine)
    if ddl_engine.dialect.name == "postgresql":
        with ddl_engine.begin() as conn:
            conn.execute(text("ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS user_id INT REFERENCES public.users(id) ON DELETE SET NULL"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations (user_id)"))
            try:
                ensure_analytical_views(conn)
            except Exception:
                pass
    if ddl_engine is not engine:
        ddl_engine.dispose()

def rows(query: str, params: dict | None = None):
    with ro_engine.connect() as conn:
        result = conn.execute(text(query), params or {})
        return [dict(r._mapping) for r in result.fetchall()]
