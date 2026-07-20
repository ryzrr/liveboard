"""
Aggregation worker entry point.

Run as:  python -m worker.main
Docker:  CMD ["python", "-m", "worker.main"]

Two concurrent tasks:
  aggregator  — XREADGROUP → TimescaleDB COPY (at-least-once delivery)
  metrics     — query last-minute stats per project → Redis pub/sub every 1 s
"""

import asyncio
import logging
import signal

from worker.aggregator import run as run_aggregator
from worker.alerts import run as run_alerts
from worker.anomaly import run as run_anomaly
from worker.metrics import run as run_metrics

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


async def main() -> None:
    loop = asyncio.get_running_loop()
    agg_task     = asyncio.create_task(run_aggregator(), name="aggregator")
    metrics_task = asyncio.create_task(run_metrics(),    name="metrics-publisher")
    anomaly_task = asyncio.create_task(run_anomaly(),    name="anomaly-detector")
    alerts_task  = asyncio.create_task(run_alerts(),     name="alert-evaluator")

    def _shutdown(sig: signal.Signals) -> None:
        logger.info("Received %s, stopping worker", sig.name)
        agg_task.cancel()
        metrics_task.cancel()
        anomaly_task.cancel()
        alerts_task.cancel()

    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, _shutdown, sig)

    try:
        await asyncio.gather(agg_task, metrics_task, anomaly_task, alerts_task, return_exceptions=True)
    except asyncio.CancelledError:
        pass


if __name__ == "__main__":
    asyncio.run(main())
