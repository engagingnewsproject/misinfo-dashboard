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

# Start the Firebase Emulator and import the test data in the background
echo "Starting Firebase Emulators with imported test data..."
export NEXT_PUBLIC_USE_EMULATORS=true
firebase emulators:start --import=./emulator-data &

# Save the PID of the Firebase emulator process
EMULATOR_PID=$!

# Wait a few seconds to ensure the emulator has started
sleep 20

# Start the Next.js development server
echo "Starting Next.js development server..."
yarn next dev

# Wait for the Next.js server to exit before continuing
wait $EMULATOR_PID