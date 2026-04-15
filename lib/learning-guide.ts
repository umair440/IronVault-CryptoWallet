import type { UserRole } from '@prisma/client';

/** One sidebar destination — add the next entry when you are ready. */
export type LearningSection = {
  id: string;
  /** Matches the label in the sidebar (for consistency). */
  navLabel: string;
  title: string;
  /** Short plain-language goal for a beginner. */
  summary: string;
  steps: string[];
};

/** Ordered like the sidebar (excluding Learning & Admin). Extend one section at a time. */
export const beginnerSections: LearningSection[] = [
  {
    id: 'dashboard',
    navLabel: 'Dashboard',
    title: 'Dashboard',
    summary:
      'After you sign in, Dashboard is your home base: a snapshot of wallets, balances, and recent activity so you know where you stand before sending or receiving.',
    steps: [
      'In the **left sidebar**, click **Dashboard** (wallet icon). The page opens in the main area on the right.',
      'At the top you will see a short line about your account type — that is normal and helps the app tailor hints.',
      'The **wallet summary** shows the wallets you have. You can expand or skim them to see which wallet holds what.',
      '**Summary cards** give quick numbers (for example total value and pending items). Use them as a quick health check.',
      'The **asset table** lists coins or tokens and amounts. That is where you confirm what you actually hold.',
      '**Recent transactions** at the bottom shows the latest sends and receives. Open **History** in the sidebar when you need the full list.',
      'When you are ready to move money, use **Send** or **Receive** in the sidebar.',
    ],
  },
  {
    id: 'wallets',
    navLabel: 'Wallets',
    title: 'Wallets',
    summary:
      'The Wallets screen is where you see every wallet on your account, inspect addresses, and use the tools to create a new wallet, import one with a recovery phrase, or move encrypted backups in and out.',
    steps: [
      'In the **left sidebar**, click **Wallets** (stacked-cards icon). The page title is **Create and manage wallets** — use it whenever you need to add or review wallets, not only the first time.',
      'On the left (or on top on smaller screens) you will see **Your wallets**: each card shows the **wallet name**, **network** (for example Ethereum Sepolia), and every **address** with its label. Read those addresses carefully before you share them or send funds.',
      'On the right you will see a card with four actions as tabs: **Create wallet**, **Import by phrase**, **Export backup**, and **Import backup**. Only one panel is active at a time — click the tab you need.',
      '**Create wallet**: enter a name, pick a **test network** (Ethereum Sepolia, Polygon Amoy, or Base Sepolia), and a **passphrase** you will remember. After submit, the app may show a **recovery phrase** — write it down somewhere safe offline; treat it like a master password for that wallet.',
      '**Import by phrase**: use this when you already have a 12- or 24-word recovery phrase from another wallet. You still choose a name, network, and passphrase for how IronVault stores it in this prototype.',
      '**Export backup** / **Import backup**: these work with an **encrypted JSON backup** plus passwords you set in the form. Use them to move a wallet between devices in a controlled way — never email the raw backup or share passwords in chat.',
      'When you are done here, use **Send** or **Receive** from the sidebar to use an address, or return to **Dashboard** for the big picture.',
    ],
  },
  {
    id: 'send',
    navLabel: 'Send',
    title: 'Send',
    summary:
      'Send crypto walks you through choosing which wallet sends funds, who receives them, and how much — in three stages: fill in details, confirm, then see the result. Stay on test networks for this prototype.',
    steps: [
      'In the **left sidebar**, click **Send** (outgoing arrow icon). The page is titled **Send crypto** and explains that you will select a wallet, enter a recipient, pick an asset and amount, then review before anything is submitted.',
      'If you have **no wallet with an address yet**, you will see a short message and a **Create a wallet** button — go to **Wallets** first and come back.',
      'At the top of the form, a small progress row shows **Details → Confirm → Done**. You always start on **Details**.',
      'On **Details**: choose **From wallet** (name and network per wallet). Optionally use **Select from contacts** to paste a saved address, or type the **Recipient address** yourself. The hint reminds you that wrong addresses cannot be reversed — double-check every character.',
      'Set **Network** and **Asset** (ETH, MATIC, or USDC) to match what you intend to send. Enter **Amount** manually or use the quick chips (**0.1**, **0.5**, **1.0**) or **Max** (Max reserves estimated fees where applicable). Your **Available** balance for that asset appears next to the amount field.',
      'Click **Review transaction**. If the server accepts the draft, you move to **Confirm**.',
      'On **Confirm**, read **From**, **To**, **Network**, **Amount**, **Estimated fee**, and **Total cost**. If there are **warnings**, read them and tick **I have double-checked the recipient address** when you are sure. Use **Back** to edit, or **Confirm & Send** to finish.',
      'On **Done**, you will see **Transaction submitted** with a **transaction hash** and status. Use **Send another** to start over, or **View history** to open **History** in the app. You can also open **Manage address book** from the bottom of the details form to edit **Contacts**.',
    ],
  },
  {
    id: 'receive',
    navLabel: 'Receive',
    title: 'Receive',
    summary:
      'Receive crypto shows each wallet’s main deposit address as text and as a QR code so someone else can send you funds on the right network.',
    steps: [
      'In the **left sidebar**, click **Receive** (incoming arrow icon). The page title is **Receive crypto**, with a short note that you can share your address or QR with the sender.',
      'If you already have wallets, each one appears in its own block inside the card: **wallet name**, **network**, then a **QR code** and the **Main wallet address** in monospace. Click **Copy address** so you do not mistype it when sharing.',
      'Tell anyone sending to you to use the **same network** as shown on that card (for example Ethereum Sepolia). Sending on the wrong network can mean lost funds in real life — in this prototype always stay on testnets.',
      'If you have no wallets yet, you will see **Create a wallet from the dashboard before receiving funds.** Add a wallet under **Wallets**, then open **Receive** again.',
    ],
  },
  {
    id: 'history',
    navLabel: 'History',
    title: 'History',
    summary:
      'History lists your recent sends and receives across all wallets in one place, newest first, so you can audit amounts, fees, and status.',
    steps: [
      'In the **left sidebar**, click **History** (clock/history icon). The heading on the page is **Transaction history**, with text that everything is **most recent first**.',
      'If there are no rows yet, you will see **No transactions yet. Send crypto to see your history here.** — complete a send (or receive flow in your tests) and refresh if needed.',
      'When data exists, a card titled **Recent transactions** lists each item: an icon shows **send** vs **receive**, the line shows the **asset** (for example send ETH), **network** and **date/time**, and **To** / **From** with a shortened address when available.',
      'On the right of each row you see **amount**, **Fee** (formatted), and a **status** pill (for example submitted, pending, or failed styling). Use this screen after sending to confirm what the app recorded.',
    ],
  },
  {
    id: 'contacts',
    navLabel: 'Contacts',
    title: 'Contacts',
    summary:
      'Contacts is your address book: save a friendly name with each crypto address so Send can fill the recipient for you and you make fewer paste mistakes.',
    steps: [
      'In the **left sidebar**, click **Contacts** (address-book icon). The page title is **Address book**, with a note about saving frequently used addresses with a **contact name**.',
      'Under **Add contact**, enter a **Name** (for example who you pay) and their wallet **Address** (`0x…`). Click **Save contact** — the list updates when the server accepts it.',
      'Under **Saved contacts**, each row shows the **name**, full **address**, and a **Remove** link if you no longer need that entry. An empty book shows **No contacts saved yet.**',
      'On **Send**, the optional **Select from contacts** dropdown and the **Manage address book** link both point back here — keep this list accurate before you rely on it for real transfers.',
    ],
  },
];

export function showBeginnerLearning(role: UserRole): boolean {
  return role === 'BEGINNER_TRADER';
}
