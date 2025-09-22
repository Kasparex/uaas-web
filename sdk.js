// sdk.js
(function (g) {
  // Simple in-memory session
  const session = { address: null, chain: null, provider: null };

  // KasWare adapter (placeholder API; uses common provider patterns)
  async function connectKasWare() {
    const provider = g.kasware || g.kaspa || (g.window && g.window.kasware);
    if (!provider) throw new Error('KasWare provider not found. Please install/enable KasWare.');
    // Try common request patterns; adjust once KasWare API is finalized
    // 1) experimental: provider.request({ method: 'kas_accounts' })
    // 2) event-based: provider.enable()
    let address;
    if (provider.request) {
      try {
        // Prefer an explicit connect method if available
        const res = await provider.request({ method: 'kas_requestAccounts' }).catch(() => null);
        if (Array.isArray(res) && res[0]) address = res[0];
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
    if (!address) throw new Error('Unable to fetch account from KasWare.');
    session.address = address;
    session.chain = 'kaspa';
    session.provider = 'kasware';
    return { address, chain: session.chain, provider: session.provider };
  }

  // EVM adapter (MetaMask) for Kasplex L2 later
  async function connectEvm() {
    const eth = g.ethereum;
    if (!eth) throw new Error('EVM provider not found. Please install MetaMask or use WalletConnect.');
    const accounts = await eth.request({ method: 'eth_requestAccounts' });
    const address = accounts?.[0];
    if (!address) throw new Error('Wallet didn’t return an address.');
    session.address = address;
    session.chain = 'evm';
    session.provider = 'metamask';
    return { address, chain: session.chain, provider: session.provider };
  }

  async function signMessage(message) {
    if (session.chain === 'kaspa') {
      const provider = g.kasware || g.kaspa || (g.window && g.window.kasware);
      if (!provider) throw new Error('KasWare not available.');
      if (provider.request) {
        return provider.request({ method: 'kas_signMessage', params: [session.address, message] });
      }
      throw new Error('KasWare sign not supported yet.');
    }
    if (session.chain === 'evm') {
      return g.ethereum.request({ method: 'personal_sign', params: [message, session.address] });
    }
    throw new Error('No active session.');
  }

  function getSession() { return { ...session }; }
  function disconnect() { session.address = null; session.chain = null; session.provider = null; }

  g.KasparexSDK = {
    wallet: {
      connect: async (provider = 'kasware') => {
        if (provider === 'kasware') return connectKasWare();
        if (provider === 'evm') return connectEvm();
        throw new Error('Unknown provider: ' + provider);
      },
      signMessage,
      disconnect,
      session: getSession
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
