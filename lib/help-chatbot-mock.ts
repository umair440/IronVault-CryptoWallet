export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export function mockAssistantReply(userText: string): string {
  const t = userText.toLowerCase().trim();

  if (!t) {
    return 'Try asking in your own words — for example how to send crypto, read the dashboard, or stay safe with backups.';
  }

  if (/(send|transfer|payment|fee|gas|withdraw)/.test(t)) {
    return 'To **send**, open Send, choose a wallet and asset, paste a **testnet** address, then review the amount and fees before confirming. This build is a prototype: use testnets only, not real mainnet funds.';
  }

  if (/(receive|deposit|address|qr|incoming)/.test(t)) {
    return 'For **receive**, open Receive and copy your address or show the QR code. Make sure the sender uses the **same network** as the address you share.';
  }

  if (/(wallet|backup|seed|phrase|recovery|import|export)/.test(t)) {
    return 'Wallets live under **Wallets**. You can create, import, or export backups from there. Never share your recovery phrase with anyone — IronVault staff will never ask for it.';
  }

  if (/(login|sign in|password|register|sign up|account|auth)/.test(t)) {
    return 'Use **Login** or **Register** from the home page. If you are stuck, confirm you are using the right username and password for this prototype environment.';
  }

  if (/(transaction|history|pending|tx)/.test(t)) {
    return '**History** lists past sends and receives. Pending items stay in that state until the flow completes in this demo — refresh the page if something looks out of date.';
  }

  if (/(contact|contacts)/.test(t)) {
    return '**Contacts** stores addresses you use often so you can pick them instead of pasting each time. Always verify the address before sending.';
  }

  if (/(dashboard|portfolio|balance|home screen)/.test(t)) {
    return 'The **Dashboard** summarizes balances, assets, and recent activity after you sign in. It is the best place to start when you are unsure where to go next.';
  }

  if (/(setting|profile|preference)/.test(t)) {
    return '**Settings** is where account-level options live in this prototype. For wallet-specific actions, use the Wallets section instead.';
  }

  if (/(hello|hi|hey|thanks|thank you)/.test(t)) {
    return 'Happy to help. Ask about **send**, **receive**, **wallets**, **history**, or anything confusing on screen — I will point you to the right area.';
  }

  return 'I am **IronVault AI** in this sidebar — a **prototype** (not a connected model). I match simple keywords about Send, Receive, Wallets, History, Contacts, and Settings. For anything else, describe what you see on the page and I will suggest the closest screen to open.';
}
