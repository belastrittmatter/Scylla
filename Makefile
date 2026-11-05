.PHONY: db-up db-down db-logs db-reset

db-up:
	docker compose up -d --wait

db-down:
	docker compose down

db-logs:
	docker compose logs -f postgres

db-reset:
	docker compose down -v
	docker compose up -d --wait
