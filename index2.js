require('dotenv').config();
const { PublicKey, Connection, Keypair } = require('@solana/web3.js');
const { Token, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const { percentAmount, generateSigner, signerIdentity, createSignerFromKeypair } = require('@metaplex-foundation/umi');
const { TokenStandard, createAndMint } = require('@metaplex-foundation/mpl-token-metadata');
const { mplCandyMachine } = require("@metaplex-foundation/mpl-candy-machine");
const bs58 = require('bs58');
const { clusterApiUrl } = require('@solana/web3.js');

// Ensure PRIVATE_KEY is set in your environment variables
const secretKeyEnvVar = process.env.PRIVATE_KEY;
const decodedSecretKey = bs58.decode(secretKeyEnvVar);
const umi = createUmi(clusterApiUrl('mainnet-beta'));

// Load your token information from a local file
const tokenData = require('./tokenInfo.json');
const tokenIPFS = "https://ipfs.io/ipfs/bafkreicwiajagkywx3mqaalzchfrgtin775z7outxbe2l7jtnm7cwsarsq"

const setupAndMintToken = async () => {
    let minted = false;
    while (!minted) {
        try {
            const userWallet = umi.eddsa.createKeypairFromSecretKey(decodedSecretKey);
            const userWalletSigner = createSignerFromKeypair(umi, userWallet);
            const mint = generateSigner(umi);

            umi.use(signerIdentity(userWalletSigner));
            umi.use(mplCandyMachine());

            await createAndMint(umi, {
                mint,
                authority: umi.identity,
                name: tokenData.name,
                symbol: tokenData.symbol,
                uri: tokenIPFS,
                sellerFeeBasisPoints: percentAmount(5.5),
                decimals: tokenData.decimals,
                amount: tokenData.initialSupply,
                tokenOwner: userWallet.publicKey,
                tokenStandard: TokenStandard.Fungible,
            }).sendAndConfirm(umi);
            console.log("Token minted successfully.");
            minted = true;
        } catch (error) {
            console.error("Error minting token: ", error);
            minted = false;
        }
    }
};

async function revokeFreezeAuthority(connection, tokenMintAddress, currentFreezeAuthority) {
    const token = new Token(
        connection,
        new PublicKey(tokenMintAddress),
        TOKEN_PROGRAM_ID,
        currentFreezeAuthority
    );

    await token.revokeFreezeAuthority(
        currentFreezeAuthority.publicKey,
        currentFreezeAuthority
    );

    console.log("Freeze authority has been revoked.");
}

async function revokeMintAuthority(connection, tokenMintAddress, currentMintAuthority) {
    const token = new Token(
        connection,
        new PublicKey(tokenMintAddress),
        TOKEN_PROGRAM_ID,
        currentMintAuthority
    );

    await token.revokeMintAuthority(
        currentMintAuthority.publicKey,
        currentMintAuthority
    );

    console.log("Mint authority has been revoked.");
}

(async () => {
    try {
        await setupAndMintToken();
        // Assuming you have the token mint address and authority keypairs
        const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
        const tokenMintAddress = userWallet.publicKey; // Replace with your token's mint address
        const currentFreezeAuthority = Keypair.fromSecretKey(decodedSecretKey); // Assuming the same key for simplicity
        const currentMintAuthority = Keypair.fromSecretKey(decodedSecretKey); // Assuming the same key for simplicity

        // Uncomment these lines after replacing the above placeholders with actual values
        await revokeFreezeAuthority(connection, tokenMintAddress, currentFreezeAuthority);
        await revokeMintAuthority(connection, tokenMintAddress, currentMintAuthority);
    } catch (error) {
        console.error("Error: ", error);
    }
})();
