# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "beautifulsoup4",
#     "requests",
# ]
# ///

import csv
import os
import re
import requests
from bs4 import BeautifulSoup

# Setup file paths and URL
URL = "https://en.wiktionary.org/wiki/Wiktionary:Frequency_lists/Japanese/5000_Most_Frequent_Words"
LOCAL_HTML_FILE = "japanese_word_frequency_list.html"
OUTPUT_FILE = "japanese_frequency_list.csv"

# Mapping dictionary for parts of speech
POS_MAP = {
    "adn.": "adnominal",
    "adv.": "adverb",
    "aux.": "auxiliary",
    "conj.": "conjunction",
    "cp.": "compound",
    "i-adj.": "i-adjective",
    "interj.": "interjection",
    "n.": "noun",
    "na-adj.": "na-adjective",
    "num.": "numeral",
    "p.": "particle",
    "p. case": "case particle",
    "p. conj.": "conjunctive particle",
    "p. disc.": "discourse particle",
    "prefix": "prefix",
    "pron.": "pronoun",
    "suffix": "suffix",
    "v.": "verb",
}

# Regex to find parts of speech at the beginning of a definition string
POS_PATTERN = (
    r"^(p\.\s+(?:case|conj\.|disc\.)|[a-zA-Z\-]+\.|prefix|suffix)"
)


def clean_meaning(text):
    """Helper to remove leading punctuation and spaces from meanings."""
    return re.sub(r"^[,\s;:\-\)]+", "", text).strip()


def extract_reading(word_text):
    """Extract reading from word in format like 島【しま】.
    
    Returns: (word_without_reading, reading) tuple
    Examples:
    - '島【しま】' → ('島', 'しま')
    - '逆' → ('逆', '')
    """
    match = re.search(r"【([^】]+)】", word_text)
    if match:
        reading = match.group(1)
        # Remove the reading from the word
        word = word_text[:match.start()] + word_text[match.end():]
        return word.strip(), reading
    return word_text, ""


def parse_definition_block(def_text):
    """Parses a single definition string, handling single or multiple POS indicators.

    Examples:
    - Single: 'n. graduation' → ("noun", "graduation")
    - Multiple: 'n., na-adj. contrary, opposite' → ("noun, na-adjective", "contrary, opposite")

    Returns a tuple: (pos_types, cleaned_meaning)
    """
    def_text = def_text.strip()
    
    pos_tokens = []
    remaining = def_text
    
    # Extract all consecutive POS indicators (e.g., "n.", "na-adj.")
    # separated by commas.
    while remaining:
        match = re.match(POS_PATTERN, remaining)
        if not match:
            break
        
        pos_token = re.sub(r"\s+", " ", match.group(0)).strip()
        pos_type = POS_MAP.get(pos_token, pos_token)
        pos_tokens.append(pos_type)
        
        # Consume the matched POS token
        remaining = remaining[len(match.group(0)):].lstrip()
        
        # Check if next character is a comma (indicating more POS tokens)
        if not remaining.startswith(","):
            break
        
        # Consume the comma and any following whitespace
        remaining = remaining[1:].lstrip()
    
    if pos_tokens:
        combined_type = ", ".join(pos_tokens)
        meaning = clean_meaning(remaining)
        return combined_type, meaning
    
    return "unknown", def_text


def split_numbered_definitions(raw_meaning):
    """Split meanings that use [1]/[2]/[3] sense markers.

    Returns a list of definition fragments without the bracket markers.
    """
    text = raw_meaning.strip()

    # Fast path for the common single-sense case.
    if "[2]" not in text and "[3]" not in text:
        if text.startswith("[1]"):
            text = text[3:].strip()
        return [text] if text else []

    # Handles both "[1] ... [2] ..." and "... [2] ..." layouts.
    parts = [part.strip() for part in re.split(r"\[\d+\]", text) if part.strip()]
    return parts


def process_entry(frequency, raw_word, raw_meaning):
    """Process a raw table row into one or more normalized output rows.

    Supports numbered senses like [1]/[2]/[3] and special suffix forms such
    as noun+する pairs.
    """
    rows_to_add = []

    # Clean up the word
    word_clean = raw_word.strip()

    # Extract reading early (e.g., 島【しま】 → word: 島, reading: しま)
    word_without_reading, reading = extract_reading(word_clean)

    # Check for suffix patterns like 卒業（する） or 卒業 (する)
    suffix_match = re.search(r"[\s（(]+(する|に)[\s）)]+", word_without_reading)
    
    # Extract base word (without suffix notation) if suffix pattern exists
    base_word = word_without_reading
    if suffix_match:
        base_word = word_without_reading[: suffix_match.start()].strip()

    defs = split_numbered_definitions(raw_meaning)

    # Only apply special suffix handling if:
    # 1. There are exactly 2 senses
    # 2. A suffix pattern (する/に) exists
    # 3. The first sense is a noun (typical pattern: noun + する = verb)
    use_suffix_handling = False
    if suffix_match and len(defs) == 2:
        pos1, _ = parse_definition_block(defs[0])
        # Only split if first sense is noun and we have a suffix form
        use_suffix_handling = (pos1.lower() == "noun")

    if use_suffix_handling:
        # For 2-sense words where [1] is noun, first is base, second is suffix form.
        suffix_word = base_word + suffix_match.group(1)

        pos1, mean1 = parse_definition_block(defs[0])
        rows_to_add.append([frequency, base_word, reading, pos1, mean1])

        pos2, mean2 = parse_definition_block(defs[1])
        rows_to_add.append([frequency, suffix_word, "", pos2, mean2])

        return rows_to_add

    # Generic case: emit one row per sense for the same surface form.
    # For 3+ senses, attach suffix to verb forms if suffix pattern exists.
    for def_text in defs or [raw_meaning.strip()]:
        pos_type, cleaned_meaning = parse_definition_block(def_text)
        
        # If this sense is a verb and we have a suffix pattern, attach it
        word_to_use = base_word
        if suffix_match and pos_type.lower() == "verb":
            word_to_use = base_word + suffix_match.group(1)
        
        rows_to_add.append([frequency, word_to_use, reading, pos_type, cleaned_meaning])

    return rows_to_add


def main():
    html_content = ""

    if os.path.exists(LOCAL_HTML_FILE):
        print(f"Found local file '{LOCAL_HTML_FILE}'. Reading content...")
        with open(LOCAL_HTML_FILE, "r", encoding="utf-8") as f:
            html_content = f.read()
    else:
        print(
            f"Local file '{LOCAL_HTML_FILE}' not found. Downloading from Wiktionary..."
        )
        headers = {
        }
        response = requests.get(URL, headers=headers)

        if response.status_code != 200:
            print(
                f"Failed to retrieve page from URL. Status code: {response.status_code}"
            )
            return
        html_content = response.text

    print("Parsing HTML data...")
    soup = BeautifulSoup(html_content, "html.parser")
    tables = soup.find_all("table", class_="wikitable")

    target_table = None
    for table in tables:
        th_elements = [th.text.strip() for th in table.find_all("th")]
        if "Frequency" in th_elements and "Word" in th_elements:
            target_table = table
            break

    if not target_table:
        print("Could not find the target word list table in the HTML structure.")
        return

    rows = target_table.find_all("tr")
    csv_data = []

    print("Processing rows and extracting features...")
    for row in rows:
        cells = row.find_all("td")
        if not cells:
            continue

        if len(cells) >= 3:
            frequency = cells[0].text.strip()
            raw_word = cells[1].text.strip()
            raw_meaning = cells[2].text.strip()

            # Process row (can return multiple rows for split senses/forms)
            processed_rows = process_entry(frequency, raw_word, raw_meaning)
            csv_data.extend(processed_rows)

    print(f"Saving data to {OUTPUT_FILE}...")
    with open(
        OUTPUT_FILE, mode="w", encoding="utf-8", newline=""
    ) as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(["Frequency", "Word", "Reading", "Type", "Meaning"])
        writer.writerows(csv_data)

    print(f"Successfully processed {len(csv_data)} entries!")


if __name__ == "__main__":
    main()