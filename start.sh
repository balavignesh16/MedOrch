#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$project_dir"

command -v go >/dev/null || { echo "ERROR: Go is not installed or not on PATH." >&2; exit 1; }
command -v node >/dev/null || { echo "ERROR: Node.js is not installed or not on PATH." >&2; exit 1; }
command -v npm >/dev/null || { echo "ERROR: npm is not installed or not on PATH." >&2; exit 1; }
node_major="$(node -p 'process.versions.node.split(`.`)[0]')"
((node_major >= 24)) || { echo "ERROR: Node.js 24 or newer is required. Found major version $node_major." >&2; exit 1; }
[[ -f database/medorch.db ]] || { echo "ERROR: database/medorch.db was not found." >&2; exit 1; }
[[ -d frontend/node_modules ]] || { echo "ERROR: Run 'cd frontend && npm install' first." >&2; exit 1; }
[[ -x engine/venv/bin/python ]] || { echo "ERROR: Create engine/venv and install requirements." >&2; exit 1; }

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

pids=()
cleanup() {
  if ((${#pids[@]})); then
    kill "${pids[@]}" 2>/dev/null || true
  fi
  rm -f "$project_dir/.medorch_ollama.pid"
}
trap cleanup EXIT INT TERM

if [[ "${NVIDIA_BASE_URL:-}" == *"localhost"* || "${NVIDIA_BASE_URL:-}" == *"127.0.0.1"* ]]; then
  if command -v ollama >/dev/null; then
    if curl -s -o /dev/null --max-time 2 http://localhost:11434/api/tags; then
      echo "Ollama is already running."
    else
      echo "Launching Ollama..."
      # Keep the model resident for 30 minutes of inactivity instead of
      # Ollama's 5-minute default. A cold reload of a large model (e.g.
      # qwen2.5:14b on a GPU-constrained machine) can take 45s+, which is
      # an easy way to hit AI_LLM_TIMEOUT_SECONDS on the first question
      # after a short pause between questions.
      OLLAMA_KEEP_ALIVE=30m ollama serve >/dev/null 2>&1 &
      ollama_pid="$!"
      pids+=("$ollama_pid")
      echo "$ollama_pid" > "$project_dir/.medorch_ollama.pid"
      sleep 3
    fi
  else
    echo "WARNING: NVIDIA_BASE_URL points at localhost but ollama is not on PATH. Install it from https://ollama.com." >&2
  fi
fi

(cd gateway && go run .) &
pids+=("$!")

if [[ -n "${NVIDIA_API_KEY:-}" ]]; then
  (cd engine && exec venv/bin/python main.py) &
  pids+=("$!")
else
  echo "AI engine skipped: NVIDIA_API_KEY is not configured. Dashboard mode remains available."
fi

# Load local models in the background so the first question is not slow.
bash scripts/warmup.sh &

(cd frontend && exec npm run dev) &
pids+=("$!")

echo "MedOrch services launched. Press Ctrl+C to stop them."
wait
