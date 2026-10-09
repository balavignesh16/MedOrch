#!/usr/bin/env bash
# Regenerates all language stubs from protos/healthcare_analytics.proto.
#
# This script is the single source of truth for how generated protobuf code
# is produced. Generated files must never be hand-edited; if they drift from
# what this script produces, re-run it and commit the regenerated output.
#
# Requirements:
#   Python: grpcio-tools (already in engine/requirements.txt)
#   Go:     protoc (vendored at gateway/protoc-bin/bin/protoc.exe on Windows,
#           or on PATH elsewhere), plus protoc-gen-go and protoc-gen-go-grpc
#           (`go install google.golang.org/protobuf/cmd/protoc-gen-go@latest`
#            and `go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest`)
#
# The frontend intentionally has no generated stubs: it loads the .proto file
# directly at runtime via @grpc/proto-loader. Do not add frontend stub
# generation here unless that architecture is deliberately changed.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROTO_DIR="$ROOT_DIR/protos"
PROTO_FILE="$PROTO_DIR/healthcare_analytics.proto"

echo "Generating Python gRPC stubs into $ROOT_DIR/engine ..."
python -m grpc_tools.protoc \
  -I "$PROTO_DIR" \
  --python_out="$ROOT_DIR/engine" \
  --grpc_python_out="$ROOT_DIR/engine" \
  "$PROTO_FILE"

# Newer grpcio-tools emits a plain absolute "import healthcare_analytics_pb2"
# in the generated _grpc.py file, which breaks when engine/ is imported as a
# package (engine.main does `from . import healthcare_analytics_pb2_grpc`).
# Rewrite it to the same try-relative/except-absolute pattern engine/main.py
# already uses, so the module works both as a package member and as a
# directly-run script.
python - "$ROOT_DIR/engine/healthcare_analytics_pb2_grpc.py" <<'PYEOF'
import re
import sys

path = sys.argv[1]
text = open(path, encoding="utf-8").read()
absolute_import = "import healthcare_analytics_pb2 as healthcare__analytics__pb2\n"
fallback_block = (
    "try:\n"
    "    from . import healthcare_analytics_pb2 as healthcare__analytics__pb2\n"
    "except ImportError:\n"
    "    import healthcare_analytics_pb2 as healthcare__analytics__pb2\n"
)
if absolute_import in text and fallback_block not in text:
    text = text.replace(absolute_import, fallback_block, 1)
    open(path, "w", encoding="utf-8").write(text)
PYEOF

if command -v protoc >/dev/null 2>&1; then
  PROTOC_BIN="protoc"
elif [ -x "$ROOT_DIR/gateway/protoc-bin/bin/protoc.exe" ]; then
  PROTOC_BIN="$ROOT_DIR/gateway/protoc-bin/bin/protoc.exe"
else
  echo "protoc not found on PATH or at gateway/protoc-bin/bin/protoc.exe" >&2
  exit 1
fi

echo "Generating Go gRPC stubs into $ROOT_DIR/gateway/pb using $PROTOC_BIN ..."
"$PROTOC_BIN" \
  -I "$PROTO_DIR" \
  --go_out="$ROOT_DIR/gateway/pb" --go_opt=paths=source_relative \
  --go-grpc_out="$ROOT_DIR/gateway/pb" --go-grpc_opt=paths=source_relative \
  "$PROTO_FILE"

echo "Done. Review the diff in engine/healthcare_analytics_pb2*.py and gateway/pb/*.pb.go."
