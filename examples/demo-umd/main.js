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
    // get input values
    const operatorKeyValue = document.getElementById("operator-key").value;
    const operatorIdValue = document.getElementById("operator-id").value;
    const accountId = document.getElementById("input-account-id").value;

    // setup client and operator
    const operatorId = sdk.AccountId.fromString(operatorIdValue);
    const operatorKey = sdk.PrivateKey.fromStringED25519(operatorKeyValue);
    const client = sdk.Client.forTestnet().setOperator(operatorId, operatorKey);

    // start loading until the query is executed
    document.getElementById("json").style.display = "none";
    document.getElementById("loading").style.display = "block";

    // execute the query
    new sdk.AccountInfoQuery()
        .setAccountId(accountId)
        .execute(client)
        .then((data) => {
            // hide the loading and show the result
            document.getElementById("json").style.display = "block";
            document.getElementById("loading").style.display = "none";
            document.getElementById("json").innerHTML = syntaxHighlight(data);
        });
}
