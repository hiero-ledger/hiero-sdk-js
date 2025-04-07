const operatorId = sdk.AccountId.fromString("0.0.5684157");
const operatorKey = sdk.PrivateKey.fromStringED25519(
    "0xa241d890c3b2db2b1093383ee65fa48c367e87532e5955ed02686e33391d21f9",
);
const client = sdk.Client.forTestnet().setOperator(operatorId, operatorKey);
document.getElementById("execute").addEventListener("click", executeTx);

function syntaxHighlight(json) {
    json = JSON.stringify(json, null, 2);
    return json
        .replace(/("(\w+)": )/g, '<span class="key">$1</span>')
        .replace(/: "(.*?)"/g, ': <span class="string">"$1"</span>')
        .replace(/: (\d+)/g, ': <span class="number">$1</span>')
        .replace(/: (true|false)/g, ': <span class="boolean">$1</span>')
        .replace(/: null/g, ': <span class="null">null</span>');
}
function executeTx() {
    const accountId = document.getElementById("input-account-id").value;

    // hide the json and show the loading screen

    document.getElementById("json").style.display = "none";
    document.getElementById("loading").style.display = "block";
    const tx = new sdk.AccountInfoQuery()
        .setAccountId(accountId)
        .execute(client)
        .then((data) => {
            // hide the loadiong and show the result
            document.getElementById("json").style.display = "block";
            document.getElementById("json").innerHTML = syntaxHighlight(data);
            document.getElementById("loading").style.display = "none";
        });
}
