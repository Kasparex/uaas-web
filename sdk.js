// Kasparex Multi-Chain Wallet Connector SDK
// Supports both EVM and Kaspa ecosystems with KRC-20 and L2 token support
(function (g) {
  const session = { 
    address: null, 
    chain: null, 
    provider: null, 
    isConnected: false,
    balance: null,
    network: null
  };

  // Supported networks
  const SUPPORTED_NETWORKS = {
    // Kaspa Mainnet
    kaspa: {
      chainId: 'kaspa-mainnet',
      chainName: 'Kaspa Mainnet',
      rpcUrls: ['https://api.kaspa.org'],
      blockExplorerUrls: ['https://explorer.kaspa.org'],
      nativeCurrency: {
        name: 'Kaspa',
        symbol: 'KAS',
        decimals: 8
      }
    },
    // Kasplex L2 Mainnet
    kasplex: {
      chainId: '0x1A1', // 417 in hex
      chainName: 'Kasplex L2 Mainnet',
      rpcUrls: ['https://rpc.kasplex.com'],
      blockExplorerUrls: ['https://explorer.kasplex.com'],
      nativeCurrency: {
        name: 'Kaspa',
        symbol: 'KAS',
        decimals: 18
      }
    },
    // Ethereum Mainnet
    ethereum: {
      chainId: '0x1',
      chainName: 'Ethereum Mainnet',
      rpcUrls: ['https://mainnet.infura.io/v3/'],
      blockExplorerUrls: ['https://etherscan.io'],
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18
      }
    }
  };

  // KRC-20 Token Registry (placeholder - update with actual tokens)
  const KRC20_TOKENS = {
    'kaspa:krex': {
      symbol: 'KREX',
      name: 'Kasparex Token',
      decimals: 8,
      address: 'krex-token-address', // Placeholder
      type: 'krc20'
    },
    'kaspa:usdt': {
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 8,
      address: 'usdt-token-address', // Placeholder
      type: 'krc20'
    }
  };

  // Connect to KasWare (Kaspa native wallet)
  async function connectKasWare() {
    const provider = g.kasware || g.kaspa || (g.window && g.window.kasware);
    if (!provider) {
      throw new Error('KasWare provider not found. Please install KasWare wallet.');
    }

    let address = null;

    // Try different methods to get accounts
    if (provider.request) {
      try {
        const req = await provider.request({ method: 'kas_requestAccounts' }).catch(() => null);
        if (Array.isArray(req) && req[0]) address = req[0];
      } catch (_) {}
      
      if (!address) {
        const acc = await provider.request({ method: 'kas_accounts' }).catch(() => []);
        address = Array.isArray(acc) ? acc[0] : null;
      }
    }

    if (!address && provider.enable) {
      const acc = await provider.enable();
      address = Array.isArray(acc) ? acc[0] : null;
    }

    if (!address && provider.getAccounts) {
      const acc = await provider.getAccounts();
      address = Array.isArray(acc) ? acc[0] : null;
    }

    if (!address) {
      throw new Error('Unable to fetch KasWare account. Please check your wallet connection.');
    }

    // Get balance
    let balance = null;
    try {
      if (provider.request) {
        const bal = await provider.request({ method: 'kas_getBalance', params: [address] });
        balance = bal ? (bal / Math.pow(10, 8)).toFixed(8) : '0'; // Convert from sompi to KAS
      }
    } catch (error) {
      console.warn('Could not fetch balance:', error);
    }

    session.address = address;
    session.chain = 'kaspa';
    session.provider = 'kasware';
    session.isConnected = true;
    session.balance = balance;
    session.network = SUPPORTED_NETWORKS.kaspa;

    return { 
      address, 
      chain: session.chain, 
      provider: session.provider,
      balance,
      network: session.network
    };
  }

  // Connect to EVM wallet
  async function connectEvm() {
    const eth = g.ethereum;
    if (!eth) {
      throw new Error('EVM provider not found. Please install MetaMask or another EVM wallet.');
    }

    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      const address = accounts?.[0];
      
      if (!address) {
        throw new Error('No account returned from wallet.');
      }

      const chainId = await eth.request({ method: 'eth_chainId' });
      
      // Get balance
      let balance = null;
      try {
        const bal = await eth.request({ method: 'eth_getBalance', params: [address, 'latest'] });
        balance = (parseInt(bal, 16) / Math.pow(10, 18)).toFixed(6); // Convert from wei to ETH
      } catch (error) {
        console.warn('Could not fetch balance:', error);
      }

      session.address = address;
      session.chain = 'evm';
      session.provider = 'metamask';
      session.isConnected = true;
      session.balance = balance;
      session.network = SUPPORTED_NETWORKS.ethereum;

      return {
        address,
        chain: session.chain,
        provider: session.provider,
        balance,
        network: session.network
      };
    } catch (error) {
      throw new Error(`Failed to connect EVM wallet: ${error.message}`);
    }
  }

  // Send Kaspa transaction
  async function sendKaspaTransaction(recipient, amount, feeRate = 1) {
    if (session.chain !== 'kaspa') {
      throw new Error('Not connected to Kaspa network');
    }

    const provider = g.kasware || g.kaspa || (g.window && g.window.kasware);
    if (!provider?.request) {
      throw new Error('KasWare provider not available');
    }

    try {
      // Convert KAS to sompi (smallest unit)
      const amountSompi = Math.floor(parseFloat(amount) * Math.pow(10, 8));
      
      const transaction = {
        to: recipient,
        amount: amountSompi,
        feeRate: feeRate
      };

      const txHash = await provider.request({
        method: 'kas_sendTransaction',
        params: [transaction]
      });

      return txHash;
    } catch (error) {
      throw new Error(`Kaspa transaction failed: ${error.message}`);
    }
  }

  // Send EVM transaction
  async function sendEvmTransaction(recipient, amount, gasLimit = '0x5208') {
    if (session.chain !== 'evm') {
      throw new Error('Not connected to EVM network');
    }

    const eth = g.ethereum;
    if (!eth) {
      throw new Error('EVM provider not available');
    }

    try {
      // Convert ETH to Wei
      const amountWei = (parseFloat(amount) * Math.pow(10, 18)).toString(16);
      
      const transaction = {
        from: session.address,
        to: recipient,
        value: '0x' + amountWei,
        gas: gasLimit,
        gasPrice: '0x3b9aca00' // 1 gwei
      };

      const txHash = await eth.request({
        method: 'eth_sendTransaction',
        params: [transaction]
      });

      return txHash;
    } catch (error) {
      throw new Error(`EVM transaction failed: ${error.message}`);
    }
  }

  // Send KRC-20 token transaction
  async function sendKrc20Transaction(tokenSymbol, recipient, amount) {
    if (session.chain !== 'kaspa') {
      throw new Error('Not connected to Kaspa network');
    }

    const token = KRC20_TOKENS[`kaspa:${tokenSymbol.toLowerCase()}`];
    if (!token) {
      throw new Error(`KRC-20 token ${tokenSymbol} not supported`);
    }

    const provider = g.kasware || g.kaspa || (g.window && g.window.kasware);
    if (!provider?.request) {
      throw new Error('KasWare provider not available');
    }

    try {
      // Convert amount to token decimals
      const amountTokens = Math.floor(parseFloat(amount) * Math.pow(10, token.decimals));
      
      const transaction = {
        to: token.address,
        amount: 0, // No KAS sent for token transfer
        data: {
          method: 'transfer',
          params: [recipient, amountTokens]
        }
      };

      const txHash = await provider.request({
        method: 'kas_sendTokenTransaction',
        params: [transaction]
      });

      return txHash;
    } catch (error) {
      throw new Error(`KRC-20 transaction failed: ${error.message}`);
    }
  }

  // Sign message
  async function signMessage(message) {
    if (!session.isConnected) {
      throw new Error('No wallet connected');
    }

    try {
      if (session.chain === 'kaspa') {
        const provider = g.kasware || g.kaspa || (g.window && g.window.kasware);
        if (!provider?.request) {
          throw new Error('KasWare sign not available');
        }
        return await provider.request({ 
          method: 'kas_signMessage', 
          params: [session.address, message] 
        });
      } else if (session.chain === 'evm') {
        return await g.ethereum.request({ 
          method: 'personal_sign', 
          params: [message, session.address] 
        });
      }
    } catch (error) {
      throw new Error(`Signing failed: ${error.message}`);
    }
  }

  // Get balance
  async function getBalance() {
    if (!session.isConnected) {
      return null;
    }

    try {
      if (session.chain === 'kaspa') {
        const provider = g.kasware || g.kaspa || (g.window && g.window.kasware);
        if (provider?.request) {
          const bal = await provider.request({ 
            method: 'kas_getBalance', 
            params: [session.address] 
          });
          return (bal / Math.pow(10, 8)).toFixed(8);
        }
      } else if (session.chain === 'evm') {
        const bal = await g.ethereum.request({ 
          method: 'eth_getBalance', 
          params: [session.address, 'latest'] 
        });
        return (parseInt(bal, 16) / Math.pow(10, 18)).toFixed(6);
      }
    } catch (error) {
      console.warn('Could not fetch balance:', error);
    }
    
    return session.balance;
  }

  // Get supported tokens
  function getSupportedTokens() {
    return { ...KRC20_TOKENS };
  }

  // Get current session
  function getSession() {
    return { ...session };
  }

  // Disconnect wallet
  function disconnect() {
    session.address = null;
    session.chain = null;
    session.provider = null;
    session.isConnected = false;
    session.balance = null;
    session.network = null;
  }

  // Check if wallet is connected
  function isConnected() {
    return session.isConnected && !!session.address;
  }

  // Listen for account changes
  function onAccountChange(callback) {
    if (session.chain === 'kaspa') {
      const provider = g.kasware || g.kaspa || (g.window && g.window.kasware);
      if (provider?.on) {
        provider.on('accountsChanged', (accounts) => {
          if (accounts.length === 0) {
            disconnect();
          } else {
            session.address = accounts[0];
          }
          callback(accounts);
        });
      }
    } else if (session.chain === 'evm' && g.ethereum) {
      g.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          session.address = accounts[0];
        }
        callback(accounts);
      });
    }
  }

  // Listen for chain changes
  function onChainChange(callback) {
    if (session.chain === 'evm' && g.ethereum) {
      g.ethereum.on('chainChanged', (chainId) => {
        session.chain = 'evm';
        callback(chainId);
      });
    }
  }

  // Expose the SDK
  g.KasparexSDK = {
    wallet: {
      connect: async (provider = 'kasware') => {
        if (provider === 'kasware') return connectKasWare();
        if (provider === 'evm') return connectEvm();
        throw new Error('Unknown provider: ' + provider);
      },
      sendTransaction: async (recipient, amount, options = {}) => {
        if (session.chain === 'kaspa') {
          return sendKaspaTransaction(recipient, amount, options.feeRate);
        } else if (session.chain === 'evm') {
          return sendEvmTransaction(recipient, amount, options.gasLimit);
        }
        throw new Error('No active session');
      },
      sendToken: async (tokenSymbol, recipient, amount) => {
        return sendKrc20Transaction(tokenSymbol, recipient, amount);
      },
      signMessage,
      getBalance,
      getSupportedTokens,
      disconnect,
      getSession,
      isConnected,
      onAccountChange,
      onChainChange
    },
    networks: SUPPORTED_NETWORKS,
    tokens: KRC20_TOKENS
  };
})(typeof window !== 'undefined' ? window : globalThis);
