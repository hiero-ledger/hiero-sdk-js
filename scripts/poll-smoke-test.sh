#!/bin/bash
# Poll "Solo Smoke Test" job. Count as SUCCESS when the "Deploy Solo Test Network"
# step passes — don't wait for the full job. Cancel and rerun on success.
# Stop when job hangs >10 min or fails.
# Tracks by run_attempt number.

OWNER="hiero-ledger"
REPO="hiero-sdk-js"
RUN_ID="24127552762"
JOB_NAME="Solo Smoke Test"
SUCCESS_STEP="Deploy Solo Test Network"
HANG_TIMEOUT=600  # 10 minutes
POLL_INTERVAL=30  # seconds between polls
LOG_FILE="/tmp/smoke-test-monitor.log"
SUCCESS_COUNT=0

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

: > "$LOG_FILE"
log "=== Smoke Test Monitor Started ==="
log "Tracking step '$SUCCESS_STEP' in job '$JOB_NAME' (run $RUN_ID)"

# Get current attempt number
CURRENT_ATTEMPT=$(gh api "repos/$OWNER/$REPO/actions/runs/$RUN_ID" --jq '.run_attempt' 2>/dev/null || echo "0")
log "Current run_attempt: $CURRENT_ATTEMPT"

while true; do
    START_TIME=$(date +%s)
    log "Polling attempt $CURRENT_ATTEMPT..."

    while true; do
        # Get job steps for the current attempt
        STEPS_JSON=$(gh api "repos/$OWNER/$REPO/actions/runs/$RUN_ID/attempts/$CURRENT_ATTEMPT/jobs" \
            --jq ".jobs[] | select(.name == \"$JOB_NAME\") | {id, status, conclusion, html_url, steps: [.steps[] | {name, status, conclusion}]}" 2>/dev/null || echo "{}")

        JOB_ID=$(echo "$STEPS_JSON" | jq -r '.id // ""')
        JOB_STATUS=$(echo "$STEPS_JSON" | jq -r '.status // "pending"')
        JOB_CONCLUSION=$(echo "$STEPS_JSON" | jq -r '.conclusion // "null"')
        JOB_URL=$(echo "$STEPS_JSON" | jq -r '.html_url // ""')

        # Check if the target step completed
        STEP_STATUS=$(echo "$STEPS_JSON" | jq -r ".steps[] | select(.name == \"$SUCCESS_STEP\") | .status" 2>/dev/null || echo "")
        STEP_CONCLUSION=$(echo "$STEPS_JSON" | jq -r ".steps[] | select(.name == \"$SUCCESS_STEP\") | .conclusion" 2>/dev/null || echo "")

        # Find currently running step for logging
        ACTIVE_STEP=$(echo "$STEPS_JSON" | jq -r '.steps[] | select(.status == "in_progress") | .name' 2>/dev/null || echo "none")

        log "  attempt=$CURRENT_ATTEMPT job=$JOB_ID active_step=\"$ACTIVE_STEP\" target_step=$STEP_STATUS/$STEP_CONCLUSION"

        # ── Target step completed successfully → count as success ──
        if [ "$STEP_STATUS" = "completed" ] && [ "$STEP_CONCLUSION" = "success" ]; then
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            log "SUCCESS #$SUCCESS_COUNT — '$SUCCESS_STEP' passed! ($JOB_URL)"
            echo "EVENT:SUCCESS:$SUCCESS_COUNT:${JOB_URL:-https://github.com/$OWNER/$REPO/actions/runs/$RUN_ID}" >> "$LOG_FILE"

            # Cancel the running workflow
            log "Cancelling workflow run $RUN_ID..."
            gh run cancel "$RUN_ID" --repo "$OWNER/$REPO" 2>&1 | tee -a "$LOG_FILE" || true

            # Wait for cancellation
            for i in $(seq 1 24); do
                CS=$(gh api "repos/$OWNER/$REPO/actions/runs/$RUN_ID" --jq '.status' 2>/dev/null || echo "unknown")
                if [ "$CS" = "completed" ]; then
                    log "Run cancelled/completed"
                    break
                fi
                sleep 5
            done

            # Rerun
            log "Rerunning workflow run $RUN_ID..."
            gh run rerun "$RUN_ID" --repo "$OWNER/$REPO" 2>&1 | tee -a "$LOG_FILE" || true

            # Wait for new attempt
            EXPECTED=$((CURRENT_ATTEMPT + 1))
            for i in $(seq 1 12); do
                NA=$(gh api "repos/$OWNER/$REPO/actions/runs/$RUN_ID" --jq '.run_attempt' 2>/dev/null || echo "0")
                if [ "$NA" -ge "$EXPECTED" ]; then
                    CURRENT_ATTEMPT="$NA"
                    log "New attempt: $CURRENT_ATTEMPT"
                    break
                fi
                sleep 5
            done
            break
        fi

        # ── Target step failed → count as failure ──
        if [ "$STEP_STATUS" = "completed" ] && [ "$STEP_CONCLUSION" != "success" ] && [ -n "$STEP_CONCLUSION" ]; then
            log "FAILURE — '$SUCCESS_STEP' failed with $STEP_CONCLUSION after $SUCCESS_COUNT successes ($JOB_URL)"
            echo "EVENT:FAILURE:$SUCCESS_COUNT:${JOB_URL:-https://github.com/$OWNER/$REPO/actions/runs/$RUN_ID}:$STEP_CONCLUSION" >> "$LOG_FILE"
            exit 0
        fi

        # ── Job completed before reaching target step (e.g. earlier step failed) ──
        if [ "$JOB_STATUS" = "completed" ] && [ "$STEP_STATUS" != "completed" ]; then
            FAILED_STEP=$(echo "$STEPS_JSON" | jq -r '.steps[] | select(.conclusion != null and .conclusion != "success" and .conclusion != "skipped") | .name' 2>/dev/null | head -1)
            log "FAILURE — Job completed before reaching '$SUCCESS_STEP'. Failed step: $FAILED_STEP ($JOB_URL)"
            echo "EVENT:FAILURE:$SUCCESS_COUNT:${JOB_URL:-https://github.com/$OWNER/$REPO/actions/runs/$RUN_ID}:$FAILED_STEP" >> "$LOG_FILE"
            exit 0
        fi

        # ── Check hang timeout ──
        NOW=$(date +%s)
        ELAPSED=$((NOW - START_TIME))
        if [ "$ELAPSED" -gt "$HANG_TIMEOUT" ]; then
            STUCK_STEP=$(echo "$STEPS_JSON" | jq -r '.steps[] | select(.status == "in_progress") | .name' 2>/dev/null || echo "unknown")
            log "HANG detected after ${ELAPSED}s — stuck on step: $STUCK_STEP"
            echo "EVENT:HANG:$SUCCESS_COUNT:${JOB_URL:-https://github.com/$OWNER/$REPO/actions/runs/$RUN_ID}:$STUCK_STEP" >> "$LOG_FILE"
            exit 0
        fi

        sleep "$POLL_INTERVAL"
    done
done
