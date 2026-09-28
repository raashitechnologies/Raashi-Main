import logging
from typing import Any, Optional
import httpx
from fastapi import Request

logger = logging.getLogger(__name__)


class CloudD1PreparedStatement:
    def __init__(self, client: "CloudD1Database", sql: str):
        self.client = client
        self.sql = sql
        self.params = []

    def bind(self, *args):
        self.params = list(args)
        return self

    async def first(self):
        res = await self.client._execute(self.sql, self.params)
        results = res.get("results", [])
        return results[0] if results else None

    async def all(self):
        return await self.client._execute(self.sql, self.params)

    async def run(self):
        return await self.client._execute(self.sql, self.params)


class CloudD1Database:
    """
    Direct Cloudflare D1 Cloud REST API client.
    Fetches all data directly from the live Cloudflare cloud database.
    """
    def __init__(self, account_id: str, database_id: str, api_token: str):
        self.account_id = account_id
        self.database_id = database_id
        self.api_token = api_token
        self.url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/d1/database/{database_id}/query"
        self.headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json",
        }

    def prepare(self, sql: str):
        return CloudD1PreparedStatement(self, sql)

    async def _execute(self, sql: str, params: list):
        async with httpx.AsyncClient(timeout=httpx.Timeout(20.0)) as client:
            resp = await client.post(
                self.url,
                headers=self.headers,
                json={"sql": sql, "params": params}
            )
            data = resp.json()
            if not data.get("success"):
                errors = data.get("errors", [])
                logger.error("Cloudflare D1 REST query failed: %s (sql=%s)", errors, self.sql if hasattr(self, 'sql') else sql)
                raise RuntimeError(f"Cloudflare D1 query failed: {errors}")
            result_arr = data.get("result", [])
            return result_arr[0] if result_arr else {"results": [], "meta": {}}


_cloud_d1_instance: Optional[CloudD1Database] = None


def get_database(request: Request):
    """
    Return the active Cloudflare D1 database.
    When USE_CLOUD_D1 is enabled and credentials are configured,
    connects directly to the live Cloudflare Cloud D1 database via REST API.
    Otherwise, returns the native Worker binding from request.scope["env"].DB.
    """
    global _cloud_d1_instance
    from app.core.config import get_settings
    settings = get_settings()

    use_cloud = getattr(settings, "USE_CLOUD_D1", True)
    cf_token = getattr(settings, "CLOUDFLARE_API_TOKEN", "") or getattr(settings, "CF_API_TOKEN", "")
    cf_account = getattr(settings, "CLOUDFLARE_ACCOUNT_ID", "") or getattr(settings, "CF_ACCOUNT_ID", "")
    d1_id = getattr(settings, "D1_DATABASE_ID", "")

    if use_cloud and cf_token and cf_account and d1_id:
        if _cloud_d1_instance is None:
            _cloud_d1_instance = CloudD1Database(cf_account, d1_id, cf_token)
        return _cloud_d1_instance

    if "env" not in request.scope:
        raise RuntimeError("Cloudflare environment not found in request scope.")
    return request.scope["env"].DB
