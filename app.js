// BASE Network configuration
const BASE_CHAIN_ID = '0x2105'; // 8453 in decimal
const BASE_RPC_URL = 'https://mainnet.base.org';
const BASE_EXPLORER = 'https://basescan.org';

// Global variables
let provider;
let signer;
let isWalletConnected = false;
let isMuted = false;
let introTimer;
let musicInitialized = false;

// DOM elements
const introScreen = document.getElementById('intro-screen');
const mainScreen = document.getElementById('main-screen');
const floppyScreen = document.getElementById('floppy-screen');
const introImage = document.getElementById('intro-image');
const backgroundMusic = document.getElementById('background-music');
const muteButton = document.getElementById('mute-button');
const connectWalletBtn = document.getElementById('connect-wallet');
const clickArea = document.getElementById('click-area');
const mintPopup = document.getElementById('mint-popup');
const closePopupBtn = document.getElementById('close-popup');
const mintButton = document.getElementById('mint-button');
const buyFloppyBtn = document.getElementById('buy-floppy');
const backToMainBtn = document.getElementById('back-to-main');

// Initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    startIntro();
});

function initializeApp() {
    // Configure music
    backgroundMusic.volume = 0.3;
    
    // Initialize music after user interaction
    document.addEventListener('click', function initMusic() {
        if (!musicInitialized) {
            musicInitialized = true;
            backgroundMusic.load();
            document.removeEventListener('click', initMusic);
        }
    }, { once: true });
    
    // Check if MetaMask is installed
    if (typeof window.ethereum !== 'undefined') {
        try {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            checkWalletConnection();
        } catch (error) {
            console.warn('Ethers.js not available:', error);
        }
    } else {
        showNotification('MetaMask is not installed', 'error');
    }
}

function setupEventListeners() {
    // Intro screen
    introScreen.addEventListener('click', handleIntroClick);
    
    // Music
    muteButton.addEventListener('click', toggleMute);
    
    // Wallet
    connectWalletBtn.addEventListener('click', connectWallet);
    
    // Navigation
    clickArea.addEventListener('click', handleBasementClick);
    closePopupBtn.addEventListener('click', closeMintPopup);
    mintButton.addEventListener('click', handleMint);
    buyFloppyBtn.addEventListener('click', handleBuyFloppy);
    backToMainBtn.addEventListener('click', goToMainScreen);
    
    // MetaMask events
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
    }
}

function startIntro() {
    // Fade in intro image
    introImage.style.opacity = '0';
    introImage.style.transition = 'opacity 2s ease-in-out';
    
    setTimeout(() => {
        introImage.style.opacity = '1';
    }, 100);
    
    // 10 second timer for auto-transition
    introTimer = setTimeout(() => {
        if (introScreen.classList.contains('active')) {
            goToMainScreen();
        }
    }, 10000);
}

function handleIntroClick() {
    clearTimeout(introTimer);
    
    // Initialize and start music on first click
    if (!musicInitialized) {
        musicInitialized = true;
        backgroundMusic.load();
        if (!isMuted) {
            backgroundMusic.play().catch(e => console.log('Audio play failed'));
        }
    }
    
    goToMainScreen();
}

function goToMainScreen() {
    // Fade out intro (8 seconds)
    introScreen.style.opacity = '0';
    introScreen.style.transition = 'opacity 8s ease-in-out';
    
    setTimeout(() => {
        introScreen.classList.remove('active');
        introScreen.style.display = 'none';
        
        // Fade in main screen
        mainScreen.style.display = 'block';
        mainScreen.style.opacity = '0';
        mainScreen.style.transition = 'opacity 2s ease-in-out';
        
        setTimeout(() => {
            mainScreen.classList.add('active');
            mainScreen.style.opacity = '1';
        }, 100);
    }, 8000);
}

function goToFloppyScreen() {
    mainScreen.classList.remove('active');
    mainScreen.style.opacity = '0';
    
    setTimeout(() => {
        mainScreen.style.display = 'none';
        floppyScreen.style.display = 'block';
        floppyScreen.style.opacity = '0';
        
        setTimeout(() => {
            floppyScreen.classList.add('active');
            floppyScreen.style.opacity = '1';
        }, 100);
    }, 2000);
}

function goToMainScreen() {
    floppyScreen.classList.remove('active');
    floppyScreen.style.opacity = '0';
    
    setTimeout(() => {
        floppyScreen.style.display = 'none';
        mainScreen.style.display = 'block';
        mainScreen.style.opacity = '0';
        
        setTimeout(() => {
            mainScreen.classList.add('active');
            mainScreen.style.opacity = '1';
        }, 100);
    }, 2000);
}

function toggleMute() {
    isMuted = !isMuted;
    
    if (isMuted) {
        backgroundMusic.pause();
        muteButton.textContent = '🔇';
    } else {
        if (musicInitialized) {
            backgroundMusic.play().catch(e => console.log('Audio play failed'));
        }
        muteButton.textContent = '🔊';
    }
}

async function connectWallet() {
    if (!window.ethereum) {
        showNotification('MetaMask is not installed', 'error');
        return;
    }
    
    try {
        // Request account connection
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        
        if (accounts.length > 0) {
            await checkAndSwitchNetwork();
            isWalletConnected = true;
            updateWalletUI();
            showNotification('Wallet connected successfully', 'success');
        }
    } catch (error) {
        console.error('Error connecting wallet:', error);
        showNotification('Error connecting wallet', 'error');
    }
}

async function checkAndSwitchNetwork() {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    
    if (chainId !== BASE_CHAIN_ID) {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: BASE_CHAIN_ID }]
            });
        } catch (switchError) {
            // If network doesn't exist, add it
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: BASE_CHAIN_ID,
                            chainName: 'Base',
                            nativeCurrency: {
                                name: 'ETH',
                                symbol: 'ETH',
                                decimals: 18
                            },
                            rpcUrls: [BASE_RPC_URL],
                            blockExplorerUrls: [BASE_EXPLORER]
                        }]
                    });
                } catch (addError) {
                    showNotification('Error adding Base network', 'error');
                }
            } else {
                showNotification('Error switching to Base network', 'error');
            }
        }
    }
}

function checkWalletConnection() {
    if (window.ethereum && window.ethereum.selectedAddress) {
        isWalletConnected = true;
        updateWalletUI();
    }
}

function updateWalletUI() {
    if (isWalletConnected) {
        const shortAddress = window.ethereum.selectedAddress.slice(0, 6) + '...' + window.ethereum.selectedAddress.slice(-4);
        connectWalletBtn.textContent = shortAddress;
        connectWalletBtn.style.background = '#00ff00';
        connectWalletBtn.style.color = '#000';
    } else {
        connectWalletBtn.textContent = 'Connect Wallet';
        connectWalletBtn.style.background = '#000';
        connectWalletBtn.style.color = '#00ff00';
    }
}

function handleBasementClick(event) {
    if (!isWalletConnected) {
        showNotification('Connect your wallet first', 'warning');
        return;
    }
    
    // Show mint popup
    mintPopup.classList.add('active');
}

function closeMintPopup() {
    mintPopup.classList.remove('active');
}

async function handleMint() {
    if (!isWalletConnected) {
        showNotification('Connect your wallet first', 'warning');
        return;
    }
    
    try {
        showNotification('Mint functionality in development...', 'info');
        closeMintPopup();
        // Here would go the mint logic with the contract
    } catch (error) {
        console.error('Error in mint:', error);
        showNotification('Error in mint process', 'error');
    }
}

async function handleBuyFloppy() {
    if (!isWalletConnected) {
        showNotification('Connect your wallet first', 'warning');
        return;
    }
    
    try {
        if (!window.ethers || !window.ethers.utils) {
            showNotification('Ethers.js not loaded properly', 'error');
            return;
        }
        
        const price = ethers.utils.parseEther('0.01');
        
        if (!signer) {
            signer = provider.getSigner();
        }
        
        const tx = await signer.sendTransaction({
            to: '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea', // Adrian Token address
            value: price
        });
        
        showNotification('Transaction sent: ' + tx.hash, 'success');
        
        // Wait for confirmation
        await tx.wait();
        showNotification('Floppy purchased successfully!', 'success');
        
    } catch (error) {
        console.error('Error buying floppy:', error);
        showNotification('Error in purchase', 'error');
    }
}

function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        isWalletConnected = false;
        updateWalletUI();
        showNotification('Wallet disconnected', 'warning');
    } else {
        checkWalletConnection();
    }
}

function handleChainChanged(chainId) {
    if (chainId !== BASE_CHAIN_ID) {
        showNotification('Switch to Base network', 'warning');
    }
}

function showNotification(message, type = 'info') {
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Notification styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #000;
        color: ${type === 'error' ? '#ff0000' : type === 'success' ? '#00ff00' : type === 'warning' ? '#ffff00' : '#00ff00'};
        border: 2px solid ${type === 'error' ? '#ff0000' : type === 'success' ? '#00ff00' : type === 'warning' ? '#ffff00' : '#00ff00'};
        padding: 1rem;
        font-family: 'Press Start 2P', monospace;
        font-size: 0.6rem;
        z-index: 1000;
        max-width: 300px;
        word-wrap: break-word;
        box-shadow: 0 0 10px ${type === 'error' ? '#ff0000' : type === 'success' ? '#00ff00' : type === 'warning' ? '#ffff00' : '#00ff00'};
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 1s ease-out';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 1000);
    }, 5000);
}

// Prevent right-click context menu
document.addEventListener('contextmenu', e => e.preventDefault());

// Prevent zoom on mobile
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('gesturechange', e => e.preventDefault());
document.addEventListener('gestureend', e => e.preventDefault()); 