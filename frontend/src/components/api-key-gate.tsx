import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { Session } from "../consts/api-endpoints";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { UNAUTHORIZED_EVENT } from "../utils/api-fetch";
import { LoadingDots } from "./loading-dots";

interface SessionStatus {
    authRequired: boolean;
    authenticated: boolean;
}

interface ApiKeyGateProps {
    children: React.ReactNode;
}

/**
 * Stands between the dashboard and the API.
 *
 * The key is sent exactly once, to POST /auth/session, which returns an HttpOnly cookie.
 * Nothing here ever stores the key: it lives in component state for the duration of the
 * submit and is dropped afterwards, so no part of the app can read it back and an XSS bug
 * has nothing to steal.
 */
export const ApiKeyGate = ({ children }: ApiKeyGateProps) => {
    const [status, setStatus] = useState<SessionStatus | null>(null);
    const [apiKey, setApiKey] = useState("");

    const checkSession = useCallback(async () => {
        try {
            const response = await fetch(Session);
            if (!response.ok) throw new Error("Failed to read session status");
            setStatus(await response.json());
        } catch {
            // If the status call itself fails the server is unreachable, not unauthorized.
            // Asking for a key wouldn't help, so let the app render and surface the real error.
            setStatus({ authRequired: false, authenticated: true });
        }
    }, []);

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    // A session that lapses mid-use (it lasts 12 hours) should bring the prompt back rather
    // than leaving every subsequent action failing silently.
    useEffect(() => {
        const handleUnauthorized = () => {
            setStatus({ authRequired: true, authenticated: false });
        };

        window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
        return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    }, []);

    const { run: submitKey, pending, error } = useAsyncAction(async () => {
        const response = await fetch(Session, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ apiKey }),
        });

        if (!response.ok) throw new Error("That API key was not accepted");

        setApiKey("");
        await checkSession();
    });

    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        submitKey();
    };

    if (status === null) {
        return (
            <div className="flex-1 flex items-center justify-center h-screen bg-surface-dim">
                <LoadingDots />
            </div>
        );
    }

    if (status.authenticated) {
        return <>{children}</>;
    }

    return (
        <div className="flex-1 flex items-center justify-center h-screen bg-surface-dim p-margin-mobile">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md bg-surface-container-lowest rounded-lg shadow-xl overflow-hidden"
            >
                <div className="px-6 py-4 border-b border-border-subtle">
                    <h1 className="font-headline-md text-headline-md font-bold text-on-surface">SafeLaunch</h1>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label
                            htmlFor="api-key"
                            className="block font-label-caps text-label-caps text-on-surface-variant mb-1.5"
                        >
                            API Key
                        </label>
                        <input
                            id="api-key"
                            name="apiKey"
                            type="password"
                            autoComplete="off"
                            autoFocus
                            required
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full bg-surface-container-low border border-border-subtle rounded px-3 py-2 text-body-md focus:border-primary-container focus:ring-0 text-on-surface placeholder:text-outline transition-colors"
                            placeholder="Enter your SAFELAUNCH_API_KEY"
                        />
                    </div>

                    <p className="text-body-md text-on-surface-variant">
                        This is the value of <code>SAFELAUNCH_API_KEY</code> on the server. It is exchanged for a
                        session and never stored in the browser.
                    </p>

                    {error && <p role="alert" className="text-red-500 text-sm">{error}</p>}
                </div>

                <div className="px-6 py-4 bg-surface-container-low border-t border-border-subtle flex justify-end">
                    <button
                        type="submit"
                        disabled={pending}
                        className="bg-primary-container text-on-primary-container py-2 px-6 rounded font-mono-label text-mono-label hover:bg-primary transition-colors disabled:opacity-50"
                    >
                        {pending ? "Checking..." : "Unlock"}
                    </button>
                </div>
            </form>
        </div>
    );
};
