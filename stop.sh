#!/usr/bin/env bash
set -uo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================"
echo "Stopping MedOrch development services"
echo "========================================"

stop_port() {
  local port="$1" label="$2"
  if ! command -v lsof >/dev/null; then
    echo "lsof not found; cannot check port $port for $label." >&2
    return
  fi
  local pids
  pids="$(lsof -ti "tcp:$port" 2>/dev/null || true)"
  if [[ -z "$pids" ]]; then
    echo "$label was not running (port $port free)."
  else
    kill $pids 2>/dev/null || true
    echo "Stopped $label (port $port)."
  fi
}

stop_port 3000 "MedOrch Frontend"
stop_port 50052 "MedOrch AI Engine"
stop_port 50051 "MedOrch Gateway"

# Only stop Ollama if start.sh started it — never kill an instance the user
# is running independently of MedOrch for other tools.
ollama_pidfile="$project_dir/.medorch_ollama.pid"
if [[ -f "$ollama_pidfile" ]]; then
  ollama_pid="$(cat "$ollama_pidfile")"
  if kill "$ollama_pid" 2>/dev/null; then
    echo "Stopped Ollama (started by start.sh, pid $ollama_pid)."
  else
    echo "Ollama (started by start.sh) was not running."
  fi
  rm -f "$ollama_pidfile"
else
  echo "Ollama was not started by start.sh; leaving it running."
fi

echo "Done."
