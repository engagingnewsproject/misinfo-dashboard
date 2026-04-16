#!/bin/bash

# Function to cleanly shut down all running emulators
cleanup() {
  echo "Stopping Firebase Emulators..."
  # Attempt to kill background jobs gracefully
  kill $(jobs -p) 2>/dev/null || true
  
  # Forcefully kill any lingering Firebase emulator processes if needed
  pkill -f 'firebase' || true
}

# Set the trap to call the cleanup function on script exit (Ctrl + C)
trap cleanup EXIT

# Start the Firebase Emulator and import the test data in the background.
# Omit the Hosting emulator: it runs its own Next dev server (e.g. :5002) and
# conflicts with `next dev` on :3000, and browsing that URL hits API-key referrer blocks.
echo "Starting Firebase Emulators with imported test data..."
export NEXT_PUBLIC_USE_EMULATORS=true
firebase emulators:start --import=./emulator-data --only auth,functions,firestore,storage,extensions &

# Save the PID of the Firebase emulator process
EMULATOR_PID=$!

# Wait until Auth emulator accepts connections (avoids Next starting while 9099 is still down).
# Fixed sleeps often race slow machines; refusing to start avoids confusing auth/network-request-failed on login.
AUTH_EMULATOR_HOST="127.0.0.1"
AUTH_EMULATOR_PORT=9099
MAX_WAIT_SECONDS=90
echo "Waiting for Auth emulator on ${AUTH_EMULATOR_HOST}:${AUTH_EMULATOR_PORT} (up to ${MAX_WAIT_SECONDS}s)..."
for ((i = 1; i <= MAX_WAIT_SECONDS; i++)); do
	if (echo >/dev/tcp/${AUTH_EMULATOR_HOST}/${AUTH_EMULATOR_PORT}) 2>/dev/null; then
		echo "Auth emulator is ready."
		break
	fi
	if [ "$i" -eq "$MAX_WAIT_SECONDS" ]; then
		echo ""
		echo "ERROR: Auth emulator never became reachable on port ${AUTH_EMULATOR_PORT}."
		echo "  - Check the Firebase emulator output above for errors."
		echo "  - Or run: npm run dev:live   (Next only, production Firebase — no emulators)."
		echo ""
		exit 1
	fi
	sleep 1
done

# Start the Next.js development server
echo "Starting Next.js development server..."
echo ""
echo ">>> Open the app at http://localhost:3000 (not the Hosting emulator URL)."
echo ""
npx next dev

# Wait for the Next.js server to exit before continuing
wait $EMULATOR_PID