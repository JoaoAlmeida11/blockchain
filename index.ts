import * as crypto from 'crypto';

class Transaction {
    // transfer funds from one user to another user in a transaction
    constructor(
        public amount: number,
        public payer: string, // public key
        public payee: string // public key
    ) { }

    toString() {
        return JSON.stringify(this); // serialized to strings to make it easier to work with
    }
}

class Block {
    // container for multiple transactions -> simplified to 1 to keep things simple
    // you can think of a block like an element in an array or more accurately a linked list


    // proof of work
    public nonce = Math.round(Math.random() * 999999999);


    constructor(
        public prevHash: string, // link to the previous block in the chain
        // a hashing function allows you to take a value of an arbitrary size say a transaction then map it to a value with a fixed length like a hexadecimal string; the value returned from a hashing function is often call an hash or a hash digest
        //! hash cannot reconstruct a value
        //* hash can compare values
        // it ensures that 2 blocks can be linked together without being manipulated
        public transaction: Transaction,
        public ts = Date.now() // it also as a timestamp because the blocks will be placed in chronological order
    ) { }

    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256'); //SHA256 -> Secure Hashing Algorithm with a length of 256 bits
        hash.update(str).end();
        return hash.digest("hex");
    }
}

class Chain {
    // like a linked list of blocks
    // there should only be one chain
    public static instance = new Chain(); //singleton instance

    chain: Block[];

    constructor() {
        this.chain = [new Block('', new Transaction(100, 'genesis', 'satoshi'))]; // the Genesis Block
    }

    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }


    // proof of work
    mine(nonce: number) {
        let solution = 1;
        console.log('⛏️ Mining...')

        while (true) {
            const hash = crypto.createHash('MD5'); //starts with a hash with 4 zeros // message-digest algorithm
            hash.update((nonce + solution).toString()).end();

            const attempt = hash.digest('hex');
            if (attempt.substring(0, 4) === '0000') {
                console.log(`Solved: ${solution}`);
                return solution;
            }

            solution += 1
        }
    }


    addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer) {
        // a naive and simple implementation
        // how to know its a legitimate transaction?
        // const newBlock = new Block(this.lastBlock.hash, transaction);
        // this.chain.push(newBlock);

        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());

        const isValid = verifier.verify(senderPublicKey, signature);

        if (isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction);

            //proof of work
            this.mine(newBlock.nonce)


            this.chain.push(newBlock);
        }
        // ISSUE: double spending at the same time
        // SOLUTION: Proof of Work system -> each new block needs to go through a process called mining where a dificult computational problem is solved in order to confirm the block but is very easy to verify that work by multiple other nodes on the system
        // when you have multiple ones at the same time the first one wins the *lottery*

    }
}

class Wallet {
    // its essentially a wrapper for a public key and a private key
    public publicKey: string; // for receiving money
    public privateKey: string; // for spending money

    constructor() {
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

        const keypair = crypto.generateKeyPairSync('rsa', {
            // the next parameters are to generate as string
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });

        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
    }

    sendMoney(amount: number, payeePublicKey: string) {
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);

        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();

        const signature = sign.sign(this.privateKey); //its like a one time password
        Chain.instance.addBlock(transaction, this.publicKey, signature);
    }

}


// Example usage
const satoshi = new Wallet();
const bob = new Wallet();
const alice = new Wallet();

satoshi.sendMoney(50, bob.publicKey);
bob.sendMoney(23, alice.publicKey);
alice.sendMoney(5, bob.publicKey);

console.log(Chain.instance)