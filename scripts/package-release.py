"""Package the compiled website with an optional verified official Windows runtime."""
import argparse
import hashlib
import json
import re
import urllib.request
from html.parser import HTMLParser
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"


class AssetParser(HTMLParser):
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
    images = json.loads((DIST / "instruments" / "credits.json").read_text(encoding="utf-8"))
    for image in images.values():
        path = (DIST / "instruments" / image["file"]).resolve()
        if not path.is_relative_to(DIST.resolve()) or not path.is_file():
            raise ValueError(f"Missing instrument image: {image['file']}")
    if not (DIST / "image-credits.html").is_file():
        raise ValueError("Instrument image attribution page is missing")
    samples = json.loads((DIST / "audio" / "credits.json").read_text(encoding="utf-8"))
    for sample in samples.values():
        path = (DIST / "audio" / sample["file"]).resolve()
        if not path.is_relative_to(DIST.resolve()) or not path.is_file() or checksum(path) != sample["sha256"]:
            raise ValueError(f"Missing or changed real audio: {sample['file']}")
    if not (DIST / "audio-credits.html").is_file() or not (DIST / "audio" / "LICENSE-VSCO-CC0.txt").is_file():
        raise ValueError("Real audio attribution is missing")
    print(f"Validated {len(parser.assets)} relative entry assets and dependency notices.", flush=True)


def checksum(path):
    with path.open("rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()


def windows_runtime():
    config = json.loads((ROOT / "scripts" / "windows-runtime.json").read_text(encoding="utf-8"))
    filename = f"node-{config['version']}-{config['platform']}.zip"
    url = f"https://nodejs.org/dist/{config['version']}/{filename}"
    cache = ROOT / "artifacts" / "runtime" / filename
    cache.parent.mkdir(parents=True, exist_ok=True)
    if not cache.exists():
        print(f"Downloading official Node.js {config['version']} ({config['platform']})...", flush=True)
        partial = cache.with_suffix(".partial")
        with urllib.request.urlopen(url, timeout=45) as response, partial.open("wb") as output:
            while chunk := response.read(1024 * 1024):
                output.write(chunk)
        if checksum(partial) != config["sha256"]:
            raise ValueError("Official Node.js archive checksum mismatch; no portable package was created")
        partial.replace(cache)
    if checksum(cache) != config["sha256"]:
        raise ValueError("Cached Node.js archive checksum mismatch")
    print("Verified official Node.js archive SHA-256.", flush=True)
    return cache, {**config, "url": url}


def write_website(archive, prefix=""):
    for file in sorted(DIST.rglob("*")):
        if file.is_file():
            archive.write(file, prefix + file.relative_to(DIST).as_posix())
    archive.write(ROOT / "LICENSE", "LICENSE")
    archive.write(ROOT / "scripts" / "serve-release.mjs", "serve.mjs")


def readme(version, portable=False):
    instructions = """适用：Windows 10 / 11 的 64 位 Intel / AMD 电脑。
1. 将整个 ZIP 解压到任意普通文件夹，不要直接在压缩包内运行。
2. 双击 start.bat，默认浏览器会自动打开音乐网站。
3. 学习期间保持启动窗口打开；关闭启动窗口或按 Ctrl+C 即可停止。
无需安装 Node.js、Python、npm，也无需管理员权限。
发布包内已包含运行环境与网页资源，解压后可离线学习。
若浏览器未自动打开，复制启动窗口中的本地网址到浏览器。
""" if portable else """这是已经构建好的网页，无需 npm install 或重新构建。
Windows：安装 Node.js 18+ 后双击 start.bat。
macOS / Linux：安装 Node.js 18+ 后，在解压目录运行 node serve.mjs。
普通 Windows 用户请优先下载 windows-x64.zip 免安装版。
静态网页也可上传到自己的 HTTP 服务器。
"""
    runtime_notice = "内置 Node.js 的原始许可证见 runtime/LICENSE，版本与校验来源见 runtime/runtime.json。" if portable else ""
    return f"""音序 {version}

{instructions}
默认本地网址：http://127.0.0.1:4173/
端口被占用时会尝试下一个端口，请以启动窗口中显示的网址为准。
所有服务仅监听本机，不会开放到局域网。

在线使用：https://xxzzh.github.io/yinyue/ （无需登录）
源码与新版：https://github.com/xxzzh/yinyue

学习进度保存在各自浏览器和网址中。在线版与本地版、不同浏览器或不同端口的记录独立，切换前请在“学习记录”中导出备份，再导入。
升级时关闭旧版本启动窗口，解压新版后用同一浏览器和端口打开。
无需登录；不要直接双击 index.html，请使用启动器或在线网址。

项目许可证见 LICENSE，网页依赖许可证见 third-party-notices.txt（免安装版在 web/ 内）。
乐器图片已包含在包内；第三方图片按各自授权使用，详情见 image-credits.html（免安装版在 web/ 内），不统一适用代码的 MIT 许可证。
{runtime_notice}
"""


def package(version, output, portable=False):
    if not re.fullmatch(r"v\d+\.\d+\.\d+(?:[-.][A-Za-z0-9.]+)?", version):
        raise ValueError("Use a version such as v0.1.2")
    output.mkdir(parents=True, exist_ok=True)
    destinations = []
    web = output / f"yinxu-{version}-web.zip"
    launcher = '@echo off\r\nsetlocal\r\ncd /d "%~dp0"\r\nwhere node.exe >nul 2>nul\r\nif errorlevel 1 (\r\n  echo Install Node.js 18+ or download the windows-x64 portable ZIP.\r\n  pause\r\n  exit /b 1\r\n)\r\nnode.exe "%~dp0serve.mjs" --open\r\nif errorlevel 1 pause\r\n'
    with ZipFile(web, "w", ZIP_DEFLATED, compresslevel=9) as archive:
        write_website(archive)
        archive.writestr("README.txt", readme(version))
        archive.writestr("start.bat", launcher)
    destinations.append(web)
    if portable:
        runtime_path, config = windows_runtime()
        windows = output / f"yinxu-{version}-windows-x64.zip"
        launcher = '@echo off\r\nsetlocal\r\ncd /d "%~dp0"\r\nif not exist "%~dp0runtime\\node.exe" (\r\n  echo Runtime missing. Extract the entire ZIP before starting.\r\n  pause\r\n  exit /b 1\r\n)\r\n"%~dp0runtime\\node.exe" "%~dp0serve.mjs" --open\r\nif errorlevel 1 pause\r\n'
        with ZipFile(windows, "w", ZIP_DEFLATED, compresslevel=9) as archive, ZipFile(runtime_path) as runtime:
            write_website(archive, "web/")
            prefix = f"node-{config['version']}-{config['platform']}/"
            archive.writestr("runtime/node.exe", runtime.read(prefix + "node.exe"))
            archive.writestr("runtime/LICENSE", runtime.read(prefix + "LICENSE"))
            archive.writestr("runtime/runtime.json", json.dumps(config, indent=2) + "\n")
            archive.writestr("README.txt", readme(version, portable=True))
            archive.writestr("start.bat", launcher)
        destinations.append(windows)
    checksums = []
    for destination in destinations:
        checksums.append(f"{checksum(destination)}  {destination.name}\n")
        print(f"Created {destination.name} ({destination.stat().st_size} bytes).", flush=True)
    (output / "SHA256SUMS.txt").write_text("".join(checksums), encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--version", default="v" + json.loads((ROOT / "package.json").read_text(encoding="utf-8"))["version"])
    parser.add_argument("--output", type=Path, default=ROOT / "artifacts" / "release")
    parser.add_argument("--validate-only", action="store_true")
    parser.add_argument("--windows-portable", action="store_true", help="Also bundle the official Windows x64 runtime")
    args = parser.parse_args()
    validate()
    if not args.validate_only:
        package(args.version, args.output.resolve(), portable=args.windows_portable)
