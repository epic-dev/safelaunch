/**
 * Thin wrapper over fetch for API calls.
 *
 * The session cookie is HttpOnly and same-origin, so the browser attaches it on its own -
 * there is no header to add here. What this does add is a single place to notice that the
 * session has lapsed: a 401 from anywhere in the app raises UNAUTHORIZED_EVENT, which the
 * ApiKeyGate listens for so it can ask for the key again instead of leaving the user staring
 * at a failed request.
 */
export const UNAUTHORIZED_EVENT = "safelaunch:unauthorized";

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const response = await fetch(input, init);

    if (response.status === 401) {
        window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }

    return response;
}
