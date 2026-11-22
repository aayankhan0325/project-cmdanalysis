"""Local dashboard server: static files plus /api routes."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json

from etl.config import PUBLIC_DIR, OUTPUT_DIR, COINGECKO_API_KEY

PORT = 8765


class DashboardHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC_DIR), **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        if self.path.startswith("/api/health") or self.path.startswith("/api/status"):
            return self._json(
                {
                    "ok": True,
                    "service": "crypto-market-api",
                    "source": "CoinGecko",
                    "hasApiKey": bool(COINGECKO_API_KEY),
                }
            )
        if self.path.startswith("/api/ping"):
            return self._json({"pong": True})
        if self.path.startswith("/api/market"):
            snapshot = PUBLIC_DIR / "dashboard_data.json"
            if not snapshot.exists():
                self.send_error(404, "Run python main.py first")
                return
            payload = json.loads(snapshot.read_text(encoding="utf-8"))
            payload["refresh_seconds"] = 60
            return self._json(payload)
        if self.path.startswith("/api/csv"):
            csv_path = OUTPUT_DIR / "crypto_market_data.csv"
            if not csv_path.exists():
                self.send_error(404, "CSV not generated yet")
                return
            data = csv_path.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "text/csv; charset=utf-8")
            self.send_header("Content-Disposition", 'attachment; filename="crypto_market_data.csv"')
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        return super().do_GET()

    def _json(self, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        print("%s - %s" % (self.address_string(), format % args))


def main():
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer(("127.0.0.1", PORT), DashboardHandler)
    print(f"Dashboard: http://127.0.0.1:{PORT}")
    print("API:       http://127.0.0.1:%s/api/market" % PORT)
    server.serve_forever()


if __name__ == "__main__":
    main()
