// sdk.js
(function (g) {
  const session = { address: null, chain: null, provider: null };

  async function connectKasWare() {
    const provider = g.kasware || g.kaspa || (g.window && g.window.kasware);
    if (!provider) throw new Error('KasWare provider not found. Install/enable KasWare.');
    let address = null;

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
    if (!address) throw new Error('Unable to fetch KasWare account.');

    session.address = address;
    session.chain = 'kaspa';
    session.provider = 'kasware';
    return { address, chain: session.chain, provider: session.provider };
  }

  async function connectEvm() {
    const eth = g.ethereum;
    if (!eth) throw new Error('EVM provider not found. Please install MetaMask.');
    const accounts = await eth.request({ method: 'eth_requestAccounts' });
    const address = accounts?.[0];
    if (!address) throw new Error('Wallet did not return an address.');
    session.address = address;
    session.chain = 'evm';
    session.provider = 'metamask';
    return { address, chain: session.chain, provider: session.provider };
  }

  async function signMessage(message) {
    if (session.chain === 'kaspa') {
      const provider = g.kasware || g.kaspa || (g.window && g.window.kasware);
      if (!provider?.request) throw new Error('KasWare sign not available.');
      return provider.request({ method: 'kas_signMessage', params: [session.address, message] });
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
