import { proto } from "@hiero-ledger/proto";
import { FileAppendTransactionBody } from "@hiero-ledger/proto/minimal";

// ---------- Bundle size (fetched from /bundle-sizes.json) --------------------

async function renderBundleSizes() {
    const target = document.getElementById("bundle-results");
    try {
        const res = await fetch("/bundle-sizes.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        const workloads = data.workloads ?? [];
        const baseline = workloads[0];

        // Feed the trace chips in the "Why is minimal smaller?" section so
        // the numbers always match what's displayed above.
        for (const w of workloads) {
            const chip = document.querySelector(
                `.trace .chip.total[data-total="${w.id}"]`,
            );
            if (chip) chip.textContent = formatBytes(w.raw);
        }

        target.innerHTML = renderComparison(
            workloads.map((w) => ({
                label: w.label,
                value: w.raw,
                fmt: formatBytes,
            })),
            null,
        );
    } catch (err) {
        target.innerHTML = `<div class="placeholder">No <code>bundle-sizes.json</code> found. Run <code>pnpm measure</code> in this directory, then reload.</div>`;
    }
}

// ---------- Benchmark --------------------------------------------------------

function bench(label, fn, iterations) {
    for (let i = 0; i < 1000; i++) fn(); // warm-up
    const start = performance.now();
    for (let i = 0; i < iterations; i++) fn();
    const elapsedMs = performance.now() - start;
    return {
        label,
        opsPerSec: iterations / (elapsedMs / 1000),
        elapsedMs,
    };
}

function runBenchmark(iterations) {
    const fullPayload = {
        fileID: { shardNum: 0, realmNum: 0, fileNum: 42 },
        contents: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
    };
    const fullMsg = proto.FileAppendTransactionBody.create(fullPayload);
    const fullBytes = proto.FileAppendTransactionBody.encode(fullMsg).finish();

    const minPayload = {
        fileID: { shardNum: 0n, realmNum: 0n, fileNum: 42n },
        contents: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
    };
    const minMsg = FileAppendTransactionBody.fromPartial(minPayload);
    const minBytes = FileAppendTransactionBody.encode(minMsg).finish();

    return {
        encode: {
            full: bench(
                "full",
                () => proto.FileAppendTransactionBody.encode(fullMsg).finish(),
                iterations,
            ),
            minimal: bench(
                "minimal",
                () => FileAppendTransactionBody.encode(minMsg).finish(),
                iterations,
            ),
        },
        decode: {
            full: bench(
                "full",
                () => proto.FileAppendTransactionBody.decode(fullBytes),
                iterations,
            ),
            minimal: bench(
                "minimal",
                () => FileAppendTransactionBody.decode(minBytes),
                iterations,
            ),
        },
    };
}

function renderBenchmark(results) {
    const target = document.getElementById("bench-results");
    target.innerHTML = "";
    for (const op of ["encode", "decode"]) {
        const rows = [
            {
                label: `${op} · full`,
                value: results[op].full.opsPerSec,
                fmt: formatOps,
            },
            {
                label: `${op} · minimal`,
                value: results[op].minimal.opsPerSec,
                fmt: formatOps,
            },
        ];
        target.insertAdjacentHTML("beforeend", renderComparison(rows, null, "higher-is-better"));
    }
    const fullTotal =
        results.encode.full.opsPerSec + results.decode.full.opsPerSec;
    const minTotal =
        results.encode.minimal.opsPerSec + results.decode.minimal.opsPerSec;
    target.appendChild(
        summary(
            `minimal throughput is ${(minTotal / fullTotal).toFixed(2)}× the full package (encode+decode combined)`,
        ),
    );
}

// ---------- Wire format diff -------------------------------------------------

function renderWireDiff() {
    const target = document.getElementById("wire-results");
    const fullBytes = proto.FileAppendTransactionBody.encode(
        proto.FileAppendTransactionBody.create({
            fileID: { shardNum: 0, realmNum: 0, fileNum: 42 },
            contents: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
        }),
    ).finish();
    const minBytes = FileAppendTransactionBody.encode(
        FileAppendTransactionBody.fromPartial({
            fileID: { shardNum: 0n, realmNum: 0n, fileNum: 42n },
            contents: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
        }),
    ).finish();

    const diff = byteDiff(fullBytes, minBytes);

    target.innerHTML = "";
    target.appendChild(wireBlock("full (pbjs)", fullBytes, diff.onlyInFull));
    target.appendChild(wireBlock("minimal (ts-proto)", minBytes, diff.onlyInMinimal));
    target.appendChild(
        summary(
            `full emits ${fullBytes.length} bytes, minimal emits ${minBytes.length}. ` +
                `Both decode back to the same logical message — wire compatible, not byte-identical.`,
        ),
    );
}

// Naive diff: bytes present in one array but not the other, by index.
function byteDiff(a, b) {
    const onlyInA = new Set();
    const onlyInB = new Set();
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
        if (a[i] !== b[i]) {
            if (i < a.length) onlyInA.add(i);
            if (i < b.length) onlyInB.add(i);
        }
    }
    return { onlyInFull: onlyInA, onlyInMinimal: onlyInB };
}

function wireBlock(title, bytes, highlightSet) {
    const wrap = document.createElement("div");
    wrap.className = "wire-block";
    wrap.innerHTML = `<div class="title"><span>${title}</span><span class="meta">${bytes.length} bytes</span></div>`;
    const hex = document.createElement("div");
    hex.className = "hex";
    for (let i = 0; i < bytes.length; i++) {
        const b = document.createElement("span");
        b.className = "byte" + (highlightSet.has(i) ? " extra" : "");
        b.textContent = bytes[i].toString(16).padStart(2, "0");
        hex.appendChild(b);
    }
    wrap.appendChild(hex);
    return wrap;
}

// ---------- Shared rendering helpers -----------------------------------------

function renderComparison(rows, heading, mode = "lower-is-better") {
    const max = Math.max(...rows.map((r) => r.value));
    const winnerIdx =
        mode === "lower-is-better"
            ? rows.findIndex(
                  (r) => r.value === Math.min(...rows.map((r) => r.value)),
              )
            : rows.findIndex(
                  (r) => r.value === Math.max(...rows.map((r) => r.value)),
              );

    const headingHtml = heading ? `<div class="hint">${heading}</div>` : "";
    const rowsHtml = rows
        .map((r, i) => {
            const pct = max === 0 ? 0 : (r.value / max) * 100;
            const good = i === winnerIdx ? " good" : "";
            return `
<div class="row${good}">
    <div class="label">${r.label}</div>
    <div class="bar" style="--fill: ${pct}%"></div>
    <div class="value">${r.fmt(r.value)}</div>
</div>`;
        })
        .join("");
    return headingHtml + rowsHtml;
}

function summary(text) {
    const el = document.createElement("div");
    el.className = "summary";
    el.textContent = text;
    return el;
}

function horizontalRule(html) {
    const wrap = document.createElement("div");
    wrap.innerHTML = html;
    return wrap;
}

function formatBytes(n) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function formatOps(n) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M ops/s`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k ops/s`;
    return `${n.toFixed(0)} ops/s`;
}

function saving(before, after) {
    return `${(100 * (1 - after / before)).toFixed(1)}%`;
}

// ---------- Wiring ------------------------------------------------------------

document.getElementById("run").addEventListener("click", async () => {
    const input = document.getElementById("iterations");
    const button = document.getElementById("run");
    const status = document.getElementById("status");
    const iterations = Math.max(100, parseInt(input.value, 10) || 20000);

    button.disabled = true;
    status.textContent = `Running ${iterations.toLocaleString()} iterations…`;
    // Yield so the status render happens before the synchronous loop.
    await new Promise((r) => requestAnimationFrame(r));
    try {
        renderBenchmark(runBenchmark(iterations));
        status.textContent = `Done.`;
    } catch (err) {
        status.textContent = `Error: ${err.message}`;
        console.error(err);
    } finally {
        button.disabled = false;
    }
});

renderBundleSizes();
renderWireDiff();
document.getElementById("run").click();
