BUMP ?= patch

.PHONY: dev build submit bump

dev:
	cd app && bun run ios

build:
	cd app && bun run build

submit:
	cd app && bun run submit

bump:
	cd app && bun run bump-version $(BUMP)
	$(MAKE) build
	$(MAKE) submit
