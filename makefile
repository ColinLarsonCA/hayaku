run_parser:
	cd data && uv run extract_wiktionary.py

install:
	cd app && npm install

run:
	cd app && npm run dev