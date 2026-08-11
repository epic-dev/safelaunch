import React, { useState } from "react";
import type { FeatureFlag } from "../types/feature-flag";
import { ToggleButton } from "./toggle-button";
import { UpdateItem } from "../consts/api-endpoints";
import { getRelativeTime } from "../utils/getRelativeTime";
import { useAsyncAction } from "../hooks/useAsyncAction";

interface FeatureFlagItemProps {
    flag: FeatureFlag;
    onDelete: (id: number) => void;
}

export const FeatureFlagItem = ({ flag, onDelete }: FeatureFlagItemProps) => {
    const [flagFormData, setFlagFormData] = useState<FeatureFlag>(flag)
    const updateForm = (fields: Partial<FeatureFlag>) => {
        setFlagFormData((prev) => ({
            ...prev,
            ...fields,
        }));
    }

    const handleUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        updateForm({
            [name]: value,
        })
    }

    const { run: submitUpdate, pending } = useAsyncAction(async (name: string, value: string | boolean) => {
        try {
            const response = await fetch(`${UpdateItem}/${flag.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    [name]: value,
                })
            });

            if (!response.ok) throw new Error("Failed to update feature flag");
        } catch (err) {
            setFlagFormData(flag)
            throw err;
        }
    });

    const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        updateForm({
            [name]: checked,
        })
        submitUpdate(name, checked)
    }

    const handleBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const key = name as keyof FeatureFlag
        if (flag[key] !== value) {
            submitUpdate(name, value)
        }
    }

    const lastEvaluated = getRelativeTime(flag.created_at);

    return (
        <>
            <li
                key={flag.key}
                className="group grid grid-cols-[2fr_1fr_auto] px-4 py-3 items-center bg-panel-bg hover:bg-surface-container transition-colors border-l-2 border-l-transparent hover:border-l-primary-container"
            >
                <div>
                    <div className="flex items-center group/asc">
                        <input disabled={pending} className="editable-input font-mono-label text-mono-label text-on-surface font-semibold text-[14px] border-border-subtle bg-panel-bg rounded" type="text" name="key" value={flagFormData.key} onBlur={handleBlur} onChange={handleUpdate} />
                        <span className="material-symbols-outlined text-[14px] text-outline opacity-0 group-hover/asc:opacity-100 transition-opacity ml-2">edit</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 group/desc">
                        <input disabled={pending} className="editable-input font-body-md text-on-surface-variant text-[13px] bg-surface-container-low/30 hover:bg-surface-container-low focus:bg-surface-container-low border-none p-1 rounded transition-colors w-full" type="text" name="description" value={flagFormData.description} onBlur={handleBlur} onChange={handleUpdate} />
                        <span className="material-symbols-outlined text-[14px] text-outline opacity-0 group-hover/desc:opacity-100 transition-opacity cursor-pointer">edit</span>
                    </div>
                </div>
                <div className="hidden sm:flex flex-col justify-center">
                    <span className="font-body-md text-body-md text-on-surface-variant text-[13px]">{lastEvaluated}</span>
                    <div className="flex gap-1 mt-1">
                        {/* <span className="bg-surface-variant text-on-surface-variant px-1.5 py-0.5 rounded font-label-caps text-label-caps text-[10px]">User Auth</span> */}
                    </div>
                </div>
                <div className="flex items-center justify-end">
                    <ToggleButton enabled={flagFormData.enabled} onToggle={handleToggle} name="enabled" />
                    {/* <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    </div> */}
                    <button
                        onClick={() => onDelete(flag.id)}
                        className="cursor-pointer ml-4 p-1 text-on-surface-variant hover:text-error transition-colors duration-200 flex items-center justify-center rounded hover:bg-error-container/10"
                        title="Delete Flag"
                        command="show-modal"
                        commandfor="delete-flag-modal"
                    >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                </div>
            </li>
        </>
    )
}
