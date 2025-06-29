// Configuración de la red BASE
const BASE_CHAIN_ID = '0x2105'; // 8453 en decimal
const BASE_RPC_URL = 'https://mainnet.base.org';
const BASE_EXPLORER = 'https://basescan.org';

// Variables globales
let provider;
let signer;
let isWalletConnected = false;
let isMuted = false;
let introTimer;

// Elementos del DOM
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

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    startIntro();
});

function initializeApp() {
    // Configurar música
    backgroundMusic.volume = 0.3;
    
    // Verificar si MetaMask está instalado
    if (typeof window.ethereum !== 'undefined') {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        checkWalletConnection();
    } else {
        showNotification('MetaMask no está instalado', 'error');
    }
}

function setupEventListeners() {
    // Intro screen
    introScreen.addEventListener('click', handleIntroClick);
    
    // Música
    muteButton.addEventListener('click', toggleMute);
    
    // Wallet
    connectWalletBtn.addEventListener('click', connectWallet);
    
    // Navegación
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
    // Fade in de la imagen de intro
    introImage.style.opacity = '0';
    introImage.style.transition = 'opacity 2s ease-in-out';
    
    setTimeout(() => {
        introImage.style.opacity = '1';
    }, 100);
    
    // Timer de 10 segundos para auto-transición
    introTimer = setTimeout(() => {
        if (introScreen.classList.contains('active')) {
            goToMainScreen();
        }
    }, 10000);
}

function handleIntroClick() {
    clearTimeout(introTimer);
    goToMainScreen();
}

function goToMainScreen() {
    // Fade out intro
    introScreen.style.opacity = '0';
    setTimeout(() => {
        introScreen.classList.remove('active');
        introScreen.style.display = 'none';
        
        // Fade in main screen
        mainScreen.style.display = 'block';
        mainScreen.style.opacity = '0';
        setTimeout(() => {
            mainScreen.classList.add('active');
            mainScreen.style.opacity = '1';
            
            // Iniciar música
            if (!isMuted) {
                backgroundMusic.play().catch(e => console.log('Audio autoplay blocked'));
            }
        }, 100);
    }, 2000);
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
        backgroundMusic.play().catch(e => console.log('Audio play failed'));
        muteButton.textContent = '🔊';
    }
}

async function connectWallet() {
    if (!window.ethereum) {
        showNotification('MetaMask no está instalado', 'error');
        return;
    }
    
    try {
        // Solicitar conexión de cuenta
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        
        if (accounts.length > 0) {
            await checkAndSwitchNetwork();
            isWalletConnected = true;
            updateWalletUI();
            showNotification('Wallet conectada exitosamente', 'success');
        }
    } catch (error) {
        console.error('Error conectando wallet:', error);
        showNotification('Error al conectar wallet', 'error');
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
            // Si la red no existe, agregarla
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
                    showNotification('Error al agregar red Base', 'error');
                }
            } else {
                showNotification('Error al cambiar a red Base', 'error');
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
        showNotification('Conecta tu wallet primero', 'warning');
        return;
    }
    
    // Mostrar popup de mint
    mintPopup.classList.add('active');
}

function closeMintPopup() {
    mintPopup.classList.remove('active');
}

async function handleMint() {
    if (!isWalletConnected) {
        showNotification('Conecta tu wallet primero', 'warning');
        return;
    }
    
    try {
        showNotification('Funcionalidad de mint en desarrollo...', 'info');
        closeMintPopup();
        // Aquí iría la lógica de mint con el contrato
    } catch (error) {
        console.error('Error en mint:', error);
        showNotification('Error en el proceso de mint', 'error');
    }
}

async function handleBuyFloppy() {
    if (!isWalletConnected) {
        showNotification('Conecta tu wallet primero', 'warning');
        return;
    }
    
    try {
        const price = ethers.utils.parseEther('0.01');
        
        const tx = await signer.sendTransaction({
            to: '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea', // Adrian Token address
            value: price
        });
        
        showNotification('Transacción enviada: ' + tx.hash, 'success');
        
        // Esperar confirmación
        await tx.wait();
        showNotification('Floppy comprado exitosamente!', 'success');
        
    } catch (error) {
        console.error('Error comprando floppy:', error);
        showNotification('Error en la compra', 'error');
    }
}

function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        isWalletConnected = false;
        updateWalletUI();
        showNotification('Wallet desconectada', 'warning');
    } else {
        checkWalletConnection();
    }
}

function handleChainChanged(chainId) {
    if (chainId !== BASE_CHAIN_ID) {
        showNotification('Cambia a la red Base', 'warning');
    }
}

function showNotification(message, type = 'info') {
    // Crear notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Estilos de la notificación
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
    
    // Remover después de 5 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 1s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 1000);
    }, 5000);
}

// Prevenir contexto del menú derecho
document.addEventListener('contextmenu', e => e.preventDefault());

// Prevenir zoom en móviles
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('gesturechange', e => e.preventDefault());
document.addEventListener('gestureend', e => e.preventDefault()); 