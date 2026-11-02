"""Run the real Windows launcher with no system Node.js on PATH."""
import argparse
import json
import os
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parent.parent


def main(archive_path):
    if os.name != "nt":
        raise SystemExit("Run this smoke check on Windows.")
    test_root = (ROOT / "artifacts" / "smoke").resolve()
    test_root.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="音序 smoke ", dir=test_root) as folder:
        unpacked = Path(folder).resolve()
        assert unpacked.is_relative_to(test_root)
        with ZipFile(archive_path) as archive:
            for name in archive.namelist():
                if not (unpacked / name).resolve().is_relative_to(unpacked):
                    raise ValueError("Archive contains a path outside its extraction folder")
            archive.extractall(unpacked)
        config = json.loads((unpacked / "runtime" / "runtime.json").read_text())
        env = {key: value for key, value in os.environ.items() if key.upper() not in {"PATH", "NODE_OPTIONS", "NODE_PATH"}}
        env["PATH"] = str(Path(os.environ["SystemRoot"]) / "System32")
        env["YINXU_NO_BROWSER"] = "1"
        version = subprocess.check_output([str(unpacked / "runtime" / "node.exe"), "--version"], env=env, text=True).strip()
        assert version == config["version"], (version, config)
        with socket.socket() as available:
            available.bind(("127.0.0.1", 0))
            port = available.getsockname()[1]
        env["PORT"] = str(port)
        process = subprocess.Popen(
            [str(Path(os.environ["SystemRoot"]) / "System32" / "cmd.exe"), "/d", "/c", "start.bat"],
            cwd=unpacked, env=env, stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )
        try:
            base = f"http://127.0.0.1:{port}/"
            for attempt in range(60):
                if process.poll() is not None:
                    raise RuntimeError(process.stdout.read().decode("utf-8", errors="replace"))
                try:
                    with urllib.request.urlopen(base, timeout=1) as response:
                        html = response.read().decode("utf-8")
                    break
                except (urllib.error.URLError, TimeoutError):
                    time.sleep(0.1)
            else:
                raise RuntimeError("The bundled launcher did not start a working server")
            assert "音序" in html
            assets = list((unpacked / "web" / "assets").iterdir())
            for asset in assets:
                with urllib.request.urlopen(base + "assets/" + asset.name, timeout=5) as response:
                    assert response.read() == asset.read_bytes(), asset.name
            for path in ["runtime/node.exe", "serve.mjs", "README.txt"]:
                try:
                    urllib.request.urlopen(base + path, timeout=2)
                except urllib.error.HTTPError as error:
                    assert error.code == 404
                else:
                    raise AssertionError(f"Private launcher file was served: {path}")
            print(f"PASS: {version}, launcher in a Chinese/space path, no system Node.js on PATH, HTML and {len(assets)} assets served correctly.")
        finally:
            if process.poll() is None:
                subprocess.run(
                    [str(Path(os.environ["SystemRoot"]) / "System32" / "taskkill.exe"), "/PID", str(process.pid), "/T", "/F"],
                    capture_output=True, check=False,
                )
            process.wait(timeout=10)
            process.stdout.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", required=True, type=Path)
    main(parser.parse_args().archive.resolve())
