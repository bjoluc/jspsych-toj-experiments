up:
	docker-compose up -d

down:
	docker-compose down

attach:
	docker attach webtoj_node_1

dev:
	docker-compose exec node npm run dev

build:
	docker-compose exec node npm run build

package:
	docker-compose exec node npm run package

.PHONY: up down attach dev build package