import subprocess, time, urllib.request, os
def serve():
    p=subprocess.Popen(["npx","vite","preview","--port","4173","--strictPort"], cwd=__import__("os").path.dirname(__import__("os").path.dirname(__import__("os").path.abspath(__file__))), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(40):
        try: urllib.request.urlopen("http://localhost:4173/"); return p
        except Exception: time.sleep(0.25)
    raise SystemExit("server failed")
