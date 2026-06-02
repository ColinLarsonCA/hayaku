#!/usr/bin/env python3
"""Generate a typed TypeScript data module from the frequency CSV file.

Reading fallback order for rows with blank `Reading`:
1. If `Word` is kana-only, use `Word`.
2. Otherwise, use first JMdict_e reading match for `Word`.

Usage:
  python3 data/generate_frequency_ts.py
  python3 data/generate_frequency_ts.py --input data/japanese_frequency_list.csv --output app/src/data/japaneseFrequencyData.ts
    python3 data/generate_frequency_ts.py --jmdict data/JMdict_e
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
import xml.etree.ElementTree as ET

MANUAL_CORRECTIONS: dict[int, dict[str, str]] = {
    169: {"word": "目、眼", "reading": "め"},
    177: {"word": "日、陽", "reading": "ひ"},
    191: {"word": "まま", "type": "noun"},
    192: {"word": "買う", "type": "verb"},
    193: {"word": "まだ", "type": "adverb"},
    255: {"word": "町、街", "reading": "まち"},
    321: {"word": "店", "reading": "みせ"},
    323: {"word": "頭", "reading": "あたま"},
    327: {"word": "本", "reading": "ほん"},
    411: {"word": "点", "reading": "てん"},
    512: {"word": "娘", "reading": "むすめ"},
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate a TypeScript array from a Japanese frequency CSV file.",
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("data/japanese_frequency_list.csv"),
        help="Path to source CSV file.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("app/src/data/japaneseFrequencyData.ts"),
        help="Path to generated TypeScript file.",
    )
    parser.add_argument(
        "--jmdict",
        type=Path,
        default=Path("data/JMdict_e"),
        help="Path to JMdict_e XML file used for reading fallback.",
    )
    return parser.parse_args()


def is_kana_char(char: str) -> bool:
    code = ord(char)
    return (0x3040 <= code <= 0x309F) or (0x30A0 <= code <= 0x30FF) or char == "ー"


def is_kana_word(word: str) -> bool:
    return bool(word) and all(is_kana_char(char) for char in word)


def append_unique(mapping: dict[str, list[str]], key: str, value: str) -> None:
    current = mapping.setdefault(key, [])
    if value not in current:
        current.append(value)


def build_jmdict_reading_index(jmdict_path: Path) -> dict[str, list[str]]:
    index: dict[str, list[str]] = {}
    if not jmdict_path.exists():
        return index

    for _, elem in ET.iterparse(jmdict_path, events=("end",)):
        if elem.tag != "entry":
            continue

        readings = [
            (reb.text or "").strip()
            for reb in elem.findall("./r_ele/reb")
            if (reb.text or "").strip()
        ]
        if not readings:
            elem.clear()
            continue

        spellings = [
            (keb.text or "").strip()
            for keb in elem.findall("./k_ele/keb")
            if (keb.text or "").strip()
        ]

        for reading in readings:
            append_unique(index, reading, reading)

        for spelling in spellings:
            for reading in readings:
                append_unique(index, spelling, reading)

        elem.clear()

    return index


def choose_fallback_reading(word: str, reading_index: dict[str, list[str]]) -> str:
    if is_kana_word(word):
        return word

    candidates = reading_index.get(word)
    if candidates:
        return candidates[0]

    # Common frequency-list form: kanji root + する (e.g. 勉強する).
    # JMdict may only contain the root entry, so compose the reading.
    if word.endswith("する") and len(word) > 2:
        root = word[:-2]
        root_candidates = reading_index.get(root)
        if root_candidates:
            root_reading = root_candidates[0]
            if root_reading.endswith("する"):
                return root_reading
            return f"{root_reading}する"

    return ""


def apply_manual_correction(entry: dict[str, object]) -> bool:
    frequency = entry["frequency"]
    if not isinstance(frequency, int):
        return False

    correction = MANUAL_CORRECTIONS.get(frequency)
    if not correction:
        return False

    expected_word = correction.get("word")
    word = entry.get("word")
    if expected_word and word != expected_word:
        print(
            f"Warning: manual correction for frequency {frequency} skipped (expected word '{expected_word}', found '{word}')"
        )
        return False

    applied = False
    corrected_reading = correction.get("reading")
    if corrected_reading is not None and entry.get("reading") != corrected_reading:
        entry["reading"] = corrected_reading
        applied = True

    corrected_type = correction.get("type")
    if corrected_type is not None and entry.get("type") != corrected_type:
        entry["type"] = corrected_type
        applied = True

    return applied


def load_rows(csv_path: Path, reading_index: dict[str, list[str]]) -> tuple[list[dict[str, object]], int, int]:
    rows: list[dict[str, object]] = []
    filled_count = 0
    correction_count = 0

    with csv_path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)

        required_columns = {"Frequency", "Word", "Reading", "Type", "Meaning"}
        if reader.fieldnames is None or not required_columns.issubset(set(reader.fieldnames)):
            missing = required_columns.difference(set(reader.fieldnames or []))
            raise ValueError(f"CSV is missing required columns: {', '.join(sorted(missing))}")

        for index, raw_row in enumerate(reader, start=2):
            frequency_text = (raw_row.get("Frequency") or "").strip()
            if not frequency_text.isdigit():
                raise ValueError(
                    f"Invalid frequency '{frequency_text}' in row {index}. Frequency must be an integer."
                )

            word = (raw_row.get("Word") or "").strip()
            reading = (raw_row.get("Reading") or "").strip()
            if not reading:
                reading = choose_fallback_reading(word, reading_index)
                if reading:
                    filled_count += 1

            entry: dict[str, object] = {
                "frequency": int(frequency_text),
                "word": word,
                "reading": reading,
                "type": (raw_row.get("Type") or "").strip(),
                "meaning": (raw_row.get("Meaning") or "").strip(),
            }
            if apply_manual_correction(entry):
                correction_count += 1
            rows.append(entry)

    return rows, filled_count, correction_count


def build_typescript_module(entries: list[dict[str, object]]) -> str:
    entries_json = json.dumps(entries, ensure_ascii=False, indent=2)

    return "\n".join(
        [
            "/* eslint-disable */",
            "// This file is auto-generated by data/generate_frequency_ts.py.",
            "// Do not edit by hand.",
            "",
            "export type JapaneseFrequencyEntry = {",
            "  frequency: number",
            "  word: string",
            "  reading: string",
            "  type: string",
            "  meaning: string",
            "}",
            "",
            f"export const japaneseFrequencyData: JapaneseFrequencyEntry[] = {entries_json}",
            "",
        ]
    )


def main() -> None:
    args = parse_args()
    input_path = args.input
    output_path = args.output

    if not input_path.exists():
        raise FileNotFoundError(f"Input CSV not found: {input_path}")

    reading_index = build_jmdict_reading_index(args.jmdict)
    if not reading_index:
        print(f"Warning: JMdict index not loaded from {args.jmdict}. Falling back to kana-only fill.")

    entries, filled_count, correction_count = load_rows(input_path, reading_index)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(build_typescript_module(entries), encoding="utf-8")

    print(f"Wrote {len(entries)} entries to {output_path}")
    print(f"Filled {filled_count} missing readings")
    print(f"Applied {correction_count} manual corrections")


if __name__ == "__main__":
    main()
