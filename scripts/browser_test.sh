#!/usr/bin/env bash

./node_modules/.bin/vite --clearScreen false -c vite.config.js serve --port 9001 . &
VITE_PID=$!
sleep 5
echo "Running Playwright tests..."
npx playwright install
npx playwright test test/browser.test.js
PLAYWRIGHT_STATUS=$?
kill -9 $VITE_PID
exit $PLAYWRIGHT_STATUS
