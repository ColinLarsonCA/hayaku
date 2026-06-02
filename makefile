run_parser:
	cd data && uv run extract_wiktionary.py

install:
	cd app && npm install

run:
	cd app && npm run dev

download_jmdict:
	python3 data/download_jmdict.py --timeout 20 --retries 2

check_jmdict:
	@test -f data/JMdict_e || (echo "Missing data/JMdict_e" && exit 1)
	@head -n 5 data/JMdict_e | grep -q "<?xml" || (echo "Invalid JMdict_e: missing XML declaration" && exit 1)
	@grep -q "<!DOCTYPE JMdict" data/JMdict_e || (echo "Invalid JMdict_e: missing JMdict DOCTYPE" && exit 1)
	@grep -q "<JMdict>" data/JMdict_e || (echo "Invalid JMdict_e: missing <JMdict> root" && exit 1)
	@tail -n 5 data/JMdict_e | grep -q "</JMdict>" || (echo "Invalid JMdict_e: missing closing </JMdict>" && exit 1)
	@echo "JMdict_e looks valid"

generate_frequency_data:
	python3 data/generate_frequency_ts.py --jmdict data/JMdict_e