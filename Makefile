.PHONY: dev build submit

dev:
	cd app && bun run ios

build:
	cd app && bun run build

submit:
	cd app && eas submit --platform all

