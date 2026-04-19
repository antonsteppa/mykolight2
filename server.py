from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parent
UPSTREAM = "https://off.energy.mk.ua"


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        if self.path.startswith("/api/"):
            self.proxy_api()
            return
        super().do_GET()

    def proxy_api(self):
        target = UPSTREAM + self.path
        req = Request(
            target,
            headers={
                "Accept": "application/json",
                "User-Agent": "mykolight2-local-proxy/1.0",
            },
        )

        try:
            with urlopen(req, timeout=20) as resp:
                body = resp.read()
                self.send_response(resp.status)
                self.send_header("Content-Type", resp.headers.get("Content-Type", "application/json"))
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(body)
        except HTTPError as err:
            body = err.read()
            self.send_response(err.code)
            self.send_header("Content-Type", err.headers.get("Content-Type", "application/json"))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            if body:
                self.wfile.write(body)
        except URLError as err:
            message = ('{"error":"upstream_unavailable","details":"%s"}' % err.reason).encode("utf-8")
            self.send_response(502)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(message)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 4173), Handler)
    print("Serving on http://127.0.0.1:4173")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
