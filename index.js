require('dotenv').config()
const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const { percentAmount, generateSigner, signerIdentity, createSignerFromKeypair } = require('@metaplex-foundation/umi');
const { TokenStandard, createAndMint } = require('@metaplex-foundation/mpl-token-metadata');
const { mplCandyMachine } = require("@metaplex-foundation/mpl-candy-machine");
const bs58 = require('bs58');
const { clusterApiUrl } = require('@solana/web3.js');
const secretKeyEnvVar = process.env.PRIVATE_KEY; // Make sure to set this environment variable
const decodedSecretKey = bs58.decode(secretKeyEnvVar);
const umi = createUmi(clusterApiUrl('mainnet-beta')); // Replace YOUR_RPC_ENDPOINT with your actual RPC endpoint

// Read OffChain Token Data
const tokenData = require('./tokenInfo.json')

// IPFS URL of Uploaded TokenData.json()
const tokenIPFS = "https://ipfs.io/ipfs/bafkreicwiajagkywx3mqaalzchfrgtin775z7outxbe2l7jtnm7cwsarsq"

const setupAndMintToken = async () => {
    let minted = false
    while (!minted) {
        try {
            const userWallet = umi.eddsa.createKeypairFromSecretKey(decodedSecretKey);
            const userWalletSigner = createSignerFromKeypair(umi, userWallet);
            const mint = generateSigner(umi);

            umi.use(signerIdentity(userWalletSigner));
            umi.use(mplCandyMachine())

            await createAndMint(umi, {
                mint,
                authority: umi.identity,
                name: tokenData.name,
                symbol: tokenData.symbol,
                uri: tokenIPFS,
                sellerFeeBasisPoints: percentAmount(5.5), // Adjust as needed
                decimals: tokenData.decimals,
                amount: tokenData.initialSupply,
                tokenOwner: userWallet.publicKey,
                tokenStandard: TokenStandard.Fungible,
            }).sendAndConfirm(umi);
            console.log("Token minted successfully.");
            minted = true
        } catch {
            minted = false
        }
    }
};

setupAndMintToken().catch(console.error);
