.PHONY: self-test dev build start test

self-test:
	sh scripts/self-test.sh

dev:
	npm run dev

build:
	npm run build

start:
	npm start

test:
	npm test
