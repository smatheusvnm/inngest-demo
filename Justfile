# Inngest demo. Run `just` to list every command.
#
# Ports default to 80/443/8288. If they are busy, put overrides in a .env file:
#   HTTP_PORT=8080
#   HTTPS_PORT=8443
#   INNGEST_PORT=8289

set dotenv-load := true

export HTTP_PORT := env("HTTP_PORT", "80")
export HTTPS_PORT := env("HTTPS_PORT", "443")
export INNGEST_PORT := env("INNGEST_PORT", "8288")

port_suffix := if HTTPS_PORT == "443" { "" } else { ":" + HTTPS_PORT }
app_url := "https://app.localhost" + port_suffix
dev_ui_url := "https://inngest.localhost" + port_suffix

# List all commands
default:
    @just --list --unsorted

# Check required tools and install Python deps locally (for tests, lint and your editor)
setup:
    @command -v docker >/dev/null || (echo "docker not found: install Docker Desktop" && exit 1)
    @command -v uv >/dev/null || (echo "uv not found: brew install uv" && exit 1)
    uv sync
    @echo "Ready. Next: just up"

# Build and start app + Inngest dev server + Caddy in the background
up: _check-ports
    docker compose up -d --build
    @echo ""
    @echo "  App (buttons + live log): {{ app_url }}"
    @echo "  Inngest Dev UI:           {{ dev_ui_url }}   (fallback: http://localhost:{{ INNGEST_PORT }})"
    @echo ""
    @echo "  First time? Run 'just trust' to remove the browser HTTPS warning."

# Stop the stack (keeps Caddy's certificates)
down:
    docker compose down

# Restart all services
restart:
    docker compose restart

# Show service status
ps:
    docker compose ps

# Follow logs: `just logs` for all services, `just logs app` for one
logs service="":
    docker compose logs -f {{ service }}

# Trust Caddy's local CA in the macOS keychain (asks for your password; run once after `just up`)
trust:
    docker compose cp caddy:/data/caddy/pki/authorities/local/root.crt .caddy-root.crt
    sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain .caddy-root.crt
    @echo "Trusted. Restart your browser if it still shows a warning."

# Open the app and the Inngest Dev UI in the browser
open:
    open {{ app_url }}
    open {{ dev_ui_url }}

# Send an event from the terminal: just send demo/order.created '{"order_id": "ord_1"}' 1
send event data="{}" count="1":
    @curl -sk -X POST {{ app_url }}/api/events \
        -H 'content-type: application/json' \
        -d '{"name": "{{ event }}", "data": {{ data }}, "count": {{ count }}}'
    @echo ""

# Run the test suite
test:
    uv run pytest -v

# Check lint and formatting
lint:
    uv run ruff check .
    uv run ruff format --check .

# Format code and apply safe lint fixes
fmt:
    uv run ruff format .
    uv run ruff check --fix .

# Stop the stack and delete volumes (Caddy certificates included)
clean:
    docker compose down -v --remove-orphans

# Fail early with a clear message if another process holds our ports
_check-ports:
    #!/usr/bin/env bash
    # Already running? Then the ports are ours.
    if [ -n "$(docker compose ps --status running -q caddy 2>/dev/null)" ]; then exit 0; fi
    for port in $HTTP_PORT $HTTPS_PORT $INNGEST_PORT; do
      if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
        echo "Port $port is already in use:"
        docker ps --format '  {{{{.Names}}  {{{{.Ports}}' | grep ":$port->" || lsof -nP -iTCP:"$port" -sTCP:LISTEN
        echo ""
        echo "Stop it, or choose other ports in a .env file (see the top of the Justfile / README)."
        exit 1
      fi
    done
