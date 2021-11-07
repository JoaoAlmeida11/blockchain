"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var crypto = __importStar(require("crypto"));
var Transaction = /** @class */ (function () {
    // transfer funds from one user to another user in a transaction
    function Transaction(amount, payer, // public key
    payee // public key
    ) {
        this.amount = amount;
        this.payer = payer;
        this.payee = payee;
    }
    Transaction.prototype.toString = function () {
        return JSON.stringify(this); // serialized to strings to make it easier to work with
    };
    return Transaction;
}());
var Block = /** @class */ (function () {
    function Block(prevHash, // link to the previous block in the chain
    // a hashing function allows you to take a value of an arbitrary size say a transaction then map it to a value with a fixed length like a hexadecimal string; the value returned from a hashing function is often call an hash or a hash digest
    //! hash cannot reconstruct a value
    //* hash can compare values
    // it ensures that 2 blocks can be linked together without being manipulated
    transaction, ts // it also as a timestamp because the blocks will be placed in chronological order
    ) {
        if (ts === void 0) { ts = Date.now(); }
        this.prevHash = prevHash;
        this.transaction = transaction;
        this.ts = ts;
        // container for multiple transactions -> simplified to 1 to keep things simple
        // you can think of a block like an element in an array or more accurately a linked list
        // proof of work
        this.nonce = Math.round(Math.random() * 999999999);
    }
    Object.defineProperty(Block.prototype, "hash", {
        get: function () {
            var str = JSON.stringify(this);
            var hash = crypto.createHash('SHA256'); //SHA256 -> Secure Hashing Algorithm with a length of 256 bits
            hash.update(str).end();
            return hash.digest("hex");
        },
        enumerable: false,
        configurable: true
    });
    return Block;
}());
var Chain = /** @class */ (function () {
    function Chain() {
        this.chain = [new Block('', new Transaction(100, 'genesis', 'satoshi'))]; // the Genesis Block
    }
    Object.defineProperty(Chain.prototype, "lastBlock", {
        get: function () {
            return this.chain[this.chain.length - 1];
        },
        enumerable: false,
        configurable: true
    });
    // proof of work
    Chain.prototype.mine = function (nonce) {
        var solution = 1;
        console.log('⛏️ Mining...');
        while (true) {
            var hash = crypto.createHash('MD5'); //starts with a hash with 4 zeros // message-digest algorithm
            hash.update((nonce + solution).toString()).end();
            var attempt = hash.digest('hex');
            if (attempt.substring(0, 4) === '0000') {
                console.log("Solved: " + solution);
                return solution;
            }
            solution += 1;
        }
    };
    Chain.prototype.addBlock = function (transaction, senderPublicKey, signature) {
        // a naive and simple implementation
        // how to know its a legitimate transaction?
        // const newBlock = new Block(this.lastBlock.hash, transaction);
        // this.chain.push(newBlock);
        var verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());
        var isValid = verifier.verify(senderPublicKey, signature);
        if (isValid) {
            var newBlock = new Block(this.lastBlock.hash, transaction);
            //proof of work
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
        }
        // ISSUE: double spending at the same time
        // SOLUTION: Proof of Work system -> each new block needs to go through a process called mining where a dificult computational problem is solved in order to confirm the block but is very easy to verify that work by multiple other nodes on the system
        // when you have multiple ones at the same time the first one wins the *lottery*
    };
    // like a linked list of blocks
    // there should only be one chain
    Chain.instance = new Chain(); //singleton instance
    return Chain;
}());
var Wallet = /** @class */ (function () {
    function Wallet() {
        // const keypair = crypto.generateKeyPairSync('rsa',
        //     // the next parameters are to generate as string
        //     {
        //         modulusLength: 2048,
        //         publicKeyEnconding: {
        //             type: 'spki',
        //             format: 'pem'
        //         },
        //         privateKeyEnconding: {
        //             type: 'pkcs8',
        //             format: 'pem'
        //         }
        //     });
        var keypair = crypto.generateKeyPairSync('rsa', {
            // the next parameters are to generate as string
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
    }
    Wallet.prototype.sendMoney = function (amount, payeePublicKey) {
        var transaction = new Transaction(amount, this.publicKey, payeePublicKey);
        var sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();
        var signature = sign.sign(this.privateKey); //its like a one time password
        Chain.instance.addBlock(transaction, this.publicKey, signature);
    };
    return Wallet;
}());
// Example usage
var satoshi = new Wallet();
var bob = new Wallet();
var alice = new Wallet();
satoshi.sendMoney(50, bob.publicKey);
bob.sendMoney(23, alice.publicKey);
alice.sendMoney(5, bob.publicKey);
console.log(Chain.instance);
