#!/usr/bin/env bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "  Liminal — Laboratory Register"
echo "  Starting... please wait"
echo "=========================================="

# Use embedded runtime if available, otherwise system Python
if [ -x "$SCRIPT_DIR/runtime/bin/python3" ]; then
    PYTHON="$SCRIPT_DIR/runtime/bin/python3"
elif command -v python3 &> /dev/null; then
    PYTHON=python3
    # Dev mode: install deps if needed
    if [ ! -f ".deps_installed" ]; then
        echo "Installing dependencies..."
        $PYTHON -m pip install --target=./lib -r requirements.txt 2>/dev/null || \
        $PYTHON -m pip install -r requirements.txt
        touch .deps_installed
    fi
else
    echo "ERROR: Python not found. Use a standalone kit or install python3."
    exit 1
fi

export PYTHONPATH="$SCRIPT_DIR/lib:$SCRIPT_DIR:$PYTHONPATH"
mkdir -p data/exports

# Open browser after delay
(sleep 2 && xdg-open http://127.0.0.1:5000 2>/dev/null || true) &

echo ""
echo "  Server running at http://127.0.0.1:5000"
echo "  Press Ctrl+C to stop"
echo ""
$PYTHON -m app.run
