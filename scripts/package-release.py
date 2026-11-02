"""Validate a portable Vite build and package the compiled website for release."""
import argparse
import hashlib
import re
from html.parser import HTMLParser
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"

class AssetParser(HTMLParser):
    assets = None

    def __init__(self):
        super().__init__()
        self.assets = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        asset = attributes.get("src") if tag == "script" else attributes.get("href") if tag == "link" else None
        if asset and not asset.startswith(("https:", "http:", "data:", "#")):
            self.assets.append(asset)

def validate():
    parser = AssetParser()
    parser.feed((DIST / "index.html").read_text(encoding="utf-8"))
    for asset in parser.assets:
        if asset.startswith("/"):
            raise ValueError(f"Asset must be relative for repository hosting: {asset}")
        if not (DIST / asset.split("?", 1)[0]).is_file():
            raise ValueError(f"Missing compiled asset: {asset}")
    if not (DIST / "third-party-notices.txt").is_file():
        raise ValueError("Dependency license notices are missing")
    print(f"Validated {len(parser.assets)} relative entry assets and dependency notices.")

def package(version, output):
    if not re.fullmatch(r"v\d+\.\d+\.\d+(?:[-.][A-Za-z0-9.]+)?", version):
        raise ValueError("Use a version such as v0.1.0")
    output.mkdir(parents=True, exist_ok=True)
    destination = output / f"yinxu-{version}-web.zip"
    readme = f"""音序 {version}

在线使用：https://xxzzh.github.io/yinyue/ （无需登录）
源码与新版：https://github.com/xxzzh/yinyue

这是已经构建好的网页，无需 npm install 或重新构建。
Windows：安装 Node.js 18+ 后双击 start.bat。
macOS / Linux：在解压目录运行 node serve.mjs。
打开终端显示的 http://127.0.0.1:4173/ 。
也可以将静态文件部署到任意静态 HTTP 服务器。
请通过 HTTP 打开，避免 file:// 的浏览器模块限制。

学习进度保存在各自浏览器中，换设备前请导出备份。
依赖许可证见 third-party-notices.txt，项目许可证见 LICENSE。
"""
    launcher = "@echo off\r\ncd /d \"%~dp0\"\r\nwhere node.exe >nul 2>nul\r\nif errorlevel 1 (\r\n  echo Install Node.js 18+ or use https://xxzzh.github.io/yinyue/\r\n  pause\r\n  exit /b 1\r\n)\r\nnode.exe serve.mjs\r\npause\r\n"
    with ZipFile(destination, "w", ZIP_DEFLATED, compresslevel=9) as archive:
        for file in sorted(DIST.rglob("*")):
            if file.is_file():
                archive.write(file, file.relative_to(DIST).as_posix())
        archive.write(ROOT / "LICENSE", "LICENSE")
        archive.write(ROOT / "scripts" / "serve-release.mjs", "serve.mjs")
        archive.writestr("README.txt", readme)
        archive.writestr("start.bat", launcher)
    digest = hashlib.sha256(destination.read_bytes()).hexdigest()
    (output / "SHA256SUMS.txt").write_text(f"{digest}  {destination.name}\n", encoding="utf-8")
    print(f"Created {destination.name} ({destination.stat().st_size} bytes) with SHA-256 checksum.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--version", default="v0.1.0")
    parser.add_argument("--output", type=Path, default=ROOT / "artifacts" / "release")
    parser.add_argument("--validate-only", action="store_true")
    args = parser.parse_args()
    validate()
    if not args.validate_only:
        package(args.version, args.output.resolve())
