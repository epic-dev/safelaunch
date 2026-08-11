import React, { useId } from "react";

interface ToggleButtonProps {
    enabled: boolean;
    onToggle: (e: React.ChangeEvent<HTMLInputElement>) => void;
    name: string;
}
export const ToggleButton = ({ enabled, onToggle, name }: ToggleButtonProps) => {
    const btnId = useId()

    const toggleEnabledVariants = (checked: boolean) => {
        const classes = 'relative w-full h-full rounded-full p-1 flex items-center before:transition before:duration-400 before:content-["_"] before:rounded-full before:absolute before:bg-white before:w-[36px] before:h-[20px]'
        return checked
            ? `${classes} bg-primary-container before:translate-x-[17px]`
            : `${classes} bg-gray-300 before:translate-x-0`;
    }

    return (
        <label htmlFor={btnId} className="flex items-center cursor-pointer w-[60px] h-[26px] rounded-full">
            <input
                hidden
                type="checkbox"
                id={btnId}
                name={name}
                checked={enabled}
                onChange={onToggle}
            />
            <span className={`${toggleEnabledVariants(enabled)}`}></span>
        </label>
    )
}