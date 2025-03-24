### Renamed `Time` -> `Timestamp`

### Renamed `Ed25519PublicKey` -> `PublicKey`
    * Added `verify(Uint8Array, Uint8Array): boolean`
        * Verifies a message was signe by the respective private key.
    * Added `verifyTransaction(Transaction): boolean`
        * Verifies the transaction was signed by the respective private key.
    * Removed`toString(boolean): string`

### Renamed `Ed25519PrivateKey` -> `PrivateKey`
    * Added `signTransaction(Transaction): Uint8Array`
        * Signs the `Transaction` and returns the signature.
    * Added `publicKey: PublicKey`
    * Added `fromLegacyMnemonic(Uint8Array): PrivateKey`
    * Added `isDerivable(): boolean`
    * Removed `Promise<PrivateKey> derive2(number)`
        * This is now default behavior for `PrivateKey.derive()`

### Removed `ThresholdKey`
    * Use `KeyList.setThreshold()` instead

### Renamed `PublicKey` -> `Key`
    * Addeded by `PublicKey`
    * Addeded by `PrivateKey`
    * Addeded by `KeyList`
    * Addeded by `ContractId`

### `KeyList`
    * Exposed `threshold: number`
    * Added `of(Key[]): KeyList`
    * Added `from(ArrayLike<Key>): KeyList`

### `Mnemonic`
    * Added `Mnemonic.fromWords(string[])`
    * Added `toPrivateKey(string): PrivateKey`
    * Added `Promise<Mnemonic> generate12()`
    * Removed `Mnemonic({ words, legacy}: { words: string[], legacy: boolean }): new`
        * Use `Mnemonic.fromWords(string[])` instead.
    * Removed `validate(): MnemonicValidationResult`

### Renamed `MnemonicValidationResult` -> `BadMnemonicError`
    * Added `mnemonic: Mnemonic`
    * Added `reason: BadMnemonicReason`
    * Removed`isOk(): boolean`
    * Removed`toString(): string`
    * Removed`status: MnemonicValidationStatus`

### Renamed `MnemonicValidationStatus` -> `BadMnemonicReason`
    * Removed `Ok`
    * Removed `UnknownLegacyWords`

### Removed `MirrorClient`
    * Use `Client` instead, and set the mirror network using `setMirrorNetwork()`

### Renamed `MirrorSubscriptionHandle` -> `SubscriptionHandle`

### Renamed `QueryBuilder` -> `Query`
    * Changed `Promise<number> getCost(Client)` -> `Promise<Hbar> getCost(Client)`
    * Removed `setPaymentTransaction()`
    * Removed `setQueryPayment(number)`
    * Removed `setMaxQueryPayment(number)`

### Combined `TransactionBuilder` and `Transaction`
    * Added `fromBytes(Uint8Array): Transaction`
    * Added `toBytes(): Uint8Array`
    * Added `transactionId: TransactionId`
    * Added `maxTransactionFee: Hbar`
    * Added `transactionMemo: string`
    * Added `Map<AccountId, Uint8Array> getTransactionHashPerNode()`
    * Added `transactionValidDuration: Duration`
    * Added `signWithOpeator(Client): Transaction`
    * Added `addSignature(PublicKey, Uint8Array): Transaction`
    * Added `Map<AccountId, Map<PublicKey, Uint8Array>> getSignatures()`
    * Changed `Promise<TransactionId> execute(Client)` -> `Promise<TransactionResponse> execute(Client)`
    * Renamed `hash()` -> `Uint8Array getTransactionHash(): Uint8Array`
    * Renamed `build(null)` -> `Transaction freeze(): Transaction`
    * Renamed `build(Client)` -> `Transaction freezeWith(Client): Transaction`
    * Removed `id: TransactionId`
    * Removed `setMaxQueryPayment(number)`
    * Renamed `setNodeId(AccountId)` -> `setNodeAccountIds(AccountId[])`
    * Removed `Promise<Hbar> getCost(Client)`
    * Removed `setGenerateRecord(boolean)`

### `AccountBalanceQuery` extends [Query](#renamed-querybuilder-query)
    * Added `accountId: AccountId`
    * Added `contractId: ContractId`
    * Added `setContractId(ContractId)`
    * Changed `execute(Client)` -> `AccountBalance execute(Client): Hbar`

### Added `AccountBalance`
    * Added `balance: Hbar`
    * Added `Map<TokenId, number> tokenBalances`

### `AccountCreateTransaction` extends [Transaction](#combined-transactionbuilder-and-transaction)
    * Added `key: Key`
    * Added `initialBalance: Hbar`
    * Added `receiverSignatureRequired: boolean`
    * Added `proxyAccountId: AccountId`
    * Added `autoRenewPeriod: Duration`
    * Removed `setSendRecordThreshold(number)` and `setSendRecordThreshold(Hbar)`
    * Removed `setReceiveRecordThreshold(number)` and `setReceiveRecordThreshold(Hbar)`

### `AccountDeleteTransaction` extends [Transaction](#combined-transactionbuilder-and-transaction)
    * Added `accountId: AccountId`
    * Added `transferAccountId: AccountId`
    * Renamed `setDeleteAccountId()` -> `setAccountId()`

### `AccountId`
    * Added `toBytes(): Uint8Array`
    * Added `fromBytes(Uint8Array): AccountId`
    * Renamed `account: number` -> `num: number`

### `AccountInfo`
    * Added `toBytes(): Uint8Array`
    * Added `fromBytes(Uint8Array): AccountInfo`
    * Added `LiveHash[] liveHashes`
    * Renamed `generateSendRecordThreshold` -> `sendRecordThreshold`
    * Renamed `generateReceiveRecordThreshold` -> `receiveRecordThreshold`

### `AccountInfoQuery` extends [Query](#renamed-querybuilder-query)
    * Added `accountId: AccountId`

### `AccountRecordsQuery` extends [Query](#renamed-querybuilder-query)
    * Added `accountId: AccountId`

### `AccountStakersQuery` extends [Query](#renamed-querybuilder-query)
    * Added `accountId: AccountId`

### `AccountUpdateTransaction` extends [Transaction](#combined-transactionbuilder-and-transaction)
    * Added `accountId: AccountId`
    * Added `key: Key`
    * Added `initialBalance: Hbar`
    * Added `receiverSignatureRequired: boolean`
    * Added `proxyAccountId: AccountId`
    * Added `autoRenewPeriod: Duration`
    * Added `expirationTime: Timestamp`
    * Removed `setSendRecordThreshold(number)` and `setSendRecordThreshold(Hbar)`
    * Removed `setReceiveRecordThreshold(number)` and `setReceiveRecordThreshold(Hbar)`

### Removed `CryptoTransferTranscation`
    * Use `TransferTransaction` instead.

### `TransferTransaction` extends [Transaction](#combined-transactionbuilder-and-transaction)
    * Added `addTokenTransfer(TokenId, AccountId, number): TransferTransaction`
    * Added `Map<TokenId, Map<AccountId, number>> getTokenTransfers()`
    * Added `addHbarTransfer(AccountId, Hbar): TransferTransaction`
    * Added `Map<AccountId, Hbar> getHbarTransfers()`

### Renamed `ContractBytecodeQuery` -> `ContractByteCodeQuery` extends [Query](#renamed-querybuilder-query)
    * Added `contractId: ContractId`

### `ContractCallQuery` extends [Query](#renamed-querybuilder-query)
    * Added `contractId: ContractId`
    * Added `gas: number`
    * Added `getFunctionParameters(): Uint8Array`

### `ContractCreateTransaction` extends [Transaction](#combined-transactionbuilder-and-transaction)
    * Added `bytecodeFileId: FileId`
    * Added `adminKey: Key`
    * Added `gas: number`
    * Added `initialBalance: Hbar`
    * Added `autoRenewDuration: Duration`
    * Added `proxyAccountId: AccountId`
    * Added `contractMemo: string`
    * Added `getConstructorParameters(): Uint8Array`

### `ContractDeleteTransaction` extends [Transaction](#combined-transactionbuilder-and-transaction)
    * Added `contractId: ContractId`
    * Added `transferAccountId: AccountId`
    * Added `transferContractId: ContractId`

### `ContractExecuteTransaction` extends [Transaction](#combined-transactionbuilder-and-transaction)
    * Added `contractId: ContractId`
    * Added `gas: number`
    * Added `payableAmount: Hbar`
    * Added `getFunctionParameters(): Uint8Array`

### `ContractId`
    * Added `toBytes(): Uint8Array`
    * Added `fromBytes(Uint8Array): ContractId`
    * Renamed `contract: number` -> `num: number`

### `ContractInfo`
    * Added `toBytes(): Uint8Array`
    * Added `isDeleted: boolean`
    * Added `fromBytes(Uint8Array): ContractInfo`
    * Changed `autoRenewPeriod: number` -> `autoRenewPeriod: Duration`

### `ContractInfoQuery` extends [Query](#renamed-querybuilder-query)
    * Added `contractId: ContractId`

### Removed `ContractRecordsQuery`

### `ContractUpdateTransaction` extends [Transaction](#combined-transactionbuilder-and-transaction)
    * Added `contractId: ContractId`
    * Added `bytecodeFileId: FileId`
    * Added `adminKey: Key`
    * Added `autoRenewDuration: Duration`
    * Added `proxyAccountId: AccountId`
    * Added `contractMemo: string`
    * Added `expirationTime: Timestamp`

### `FileAppendTransaction`
    * Added `fileId: FileId`
    * Added `maxChunks: number`
    * Added `getContents(): Uint8Array`
    * Added `setMaxChunks(number)`

### `FileContentsQuery`
    * Added `fileId: FileId`

### `FileCreateTransaction`
    * Added `contents: Uint8Array`
    * Added `Key[] keys`
    * Added `expirationTime: Timestamp`
    * Renamed `addKey(Key)` -> `setKeys(Key...)`

### `FileDeleteTransaction`
    * Added `fileId: FileId`

### `FileId`
    * Added `toBytes(): Uint8Array`
    * Added `fromBytes(Uint8Array): FileId`
    * Renamed `file: number` -> `num: number`
    * Removed`fromSolidityAddress(): FileId`
    * Removed`toSolidityAddress(): string`

### `FileInfo`
    * Added `toBytes(): Uint8Array`
    * Added `fromBytes(Uint8Array): FileInfo`
    * Update `PublicKey[] keys` -> `keys: KeyList`

### `FileInfoQuery`
    * Added `fileId: FileId`

### `FileUpdateTransaction`
    * Added `fileId: FileId`
    * Added `getContents(): Uint8Array`
    * Added `Collection<Key> getKeys()`
    * Added `expirationTime: Timestamp`
    * Renamed `addKey(Key)` -> `setKeys(Key...)`

### Renamed  `MirrorConsensusTopicResponse` -> `TopicMessage`
    * Renamed `message: Uint8Array` -> `contents: Uint8Array`

### Renamed `MirrorConsensusTopicChunk` -> `TopicMessageChunk`

### Renamed `MirrorTopicMessageQuery` -> `TopicMessageQuery`
    * Added `setErrorHandler((Throwable, TopicMessage): void)`
        * This error handler will be called if the max retry count is exceeded, or
        * if the subscribe callback errors out for a specific `TopicMessage`
    * Changed `subscribe(MirrorClient, (MirrorConsensusTopicResponse): void, (Errror): void)` -> `subscribe(Client, (TopicMessage): void): MirrorSubscriptionHandle`
        * Use `setErrorHandler()` instead of passing it in as the third parameter.

### Renamed `ConsensusTopicCreateTransaction` -> `TopicCreateTransaction`
    * Added `topicMemo: string`
    * Added `adminKey: Key`
    * Added `submitKey: Key`
    * Added `autoRenewDuration: Duration`
    * Added `autoRenewAccountId: AccountId`
    * Removed `setAutoRenewAccount(AccountId)`

### Renamed `ConsensusTopicDeleteTransaction` -> `TopicDeleteTransaction`
    * Added `topicId: TopicId`

### Renamed `ConsensusMessageSubmitTransaction` -> `TopicMessageSubmitTransaction`
    * Added `topicId: TopicId`
    * Added `getMessage(): Uint8Array`
    * Added `maxChunks: number`
    * Added `setMaxChunks(number)`

### Renamed `ConsensusTopicId` -> `TopicId`
    * Renamed `topic: number` -> `num: number`

### Renamed `ConsensusTopicInfo` -> `TopicInfo`
    * Added `topicId: TopicId`

### Renamed `ConsensusTopicInfoQuery` -> `TopicInfoQuery`
    * Added `topicId: TopicId`

### Renamed `ConsensusTopicUpdateTransaction` -> `TopicUpdateTransaction`
    * Added `topicId: TopicId`
    * Added `topicMemo: string`
    * Added `adminKey: Key`
    * Added `submitKey: Key`
    * Added `autoRenewDuration: Duration`
    * Added `autoRenewAccountId: AccountId`

### `TokenAssociateTransaction` extends [Transaction](#combined-transactionbuilder-and-transaction)
    * Added `accountId: AccountId`
    * Added `tokenIds: TokenId[]`
    * Renamed `addTokenId(TokenId)` -> `setTokenIds(TokenId[])`

### `TokenBurnTransaction` extends [Transaction](#combined-transactionbuilder-and-transaction)
    * Added `tokenId: TokenId`
    * Added `amount: number`

### `TokenCreateTransaction` extends [Transaction](#combined-transactionbuilder-and-transaction)
    * Added `treasuryAccountId: AccountID`
    * Added `adminKey: Key`
    * Added `kycKey: Key`
    * Added `supplyKey: Key`
    * Added `wipeKey: Key`
    * Added `freezeKey: Key`
    * Added `freezeDefault: boolean`
    * Added `expirationTime: Timestamp`
    * Added `autoRenewAccountId: AccountId`
    * Added `autoRenewPeriod: Duration`
    * Added `decimals: number`
    * Renamed `setName(string)` ->`setTokenName(string)`
    * Renamed `setSymbol(string)` ->`setTokenSymbol(string)`
    * Renamed `setTreasury(AccountId)` ->`setTreasuryAccountId(AccountId)`
    * Renamed `setAutoRenewAccount(AccountId)` ->`setAutoRenewAccountId(AccountId)`

### `TokenDeleteTransaction` extends [Transaction](#combined-transactionbuilder-and-transaction)
    * Added `tokenId: TokenId`

### `TokenDisassociateTransaction` extends [Transaction](#combined-transactionbuilder-and-transaction)
    * Added `accountId: AccountId`
    * Added `tokenIds: TokenId[]`
    * Renamed `addTokenId(TokenId)` -> `setTokenIds(TokenId[])`

### `TokenFreezeTransaction` extends [Transaction](#combined-transactionbuilder-and-transaction)
    * Added `tokenId: TokenId`
    * Added `accountId: AccountId`

### `TokenGrantKycTransaction` extends [Transaction](#combined-transactionbuilder-and-transaction)
    * Added `tokenId: TokenId`
    * Added `accountId: AccountId`

### `TokenId`
    * Added `toBytes(): Uint8Array`
    * Added `fromBytes(Uint8Array): TokenId`

### `TokenInfo`
    * Added `toBytes(): Uint8Array`
    * Added `fromBytes(Uint8Array): TokenInfo`
    * Renamed `treasury: AccountId` -> `treasuryAccountId: AccountId`
    * Renamed `expiry: Timestamp` -> `expirationTime: Timestamp`

### `TokenInfoQuery` extends [Query](#renamed-querybuilder-query)
    * Added `tokenId: TokenId`

### `TokenMintTransaction` extends [Transaction](#combined-transactionbuilder-and-transaction)
    * Added `tokenId: TokenId`
    * Added `amount: number`

### `TokenRevokeKycTransaction` extends [Transaction](#combined-transactionbuilder-and-transaction)
    * Added `tokenId: TokenId`
    * Added `accountId: AccountId`

### Removed `TokenTransferTransaction`
    * Use `TransferTransaction` instead.

### `TokenUnfreezeTransaction` extends [Transaction](#combined-transactionbuilder-and-transaction)
    * Added `tokenId: TokenId`
    * Added `accountId: AccountId`

### `TokenUpdateTransaction` extends [Transaction](#combined-transactionbuilder-and-transaction)
    * Added `tokenName: string`
    * Added `tokenSymbol: string`
    * Added `treasuryAccountId: AccountID`
    * Added `adminKey: Key`
    * Added `kycKey: Key`
    * Added `supplyKey: Key`
    * Added `wipeKey: Key`
    * Added `freezeKey: Key`
    * Added `expirationTime: Timestamp`
    * Added `autoRenewAccountId: AccountId`
    * Added `autoRenewPeriod: Duration`
    * Added `decimals: number`
    * Renamed `setName(string)` ->`setTokenName(string)`
    * Renamed `setSymbol(string)` ->`setTokenSymbol(string)`
    * Renamed `setTreasury(AccountId)` ->`setTreasuryAccountId(AccountId)`
    * Renamed `setAutoRenewAccount(AccountId)` ->`setAutoRenewAccountId(AccountId)`

### `TokenWipeTransaction` extends [Transaction](#combined-transactionbuilder-and-transaction)
    * Added `tokenId: TokenId`
    * Added `accountId: AccountId`
    * Added `amount: Long`

### `FreezeTransaction`
    * Added `startTime: { hour: number; minute: number }`
    * Added `endTime: { hour: number; minute: number }`

### Removed `HbarRangeError`
    * If `Hbar` is out of range `Hedera` will error instead.

### Removed `HederaError`
    * No replacement.

### Removed `TinybarValueError`
    * No replacement.

### Renamed `HederaPrecheckStatusError` -> `PrecheckStatusError`

### Renamed `HederaReceiptStatusError` -> `ReceiptStatusError`

### Removed `HederaRecordStatusError`
    * `ReceiptStatusError` will be thrown instead.

### Removed`HederaStatusError`
    * A `PrecheckStatusError` or `ReceiptStatusError` will be thrown instead.

### Removed `LocalValidationError`
    * No replacement. Local validation is no numberer done.

### Removed `ValidationError`
    * No replacement. Local validation is no numberer done.

### Removed `BadPemFileError`
    * `BadKeyError` will be thrown instead.

### `SystemDeleteTransaction`
    * Added `fileId: FileId`
    * Added `contractId: ContractId`
    * Added `expirationTime: Timestamp`
    * Removed `setId(FileIdLike | ContractIdLike)`

### `SystemUndeleteTransaction`
    * Added `fileId: FileId`
    * Added `contractId: ContractId`
    * Removed `setId(FileIdLike | ContractIdLike)`

### `TransactionId`
    * Added `toBytes(): Uint8Array`
    * Added `fromBytes(Uint8Array): TransactionId`
    * Removed `withValidStart(AccountId, Timestamp): TransactionId`
        * Use `new TransactionId(AccountId, Timestamp)` instead.
    * Removed `TransactionId(AccountId)`
        * Use `generate(AccountId): TransactionId` instead.

### `TransactionReciept`
    * Exposed `exchangeRate: ExchangeRate`
    * Exposed `accountId: AccountId`
    * Exposed `fileId: FileId`
    * Exposed `contractId: ContractId`
    * Exposed `topicId: TopicId`
    * Exposed `tokenId: TokenId`
    * Exposed `topicSequenceNumber: number`
    * Exposed `topicRunningHash: Uint8Array`
    * Added `toBytes(): Uint8Array`
    * Added `fromBytes(Uint8Array): TransactionReceipt`
    * Added `totalSupply: number`
    * Removed `getTopicId(): ConsensusTopicId`
        * Use `topicId: TopicId` directly instead.
    * Removed `getAccountId(): AccountId`
        * Use `accountId: AccountId` directly instead.
    * Removed `getContractId(): ContractId`
        * Use `contractId: ContractId` directly instead.
    * Removed `getFileId(): FileId`
        * Use `fileId: FileId` directly instead.
    * Removed `getTokenId(): TokenId`
        * Use `tokenId: TokenId` directly instead.
    * Removed `getConsensusTopicId(): ConsensusTopicId`
        * Use `topicId: TopicId` directly instead.
    * Removed `getConsensusTopicSequenceNumber(): number`
        * Use `sequenceNumber: number` directly instead.
    * Removed `getConsnsusTopicRunningHash(): Uint8Array`
        * Use `topicRunningHash: Uint8Array` directly instead.

### `TransactionReceiptQuery` extends [Query](#renamed-querybuilder-query)
    * Added `transactionId: TransactionId`

### `TransactionRecord`
    * Added `toBytes(): Uint8Array`
    * Added `fromBytes(Uint8Array): TransactionRecord`
    * Removed `getContratcExecuteResult(): ContractFunctionResult`
        * Use `contractFunctionResult: ContractFunctionResult` directly instead.
    * Removed `getContratcCreateResult(): ContractFunctionResult`
        * Use `contractFunctionResult: ContractFunctionResult` directly instead.

### `TransactionRecordQuery` extends [Query](#renamed-querybuilder-query)
    * Added `transactionId: TransactionId`

### `Hbar`
    * Added `fromString(string): Hbar`
    * Added `fromString(string, HbarUnit): Hbar`
    * Added `from(number, HbarUnit): Hbar`
    * Added `from(BigDecimal, HbarUnit): Hbar`
    * Added `value: BigDecimal`
    * Added `toString(HbarUnit): string`
    * Renamed `fromTinybar(number): Hbar` -> `fromTinybars(number): Hbar`
    * Renamed `of(number): Hbar` -> `from(number): Hbar`
    * Renamed `of(BigDecimal): Hbar` -> `from(BigDecimal): Hbar`
    * Renamed `as(HbarUnit): Hbar` -> `to(HbarUnit): Hbar`
    * Renamed `asTinybar(): number` -> `toTinybars(): number`
    * Renamed `negate(): Hbar` -> `negated(): Hbar`
    * Removed `Hbar.MAX`
    * Removed `Hbar.ZERO`
    * Removed `Hbar.MIN`
    * Removed `zero(): Hbar`
        * Use `new Hbar(0)`
    * Removed `value(): Hbar`
        * Use `toTinybars()` instead.
    * Removed math functions.
        * Use `Hbar.toTinybars()` to get tinybars, do math with the tinybars
          then reconstructor the `Hbar` using `Hbar.fromTinbyars()`

### `Client`
    * Added `setMirrorNetwork(string[]): void`
    * Added `string[] getMirrorNetwork()`
    * Added `forNetwork(Map<AccountId, string>): Client`
    * Added `forName(string): Client`
    * Added `ping(AccountId): void`
    * Added `operatorPublicKey: PublicKey`
    * Added `setNetwork(Map<string, AccountId>): Client`
    * Added `Map<string, AccountId> getNetwork()`
    * Renamed `fromJson(string)` -> `fromConfig(string)`
    * Renamed `fromFile(string)` -> `fromConfigFile(string)`
    * Renamed `getOperatorId(): AccountId` -> `operatorAccountId: AccountId`
    * Changed `setOperatorWith(AccountId, PublicKey, TransactionSigner)`-> `Client setOperatorWith(AccountId, PublicKey, Function<bytes, bytes>): Client`
    * Removed `Client(Map<AccountId, string>)`
    * Removed `replaceNodes(Nodes): Client`
        * Use `setNetwork()` instead.
    * Removed `putNode(AccountIdLike, string)`
        * Use `setNetwork()` instead.

