#!/usr/bin/env bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "  MSF Laboratory Registration System"
echo "  Starting... please wait"
echo "=========================================="

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: python3 not found"
    exit 1
fi

# Install deps if needed
if [ ! -f ".deps_installed" ]; then
    echo "Installing dependencies..."
    python3 -m pip install --target=./lib -r requirements.txt 2>/dev/null || \
    python3 -m pip install -r requirements.txt
    touch .deps_installed
fi

export PYTHONPATH="$SCRIPT_DIR/lib:$SCRIPT_DIR:$PYTHONPATH"
mkdir -p data/exports

# Open browser after delay
(sleep 2 && xdg-open http://127.0.0.1:5000 2>/dev/null || true) &

echo ""
echo "  Server running at http://127.0.0.1:5000"
echo "  Press Ctrl+C to stop"
echo ""
python3 -m app.run
