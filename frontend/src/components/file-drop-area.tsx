import React, { useRef, useState } from "react";

interface FileDropAreaProps {
    onSelect?: (file: File) => void
}

export const FileDropArea = ({ onSelect }: FileDropAreaProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState('');

    const selectFile = (file: File) => {
        setFileName(file.name)
        onSelect && onSelect(file)
    }
    const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            selectFile(files[0])
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const handleOpenFileDialog = () => {
        fileInputRef.current?.click();
    };

    const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            selectFile(file);
        }
    }

    return (
        <div
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
            onClick={handleOpenFileDialog}
            className="w-full mb-6 p-8 border-2 border-dashed border-border-subtle rounded-lg bg-surface-container-low flex flex-col items-center justify-center text-center cursor-pointer hover:bg-surface-container-high transition-colors group"
        >
            <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-[32px]">upload_file</span>
            </div>
            {
                !fileName &&
                <>
                    <p className="font-headline-sm text-on-surface mb-1">Drop a JSON, YAML or CSV file here to batch add flags</p>
                    <p className="font-body-md text-on-surface-variant">or <span className="text-primary font-semibold">click to browse</span></p>
                </>
            }
            {
                fileName &&
                <p className="font-headline-sm text-on-surface mb-1">File selected: <span className="text-primary font-semibold">{fileName}</span></p>
            }
            <input
                ref={fileInputRef}
                name="upload-file"
                accept=".json,.csv,.yaml,.yml"
                className="hidden"
                type="file"
                onChange={onFileInputChange}
            />
        </div>
    );
};
