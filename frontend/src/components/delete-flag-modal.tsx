import type React from "react";
import { DeleteItem } from "../consts/api-endpoints";
import { useAsyncAction } from "../hooks/useAsyncAction";

interface DeleteFlagModalProps {
    flagId: number | null;
    onDeleted?: () => void;
}

export const DeleteFlagModal = ({ flagId, onDeleted }: DeleteFlagModalProps) => {
    const { run: deleteFlag, pending, error } = useAsyncAction(async (dialog: HTMLDialogElement | null) => {
        if (!flagId) return
        const response = await fetch(`${DeleteItem}/${flagId}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error('Unable to delete feature flag')
        }

        dialog?.close();
        onDeleted?.();
    });

    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!flagId) return
        const form = e.target;
        const dialog = form.closest('dialog');
        deleteFlag(dialog);
    }
    return (
        <dialog
            id="delete-flag-modal"
            className="w-[540px] m-auto backdrop:bg-none backdrop:backdrop-blur-xs"
        >
            <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
                    <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Delete Feature Flag</h3>
                    <button className="text-on-surface-variant hover:text-primary transition-colors" command="close" commandfor="delete-flag-modal" type="button">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
            </div>
            <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider my-6 text-center">
                Confirm feture flag deletion. This operation cannot be undone.
            </h4>
            {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="px-6 py-4 bg-surface-container-low border-t border-border-subtle flex justify-end gap-3">
                    <button disabled={pending} className="bg-primary-container text-on-primary-container py-2 px-6 rounded font-mono-label text-mono-label hover:bg-primary transition-colors disabled:opacity-50" type="submit">Yes</button>
                    <button className="px-4 py-2 rounded font-mono-label text-mono-label text-on-surface-variant hover:bg-surface-container-high transition-colors" type="button" command="close" commandfor="delete-flag-modal">No</button>
                </div>
            </form>
        </dialog>
    )
}