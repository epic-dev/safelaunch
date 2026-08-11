import type React from "react";
import { useState } from "react";
import { FileDropArea } from "./file-drop-area";
import type { FeatureFlag } from "../types/feature-flag";
import { CreateItem, ImportList } from "../consts/api-endpoints";
import { useAsyncAction } from "../hooks/useAsyncAction";

type FeatureFlagCreateInput = Omit<FeatureFlag, 'id' | 'created_at'>

interface CreateFlagModalProps {
    onCreated?: () => void;
}

export const CreateFlagModal = ({ onCreated }: CreateFlagModalProps) => {
    const [fileSelected, setFileSelected] = useState<File | null>(null);
    const [featureFlag, setFeatureFlag] = useState<FeatureFlagCreateInput>({
        key: "",
        description: "",
        enabled: false,
    });

    const { run: submitFlag, pending, error, setError } = useAsyncAction(async (form: HTMLFormElement) => {
        const dialog = form.closest('dialog');

        if (fileSelected) {
            const formData = new FormData();
            formData.append("file", fileSelected);

            const response = await fetch(`${ImportList}`, {
                method: "POST",
                body: formData,
            })

            if (!response.ok) throw new Error("Failed to upload file");

        } else {
            const response = await fetch(`${CreateItem}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(featureFlag),
            });

            if (!response.ok) throw new Error("Failed to add feature flag");
        }

        dialog?.close();
        setFileSelected(null);
        setFeatureFlag({ key: "", description: "", enabled: false });
        form.reset();
        onCreated?.();
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement> & React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value, type, checked } = e.target;
        setFeatureFlag((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleCancel = () => {
        handleClearForm();
    }

    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        submitFlag(e.target);
    }

    const handleClearForm = () => {
        setFeatureFlag({ key: "", description: "", enabled: false });
        setError(null);
    };

    const onFileSelect = (file: File) => {
        setFileSelected(file)
    }

    return (
        <dialog
            closedby="any"
            onClose={handleCancel}
            onCancel={handleCancel}
            className="w-[540px] m-auto backdrop:bg-none backdrop:backdrop-blur-xs"
            id="create-flag-modal"
        >
            <form onSubmit={handleSubmit}>
                <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
                        <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Create New Feature Flags</h3>
                        <button className="text-on-surface-variant hover:text-primary transition-colors" command="close" commandfor="create-flag-modal" type="button">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        <FileDropArea onSelect={onFileSelect} />
                        <div className="flex items-center gap-4">
                            <div className="h-px bg-border-subtle flex-1"></div>
                            <span className="font-label-caps text-label-caps text-outline">OR</span>
                            <div className="h-px bg-border-subtle flex-1"></div>
                        </div>
                        <section>
                            <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mb-4">Manual Creation</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1.5">Flag Name</label>
                                    <input
                                        name="key"
                                        value={featureFlag.key}
                                        onChange={handleChange}
                                        required={!fileSelected}
                                        className="w-full bg-surface-container-low border border-border-subtle rounded px-3 py-2 text-body-md focus:border-primary-container focus:ring-0 text-on-surface placeholder:text-outline transition-colors"
                                        placeholder="e.g. new-dashboard-layout"
                                        type="text"
                                    />
                                </div>
                                <div>
                                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1.5">Description</label>
                                    <textarea
                                        name="description"
                                        value={featureFlag.description}
                                        onChange={handleChange}
                                        className="w-full bg-surface-container-low border border-border-subtle rounded px-3 py-2 text-body-md focus:border-primary-container focus:ring-0 text-on-surface placeholder:text-outline transition-colors"
                                        placeholder="Describe the purpose of this flag..."
                                        rows={3}></textarea>
                                </div>
                            </div>
                        </section>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                    </div>
                    <div className="px-6 py-4 bg-surface-container-low border-t border-border-subtle flex justify-end gap-3">
                        <button type="button" className="px-4 py-2 rounded font-mono-label text-mono-label text-on-surface-variant hover:bg-surface-container-high transition-colors" command="close" commandfor="create-flag-modal">Cancel</button>
                        <button type="submit" disabled={pending} className="bg-primary-container text-on-primary-container py-2 px-6 rounded font-mono-label text-mono-label hover:bg-primary transition-colors disabled:opacity-50" formMethod="dialog">Create Flag</button>
                    </div>
                </div>
            </form>
        </dialog>
    )
}