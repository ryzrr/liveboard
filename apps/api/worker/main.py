"""
Aggregation worker entry point.

Run as:  python -m worker.main
Docker:  CMD ["python", "-m", "worker.main"]
"""

import asyncio
import logging
import signal

from worker.aggregator import run

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


async def main() -> None:
    loop = asyncio.get_running_loop()
    task = asyncio.create_task(run())

    def _shutdown(sig: signal.Signals) -> None:
        logger.info("Received %s, stopping worker", sig.name)
        task.cancel()

    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, _shutdown, sig)

    try:
        await task
    except asyncio.CancelledError:
        pass


if __name__ == "__main__":
    asyncio.run(main())
