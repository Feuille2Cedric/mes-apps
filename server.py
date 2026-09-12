from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent
ALLOWED = {'/', '/index.html', '/app.js', '/style.css', '/favicon.png', '/sync/config.js', '/sync/supabase.js', '/sync/sync.js', '/sync/adapter.js', '/sync/sync.css'}


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()

    def translate_path(self, path):
        path = path.split('?', 1)[0].split('#', 1)[0]
        if path == '/':
            path = '/index.html'
        return str(ROOT / path.lstrip('/'))

    def do_GET(self):
        path = self.path.split('?', 1)[0].split('#', 1)[0]
        if path not in ALLOWED:
            self.send_error(404, 'Page introuvable')
            return
        super().do_GET()

    def list_directory(self, path):
        self.send_error(404, 'Listing desactive')
        return None


if __name__ == '__main__':
    server = ThreadingHTTPServer(('127.0.0.1', 3344), Handler)
    print('Mes apps: http://127.0.0.1:3344/')
    server.serve_forever()
