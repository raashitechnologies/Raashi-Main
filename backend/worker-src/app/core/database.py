from fastapi import Request

def get_database(request: Request):
    """
    Return the active Cloudflare D1 database binding.
    Requires FastAPI to be running inside a Pyodide Cloudflare Worker (e.g. via asgi.entrypoint)
    where the environment is provided in the ASGI scope.
    """
    if "env" not in request.scope:
        raise RuntimeError("Cloudflare environment not found in request scope.")
    return request.scope["env"].DB
