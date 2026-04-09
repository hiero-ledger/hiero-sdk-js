#!/bin/bash
# Poll "Test using Node 22" job. Count as SUCCESS when the "Prepare Hiero Solo"
# step logs contain "cquire lock - lock acquired successfully".
# No timeout — polls indefinitely until success string found or step fails.
# Cancel and rerun in both cases. Send EVENT: lines for Slack dispatch.

OWNER="hiero-ledger"
REPO="hiero-sdk-js"
RUN_ID="24186490231"
JOB_NAME="Test using Node 22"
TARGET_STEP="Prepare Hiero Solo"
POLL_INTERVAL=20       # seconds between polls
LOG_FILE="/tmp/smoke-test-monitor.log"
SUCCESS_COUNT=0

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

: > "$LOG_FILE"
log "=== Smoke Test Monitor Started ==="
log "Tracking step '$TARGET_STEP' in job '$JOB_NAME' (run $RUN_ID)"
log "Polls indefinitely until stopped"

# Get current attempt number
CURRENT_ATTEMPT=$(gh api "repos/$OWNER/$REPO/actions/runs/$RUN_ID" --jq '.run_attempt' 2>/dev/null || echo "0")
log "Current run_attempt: $CURRENT_ATTEMPT"

cancel_and_rerun() {
    log "Cancelling workflow run $RUN_ID..."
    gh run cancel "$RUN_ID" --repo "$OWNER/$REPO" 2>&1 | tee -a "$LOG_FILE" || true

    for i in $(seq 1 24); do
        CS=$(gh api "repos/$OWNER/$REPO/actions/runs/$RUN_ID" --jq '.status' 2>/dev/null || echo "unknown")
        if [ "$CS" = "completed" ]; then
            log "Run cancelled/completed"
            break
        fi
        sleep 5
    done

    log "Rerunning workflow run $RUN_ID..."
    gh run rerun "$RUN_ID" --repo "$OWNER/$REPO" 2>&1 | tee -a "$LOG_FILE" || true

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
}

while true; do
    log "Polling attempt $CURRENT_ATTEMPT..."
    while true; do
        # Get job info for current attempt
        JOB_JSON=$(gh api "repos/$OWNER/$REPO/actions/runs/$RUN_ID/attempts/$CURRENT_ATTEMPT/jobs" \
            --jq ".jobs[] | select(.name == \"$JOB_NAME\") | {id, status, conclusion, html_url, steps: [.steps[] | {name, status, conclusion}]}" 2>/dev/null || echo "{}")

        JOB_ID=$(echo "$JOB_JSON" | jq -r '.id // ""')
        JOB_STATUS=$(echo "$JOB_JSON" | jq -r '.status // "pending"')
        JOB_CONCLUSION=$(echo "$JOB_JSON" | jq -r '.conclusion // "null"')
        JOB_URL=$(echo "$JOB_JSON" | jq -r '.html_url // ""')

        STEP_STATUS=$(echo "$JOB_JSON" | jq -r ".steps[] | select(.name == \"$TARGET_STEP\") | .status" 2>/dev/null || echo "")
        STEP_CONCLUSION=$(echo "$JOB_JSON" | jq -r ".steps[] | select(.name == \"$TARGET_STEP\") | .conclusion" 2>/dev/null || echo "")
        ACTIVE_STEP=$(echo "$JOB_JSON" | jq -r '.steps[] | select(.status == "in_progress") | .name' 2>/dev/null || echo "none")

        log "  attempt=$CURRENT_ATTEMPT job=$JOB_ID active=\"$ACTIVE_STEP\" target=$STEP_STATUS/$STEP_CONCLUSION"

        # If the target step completed, check conclusion
        if [ "$STEP_STATUS" = "completed" ]; then
            if [ "$STEP_CONCLUSION" = "success" ]; then
                SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
                log "SUCCESS #$SUCCESS_COUNT — '$TARGET_STEP' passed ($JOB_URL)"
                echo "EVENT:SUCCESS:$SUCCESS_COUNT:${JOB_URL:-https://github.com/$OWNER/$REPO/actions/runs/$RUN_ID}" >> "$LOG_FILE"
                cancel_and_rerun
                break
            else
                log "FAILURE — Step '$TARGET_STEP' completed with $STEP_CONCLUSION after $SUCCESS_COUNT successes ($JOB_URL)"
                echo "EVENT:FAILURE:$SUCCESS_COUNT:${JOB_URL:-https://github.com/$OWNER/$REPO/actions/runs/$RUN_ID}:$STEP_CONCLUSION" >> "$LOG_FILE"
                cancel_and_rerun
                break
            fi
        fi

        # If job completed before step ran (earlier step failed)
        if [ "$JOB_STATUS" = "completed" ] && [ "$STEP_STATUS" != "completed" ] && [ "$STEP_STATUS" != "in_progress" ]; then
            FAILED_STEP=$(echo "$JOB_JSON" | jq -r '.steps[] | select(.conclusion != null and .conclusion != "success" and .conclusion != "skipped") | .name' 2>/dev/null | head -1)
            log "FAILURE — Job completed before reaching '$TARGET_STEP'. Failed step: $FAILED_STEP ($JOB_URL)"
            echo "EVENT:FAILURE:$SUCCESS_COUNT:${JOB_URL:-https://github.com/$OWNER/$REPO/actions/runs/$RUN_ID}:$FAILED_STEP" >> "$LOG_FILE"
            cancel_and_rerun
            break
        fi

        sleep "$POLL_INTERVAL"
    done
done
