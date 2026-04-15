'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WalletSummary, WalletSummaryItem } from '@/components/wallet/wallet-summary';

type WalletManagerProps = {
    wallets: WalletSummaryItem[];
};

type NetworkOption = 'Ethereum Sepolia' | 'Polygon Amoy' | 'Base Sepolia';

type CreateWalletForm = {
    walletName: string;
    network: NetworkOption;
    passphrase: string;
};

type ImportWalletForm = {
    walletName: string;
    network: NetworkOption;
    passphrase: string;
    recoveryPhrase: string;
};

type ExportBackupForm = {
    walletId: string;
    passphrase: string;
    backupPassword: string;
};

type ImportBackupForm = {
    backupPassword: string;
    walletPassphrase: string;
    backupJson: string;
};

type WalletCreateResponse = {
    error?: string | { fieldErrors?: Record<string, string[]> };
    wallet?: { id?: string; name: string };
    recoveryPhrase?: string;
};

type WalletImportResponse = {
    error?: string | { fieldErrors?: Record<string, string[]> };
    wallet?: {
        id: string;
        name: string;
        network: string;
        addresses?: Array<{
            label: string;
            address: string;
            network: string;
        }>;
        createdAt?: string;
    };
    message?: string;
};

type WalletExportResponse = {
    error?: string | { fieldErrors?: Record<string, string[]> };
    backup?: unknown;
    warning?: string;
};

type WalletImportBackupResponse = {
    error?: string | { fieldErrors?: Record<string, string[]> };
    wallet?: {
        id: string;
        name: string;
        network: string;
        addresses?: Array<{
            label: string;
            address: string;
            network: string;
        }>;
        createdAt?: string;
    };
    message?: string;
};

function extractErrorMessage(error: unknown, fallback: string) {
    if (typeof error === 'string') {
        return error;
    }

    if (
        error &&
        typeof error === 'object' &&
        'fieldErrors' in error &&
        error.fieldErrors &&
        typeof error.fieldErrors === 'object'
    ) {
        const fieldErrors = error.fieldErrors as Record<string, string[]>;
        return Object.values(fieldErrors).flat()[0] ?? fallback;
    }

    return fallback;
}

export function WalletManager({ wallets }: WalletManagerProps) {
    const router = useRouter();

    const [activeSection, setActiveSection] = useState<
        'create' | 'import-phrase' | 'export-backup' | 'import-backup'
    >('create');

    const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id ?? '');

    const [createFormData, setCreateFormData] = useState<CreateWalletForm>({
        walletName: '',
        network: 'Ethereum Sepolia',
        passphrase: '',
    });
    const [createSubmitting, setCreateSubmitting] = useState(false);
    const [createError, setCreateError] = useState('');
    const [createSuccessMessage, setCreateSuccessMessage] = useState('');
    const [createRecoveryPhrase, setCreateRecoveryPhrase] = useState('');

    const [importFormData, setImportFormData] = useState<ImportWalletForm>({
        walletName: '',
        network: 'Ethereum Sepolia',
        passphrase: '',
        recoveryPhrase: '',
    });
    const [importSubmitting, setImportSubmitting] = useState(false);
    const [importError, setImportError] = useState('');
    const [importSuccessMessage, setImportSuccessMessage] = useState('');

    const [exportFormData, setExportFormData] = useState<ExportBackupForm>({
        walletId: wallets[0]?.id ?? '',
        passphrase: '',
        backupPassword: '',
    });
    const [exportSubmitting, setExportSubmitting] = useState(false);
    const [exportError, setExportError] = useState('');
    const [exportSuccessMessage, setExportSuccessMessage] = useState('');
    const [exportedBackupJson, setExportedBackupJson] = useState('');

    const [importBackupFormData, setImportBackupFormData] = useState<ImportBackupForm>({
        backupPassword: '',
        walletPassphrase: '',
        backupJson: '',
    });
    const [importBackupSubmitting, setImportBackupSubmitting] = useState(false);
    const [importBackupError, setImportBackupError] = useState('');
    const [importBackupSuccessMessage, setImportBackupSuccessMessage] = useState('');

    const recoveryWordCount = importFormData.recoveryPhrase
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;

    const hasValidRecoveryPhraseLength =
        recoveryWordCount === 12 || recoveryWordCount === 24;

    const hasValidCreatePassphraseLength =
        createFormData.passphrase.length >= 14;

    const hasValidImportBackupPasswordLength =
        importBackupFormData.backupPassword.length >= 14;

    const hasValidImportBackupPassphraseLength =
        importBackupFormData.walletPassphrase.length >= 14;

    const hasImportBackupJson =
        importBackupFormData.backupJson.trim().length > 0;

    const hasValidExportPassphraseLength =
        exportFormData.passphrase.length >= 14;

    const hasValidExportBackupPasswordLength =
        exportFormData.backupPassword.length >= 14;



    useEffect(() => {
        if (!selectedWalletId && wallets[0]?.id) {
            setSelectedWalletId(wallets[0].id);
        }
    }, [selectedWalletId, wallets]);

    useEffect(() => {
        setExportFormData((current) => ({
            ...current,
            walletId: selectedWalletId,
        }));
    }, [selectedWalletId]);

    async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setCreateError('');
        setCreateSuccessMessage('');
        setCreateRecoveryPhrase('');
        setCreateSubmitting(true);

        try {
            const response = await fetch('/api/wallet/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(createFormData),
            });

            const data = (await response.json()) as WalletCreateResponse;

            if (!response.ok) {
                setCreateError(
                    extractErrorMessage(data.error, 'Unable to create wallet.'),
                );
                return;
            }

            setCreateSuccessMessage(`Created ${data.wallet?.name ?? 'wallet'} successfully.`);
            setCreateRecoveryPhrase(data.recoveryPhrase ?? '');
            setCreateFormData({
                walletName: '',
                network: 'Ethereum Sepolia',
                passphrase: '',
            });
            router.refresh();
        } catch (submissionError) {
            console.error('Wallet creation failed:', submissionError);
            setCreateError('Unable to create wallet right now. Please try again.');
        } finally {
            setCreateSubmitting(false);
        }
    }

    async function handleImportPhraseSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setImportError('');
        setImportSuccessMessage('');
        setImportSubmitting(true);

        try {
            const response = await fetch('/api/wallet/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(importFormData),
            });

            const data = (await response.json()) as WalletImportResponse;

            if (!response.ok) {
                setImportError(
                    extractErrorMessage(data.error, 'Unable to import wallet.'),
                );
                return;
            }

            setImportSuccessMessage(data.message ?? 'Wallet imported successfully.');
            setImportFormData({
                walletName: '',
                network: 'Ethereum Sepolia',
                passphrase: '',
                recoveryPhrase: '',
            });
            router.refresh();
        } catch (submissionError) {
            console.error('Wallet import failed:', submissionError);
            setImportError('Unable to import wallet right now. Please try again.');
        } finally {
            setImportSubmitting(false);
        }
    }

    async function handleExportBackupSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setExportError('');
        setExportSuccessMessage('');
        setExportedBackupJson('');
        setExportSubmitting(true);

        try {
            const response = await fetch(`/api/wallet/${exportFormData.walletId}/export`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    passphrase: exportFormData.passphrase,
                    backupPassword: exportFormData.backupPassword,
                }),
            });

            const data = (await response.json()) as WalletExportResponse;

            if (!response.ok) {
                setExportError(
                    extractErrorMessage(data.error, 'Unable to export wallet backup.'),
                );
                return;
            }

            setExportSuccessMessage('Encrypted wallet backup exported successfully.');
            setExportedBackupJson(JSON.stringify(data.backup, null, 2));
            setExportFormData((current) => ({
                ...current,
                passphrase: '',
                backupPassword: '',
            }));
        } catch (submissionError) {
            console.error('Wallet export failed:', submissionError);
            setExportError('Unable to export wallet backup right now. Please try again.');
        } finally {
            setExportSubmitting(false);
        }
    }

    async function handleImportBackupSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setImportBackupError('');
        setImportBackupSuccessMessage('');
        setImportBackupSubmitting(true);

        try {
            const parsedBackup = JSON.parse(importBackupFormData.backupJson);

            const response = await fetch('/api/wallet/import-backup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    backupPassword: importBackupFormData.backupPassword,
                    walletPassphrase: importBackupFormData.walletPassphrase,
                    backup: parsedBackup,
                }),
            });

            const data = (await response.json()) as WalletImportBackupResponse;

            if (!response.ok) {
                setImportBackupError(
                    extractErrorMessage(data.error, 'Unable to import wallet backup.'),
                );
                return;
            }

            setImportBackupSuccessMessage(
                data.message ?? 'Encrypted wallet backup imported successfully.',
            );
            setImportBackupFormData({
                backupPassword: '',
                walletPassphrase: '',
                backupJson: '',
            });
            router.refresh();
        } catch (submissionError) {
            console.error('Wallet backup import failed:', submissionError);
            setImportBackupError('Backup JSON is invalid or import failed.');
        } finally {
            setImportBackupSubmitting(false);
        }
    }

    async function handleCopyBackup() {
        if (!exportedBackupJson) return;
        await navigator.clipboard.writeText(exportedBackupJson);
    }

    function handleDownloadBackup() {
        if (!exportedBackupJson) return;

        const blob = new Blob([exportedBackupJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `wallet-backup-${exportFormData.walletId || 'export'}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <WalletSummary wallets={wallets} />

            <div className="card p-6">
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        className={`rounded-xl px-4 py-2 text-sm font-medium ${activeSection === 'create'
                            ? 'bg-emerald-500 text-slate-950'
                            : 'border border-slate-700 bg-slate-950 text-slate-200'
                            }`}
                        onClick={() => setActiveSection('create')}
                    >
                        Create wallet
                    </button>

                    <button
                        type="button"
                        className={`rounded-xl px-4 py-2 text-sm font-medium ${activeSection === 'import-phrase'
                            ? 'bg-emerald-500 text-slate-950'
                            : 'border border-slate-700 bg-slate-950 text-slate-200'
                            }`}
                        onClick={() => setActiveSection('import-phrase')}
                    >
                        Import by phrase
                    </button>

                    <button
                        type="button"
                        className={`rounded-xl px-4 py-2 text-sm font-medium ${activeSection === 'export-backup'
                            ? 'bg-emerald-500 text-slate-950'
                            : 'border border-slate-700 bg-slate-950 text-slate-200'
                            }`}
                        onClick={() => setActiveSection('export-backup')}
                    >
                        Export backup
                    </button>

                    <button
                        type="button"
                        className={`rounded-xl px-4 py-2 text-sm font-medium ${activeSection === 'import-backup'
                            ? 'bg-emerald-500 text-slate-950'
                            : 'border border-slate-700 bg-slate-950 text-slate-200'
                            }`}
                        onClick={() => setActiveSection('import-backup')}
                    >
                        Import backup
                    </button>
                </div>

                {activeSection === 'create' ? (
                    <div className="mt-6">
                        <h2 className="text-xl font-semibold">Create wallet</h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Each wallet gets its own encrypted recovery phrase and main address.
                        </p>

                        <form className="mt-6 grid gap-4" onSubmit={handleCreateSubmit}>
                            <label className="grid gap-2">
                                <span className="text-sm text-slate-300">Wallet name</span>
                                <input
                                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
                                    value={createFormData.walletName}
                                    onChange={(event) =>
                                        setCreateFormData((current) => ({
                                            ...current,
                                            walletName: event.target.value,
                                        }))
                                    }
                                    placeholder="Trading wallet"
                                    required
                                />
                            </label>

                            <label className="grid gap-2">
                                <span className="text-sm text-slate-300">Network</span>
                                <select
                                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
                                    value={createFormData.network}
                                    onChange={(event) =>
                                        setCreateFormData((current) => ({
                                            ...current,
                                            network: event.target.value as NetworkOption,
                                        }))
                                    }
                                >
                                    <option value="Ethereum Sepolia">Ethereum Sepolia</option>
                                    <option value="Polygon Amoy">Polygon Amoy</option>
                                    <option value="Base Sepolia">Base Sepolia</option>
                                </select>
                            </label>

                            <label className="grid gap-2">
                                <span className="text-sm text-slate-300">Encryption passphrase</span>
                                <input
                                    type="password"
                                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
                                    value={createFormData.passphrase}
                                    onChange={(event) =>
                                        setCreateFormData((current) => ({
                                            ...current,
                                            passphrase: event.target.value,
                                        }))
                                    }
                                    placeholder="Minimum 14 characters"
                                    minLength={14}
                                    required
                                />
                                <p className="text-xs text-slate-500">
                                    Use at least 14 characters to protect this wallet.
                                </p>
                                {createFormData.passphrase.length > 0 && !hasValidCreatePassphraseLength ? (
                                    <p className="text-xs text-rose-400">
                                        Passphrase must be at least 14 characters.
                                    </p>
                                ) : null}
                            </label>

                            {createError ? <p className="text-sm text-rose-400">{createError}</p> : null}
                            {createSuccessMessage ? (
                                <p className="text-sm text-emerald-400">{createSuccessMessage}</p>
                            ) : null}

                            {createRecoveryPhrase ? (
                                <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
                                    <p className="text-sm font-medium text-amber-200">Recovery phrase</p>
                                    <p className="mt-2 font-mono text-sm text-amber-100">
                                        {createRecoveryPhrase}
                                    </p>
                                    <p className="mt-3 text-xs text-amber-200">
                                        Store this phrase securely. It may not be shown again and anyone with access can control your wallet.
                                    </p>
                                </div>
                            ) : null}

                            <button
                                type="submit"
                                className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
                                disabled={createSubmitting || !hasValidCreatePassphraseLength}
                            >
                                {createSubmitting ? 'Creating wallet...' : 'Create wallet'}
                            </button>
                        </form>
                    </div>
                ) : null}

                {activeSection === 'import-phrase' ? (
                    <div className="mt-6">
                        <h2 className="text-xl font-semibold">Import wallet using recovery phrase</h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Import a wallet by submitting the recovery phrase and encrypting it before persistence.
                        </p>

                        <form className="mt-6 grid gap-4" onSubmit={handleImportPhraseSubmit}>
                            <label className="grid gap-2">
                                <span className="text-sm text-slate-300">Wallet name</span>
                                <input
                                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
                                    value={importFormData.walletName}
                                    onChange={(event) =>
                                        setImportFormData((current) => ({
                                            ...current,
                                            walletName: event.target.value,
                                        }))
                                    }
                                    placeholder="Imported wallet"
                                    required
                                />
                            </label>

                            <label className="grid gap-2">
                                <span className="text-sm text-slate-300">Network</span>
                                <select
                                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
                                    value={importFormData.network}
                                    onChange={(event) =>
                                        setImportFormData((current) => ({
                                            ...current,
                                            network: event.target.value as NetworkOption,
                                        }))
                                    }
                                >
                                    <option value="Ethereum Sepolia">Ethereum Sepolia</option>
                                    <option value="Polygon Amoy">Polygon Amoy</option>
                                    <option value="Base Sepolia">Base Sepolia</option>
                                </select>
                            </label>

                            <label className="grid gap-2">
                                <span className="text-sm text-slate-300">Encryption passphrase</span>
                                <input
                                    type="password"
                                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
                                    value={importFormData.passphrase}
                                    onChange={(event) =>
                                        setImportFormData((current) => ({
                                            ...current,
                                            passphrase: event.target.value,
                                        }))
                                    }
                                    placeholder="Minimum 14 characters"
                                    minLength={14}
                                    required
                                />
                            </label>

                            <label className="grid gap-2">
                                <span className="text-sm text-slate-300">Recovery phrase</span>
                                <textarea
                                    className="min-h-[120px] rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
                                    value={importFormData.recoveryPhrase}
                                    onChange={(event) =>
                                        setImportFormData((current) => ({
                                            ...current,
                                            recoveryPhrase: event.target.value,
                                        }))
                                    }
                                    placeholder="Enter the wallet recovery phrase"
                                    required
                                />
                                <div className="flex items-center justify-between gap-4">
                                    <p className="text-xs text-slate-500">
                                        Enter your 12 or 24-word recovery phrase in the correct order, separated by spaces.
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {recoveryWordCount} / 12 or 24 words
                                    </p>
                                </div>

                                {recoveryWordCount > 0 && !hasValidRecoveryPhraseLength ? (
                                    <p className="text-xs text-rose-400">
                                        Recovery phrase must contain 12 or 24 words.
                                    </p>
                                ) : null}

                                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                                    ⚠ Never share your recovery phrase. Anyone with access can fully control your wallet.
                                </div>
                            </label>

                            {importError ? <p className="text-sm text-rose-400">{importError}</p> : null}
                            {importSuccessMessage ? (
                                <p className="text-sm text-emerald-400">{importSuccessMessage}</p>
                            ) : null}

                            <button
                                type="submit"
                                className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
                                disabled={
                                    importSubmitting ||
                                    !hasValidRecoveryPhraseLength ||
                                    importFormData.passphrase.length < 14
                                }
                            >
                                {importSubmitting ? 'Importing wallet...' : 'Import wallet'}
                            </button>
                        </form>
                    </div>
                ) : null}

                {activeSection === 'export-backup' ? (
                    <div className="mt-6">
                        <h2 className="text-xl font-semibold">Export encrypted wallet backup</h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Select a wallet, unlock it with its passphrase, then export an encrypted backup JSON.
                        </p>

                        <div className="mt-6 grid gap-4">
                            <label className="grid gap-2">
                                <span className="text-sm text-slate-300">Select wallet</span>
                                <select
                                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
                                    value={selectedWalletId}
                                    onChange={(event) => setSelectedWalletId(event.target.value)}
                                >
                                    {wallets.map((wallet) => (
                                        <option key={wallet.id} value={wallet.id}>
                                            {wallet.name} — {wallet.network}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <form className="grid gap-4" onSubmit={handleExportBackupSubmit}>
                                <label className="grid gap-2">
                                    <span className="text-sm text-slate-300">Selected wallet ID</span>
                                    <input
                                        className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
                                        value={exportFormData.walletId}
                                        readOnly
                                    />
                                </label>

                                <label className="grid gap-2">
                                    <span className="text-sm text-slate-300">Wallet passphrase</span>
                                    <input
                                        type="password"
                                        className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
                                        value={exportFormData.passphrase}
                                        onChange={(event) =>
                                            setExportFormData((current) => ({
                                                ...current,
                                                passphrase: event.target.value,
                                            }))
                                        }
                                        placeholder="Enter wallet passphrase"
                                        minLength={14}
                                        required
                                    />
                                    <p className="text-xs text-slate-500">
                                        Enter the wallet passphrase to unlock this wallet before export.
                                    </p>
                                    {exportFormData.passphrase.length > 0 && !hasValidExportPassphraseLength ? (
                                        <p className="text-xs text-rose-400">
                                            Wallet passphrase must be at least 14 characters.
                                        </p>
                                    ) : null}
                                </label>

                                <label className="grid gap-2">
                                    <span className="text-sm text-slate-300">Backup password</span>
                                    <input
                                        type="password"
                                        className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
                                        value={exportFormData.backupPassword}
                                        onChange={(event) =>
                                            setExportFormData((current) => ({
                                                ...current,
                                                backupPassword: event.target.value,
                                            }))
                                        }
                                        placeholder="Enter backup password"
                                        minLength={14}
                                        required
                                    />
                                    <p className="text-xs text-slate-500">
                                        This password will be required later to restore the encrypted backup.
                                    </p>
                                    {exportFormData.backupPassword.length > 0 &&
                                        !hasValidExportBackupPasswordLength ? (
                                        <p className="text-xs text-rose-400">
                                            Backup password must be at least 14 characters.
                                        </p>
                                    ) : null}
                                </label>

                                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                                    ⚠ Keep the exported backup file and backup password secure. Anyone with both may be able to restore your wallet.
                                </div>

                                {exportError ? <p className="text-sm text-rose-400">{exportError}</p> : null}
                                {exportSuccessMessage ? (
                                    <p className="text-sm text-emerald-400">{exportSuccessMessage}</p>
                                ) : null}

                                <button
                                    type="submit"
                                    className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
                                    disabled={
                                        exportSubmitting ||
                                        !exportFormData.walletId ||
                                        !hasValidExportPassphraseLength ||
                                        !hasValidExportBackupPasswordLength
                                    }
                                >
                                    {exportSubmitting ? 'Exporting backup...' : 'Export backup'}
                                </button>
                            </form>

                            {exportedBackupJson ? (
                                <div className="grid gap-3">
                                    <textarea
                                        readOnly
                                        className="min-h-[280px] rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm"
                                        value={exportedBackupJson}
                                    />
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            className="rounded-xl border border-slate-700 px-4 py-2 text-sm"
                                            onClick={handleCopyBackup}
                                        >
                                            Copy JSON
                                        </button>
                                        <button
                                            type="button"
                                            className="rounded-xl border border-slate-700 px-4 py-2 text-sm"
                                            onClick={handleDownloadBackup}
                                        >
                                            Download JSON
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                {activeSection === 'import-backup' ? (
                    <div className="mt-6">
                        <h2 className="text-xl font-semibold">Import wallet from backup</h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Restore a wallet from exported encrypted backup JSON and re-encrypt it with a new wallet
                            passphrase.
                        </p>

                        <form className="mt-6 grid gap-4" onSubmit={handleImportBackupSubmit}>
                            <label className="grid gap-2">
                                <span className="text-sm text-slate-300">Backup password</span>
                                <input
                                    type="password"
                                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
                                    value={importBackupFormData.backupPassword}
                                    onChange={(event) =>
                                        setImportBackupFormData((current) => ({
                                            ...current,
                                            backupPassword: event.target.value,
                                        }))
                                    }
                                    placeholder="Enter backup password"
                                    minLength={14}
                                    required
                                />
                                <p className="text-xs text-slate-500">
                                    Enter the password used when the encrypted backup was created.
                                </p>
                                {importBackupFormData.backupPassword.length > 0 &&
                                    !hasValidImportBackupPasswordLength ? (
                                    <p className="text-xs text-rose-400">
                                        Backup password must be at least 14 characters.
                                    </p>
                                ) : null}
                            </label>

                            <label className="grid gap-2">
                                <span className="text-sm text-slate-300">New wallet passphrase</span>
                                <input
                                    type="password"
                                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
                                    value={importBackupFormData.walletPassphrase}
                                    onChange={(event) =>
                                        setImportBackupFormData((current) => ({
                                            ...current,
                                            walletPassphrase: event.target.value,
                                        }))
                                    }
                                    placeholder="Enter new wallet passphrase"
                                    minLength={14}
                                    required
                                />
                                <p className="text-xs text-slate-500">
                                    Use at least 14 characters to secure the restored wallet.
                                </p>
                                {importBackupFormData.walletPassphrase.length > 0 &&
                                    !hasValidImportBackupPassphraseLength ? (
                                    <p className="text-xs text-rose-400">
                                        New wallet passphrase must be at least 14 characters.
                                    </p>
                                ) : null}
                            </label>

                            <label className="grid gap-2">
                                <span className="text-sm text-slate-300">Encrypted backup JSON</span>
                                <textarea
                                    className="min-h-[280px] rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm"
                                    value={importBackupFormData.backupJson}
                                    onChange={(event) =>
                                        setImportBackupFormData((current) => ({
                                            ...current,
                                            backupJson: event.target.value,
                                        }))
                                    }
                                    placeholder="Paste the exported backup JSON here"
                                    required
                                />
                                <p className="text-xs text-slate-500">
                                    Paste the full exported encrypted backup JSON exactly as provided.
                                </p>
                                {!hasImportBackupJson ? (
                                    <p className="text-xs text-rose-400">Backup JSON is required.</p>
                                ) : null}

                                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                                    ⚠ Keep backup files and passwords secure. Anyone with both may be able to restore your wallet.
                                </div>
                            </label>

                            {importBackupError ? (
                                <p className="text-sm text-rose-400">{importBackupError}</p>
                            ) : null}
                            {importBackupSuccessMessage ? (
                                <p className="text-sm text-emerald-400">{importBackupSuccessMessage}</p>
                            ) : null}

                            <button
                                type="submit"
                                className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
                                disabled={
                                    importBackupSubmitting ||
                                    !hasValidImportBackupPasswordLength ||
                                    !hasValidImportBackupPassphraseLength ||
                                    !hasImportBackupJson
                                }
                            >
                                {importBackupSubmitting ? 'Importing backup...' : 'Import backup'}
                            </button>
                        </form>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
