#!/usr/bin/env bash
# Loads the local Ollama models into memory so the first assistant question after a
# restart is not slow. Safe to run any time; skips anything not installed or not local.
set -uo pipefail

OLLAMA_URL="${OLLAMA_URL:-http://localhost:11434}"
WAIT_SECONDS="${WAIT_SECONDS:-60}"

if [[ -n "${NVIDIA_BASE_URL:-}" && ! "${NVIDIA_BASE_URL}" =~ (localhost|127\.0\.0\.1) ]]; then
  echo "Default model is hosted (${NVIDIA_BASE_URL}); nothing to warm up."
  exit 0
fi

tags=""
for ((i = 0; i < WAIT_SECONDS / 2; i++)); do
  tags="$(curl -s --max-time 3 "${OLLAMA_URL}/api/tags" || true)"
  [[ -n "$tags" ]] && break
  sleep 2
done
if [[ -z "$tags" ]]; then
  echo "Ollama did not respond at ${OLLAMA_URL} within ${WAIT_SECONDS}s; skipping warm-up."
  exit 0
fi

for model in "${NVIDIA_MODEL:-}" "qwen2.5:14b-instruct"; do
  [[ -z "$model" ]] && continue
  if ! grep -q "\"name\":\"${model}\"" <<<"$tags"; then
    echo "Skipping ${model} (not installed)."
    continue
  fi
  start=$(date +%s)
  if curl -s --max-time 180 "${OLLAMA_URL}/api/generate" \
    -d "{\"model\":\"${model}\",\"prompt\":\"ok\",\"stream\":false,\"keep_alive\":\"30m\",\"options\":{\"num_predict\":1}}" >/dev/null; then
    echo "Warmed ${model} in $(( $(date +%s) - start ))s"
  else
    echo "Could not warm ${model}."
  fi
done
