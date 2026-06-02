#!/usr/bin/env python3
"""Download and unpack JMdict_e for local reading fallback.

Usage:
  python3 data/download_jmdict.py
  python3 data/download_jmdict.py --url ftp://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz --output data/JMdict_e
"""

from __future__ import annotations

import argparse
import gzip
import shutil
import socket
import ssl
import urllib.request
from pathlib import Path

DEFAULT_URLS = [
    "ftp://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz",
    "https://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Download and unpack JMdict_e XML")
    parser.add_argument(
        "--url",
        default="",
        help="Optional source URL for JMdict_e gzip archive.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/JMdict_e"),
        help="Output XML path after decompression.",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=30.0,
        help="Network timeout in seconds for each request.",
    )
    parser.add_argument(
        "--retries",
        type=int,
        default=3,
        help="Number of attempts per URL before trying the next URL.",
    )
    return parser.parse_args()


def download_file(url: str, destination: Path, timeout_seconds: float) -> None:
    with urllib.request.urlopen(url, timeout=timeout_seconds) as response, destination.open("wb") as out_file:
        shutil.copyfileobj(response, out_file)


def gunzip_file(source_gz: Path, output_path: Path) -> None:
    with gzip.open(source_gz, "rb") as gz_file, output_path.open("wb") as xml_file:
        shutil.copyfileobj(gz_file, xml_file)


def main() -> None:
    args = parse_args()
    output_path = args.output
    output_path.parent.mkdir(parents=True, exist_ok=True)

    gz_path = output_path.with_suffix(output_path.suffix + ".gz")
    urls = [args.url] if args.url else DEFAULT_URLS

    last_error: Exception | None = None
    for url in urls:
        for attempt in range(1, max(1, args.retries) + 1):
            try:
                print(f"Downloading {url} (attempt {attempt}/{args.retries})")
                download_file(url, gz_path, args.timeout)
                last_error = None
                break
            except ssl.SSLCertVerificationError as err:
                last_error = err
                print(f"Download failed (certificate): {err}")
                # Certificate mismatch won't succeed on retry for the same URL.
                break
            except (OSError, TimeoutError, socket.timeout) as err:
                last_error = err
                print(f"Download failed: {err}")
        if last_error is None:
            break

    if last_error is not None:
        raise RuntimeError("Unable to download JMdict_e from configured URL(s)") from last_error

    print(f"Decompressing to {output_path}")
    gunzip_file(gz_path, output_path)

    print(f"Saved {output_path}")


if __name__ == "__main__":
    main()
