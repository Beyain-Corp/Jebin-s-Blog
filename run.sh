#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

mkdir -p bin
javac -cp "lib/gson-2.10.1.jar" -d bin src/com/jebin/blog/*.java

echo "Starting Java BlogServer on http://localhost:3000..."
exec java -cp "bin:lib/gson-2.10.1.jar" com.jebin.blog.BlogServer "$@"

