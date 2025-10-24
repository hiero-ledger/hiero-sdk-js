document
    .getElementsByClassName("run-action")[0]
    .addEventListener("click", executeTx);

function syntaxHighlight(json) {
    json = JSON.stringify(json, null, 2);
    return json
        .replace(/("(\w+)": )/g, '<span class="key-color">$1</span>')
        .replace(/: "(.*?)"/g, ': <span class="string-color">"$1"</span>')
        .replace(/: (\d+)/g, ': <span class="number-color">$1</span>')
        .replace(/: (true|false)/g, ': <span class="boolean-color">$1</span>')
        .replace(/: null/g, ': <span class="null-color">null</span>');
}

function executeTx() {
    // get input values
    const operatorKeyValue =
        document.getElementsByClassName("operator-key")[0].value;
    const operatorIdValue =
        document.getElementsByClassName("operator-id")[0].value;
    const accountId =
        document.getElementsByClassName("input-account-id")[0].value;

    // setup client and operator
    const operatorId = sdk.AccountId.fromString(operatorIdValue);
    const operatorKey = sdk.PrivateKey.fromStringECDSA(operatorKeyValue);
    const client = sdk.Client.forTestnet().setOperator(operatorId, operatorKey);

    // start loading until the query is executed
    console.log(document.getElementsByClassName("json"));
    document.getElementsByClassName("json-container")[0].style.display = "none";
    document.getElementsByClassName("loading")[0].style.display = "block";

    // execute the query
    new sdk.AccountInfoQuery()
        .setAccountId(accountId)
        .execute(client)
        .then((data) => {
            // hide the loading and show the result
            document.getElementsByClassName("json-container")[0].style.display =
                "block";
            document.getElementsByClassName("loading")[0].style.display =
                "none";
            document.getElementsByClassName("json-container")[0].innerHTML =
                syntaxHighlight(data);
        });
}
