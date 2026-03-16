import { useId } from 'react';
import { Upload, X, File as FileIcon } from 'lucide-react';
import { toast } from 'sonner';
import { formatFileSize } from '../../utils/fileUtils';

interface FileUploadProps {
    selectedFiles: File[];
    onChange: (files: File[]) => void;
    maxSizeMB?: number;
    accept?: string;
    isUploading?: boolean;
    inputId?: string;
    describedById?: string;
}

export function FileUpload({
    selectedFiles,
    onChange,
    maxSizeMB = 10,
    accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif",
    isUploading = false,
    inputId,
    describedById,
}: FileUploadProps) {
    const generatedId = useId();
    const resolvedInputId = inputId ?? `file-upload-${generatedId}`;
    const helperId = describedById ?? `${resolvedInputId}-help`;

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            const newFiles = Array.from(files);
            const MAX_FILE_SIZE = maxSizeMB * 1024 * 1024;

            const oversizedFiles = newFiles.filter(file => file.size > MAX_FILE_SIZE);

            if (oversizedFiles.length > 0) {
                const fileNames = oversizedFiles.map(f => f.name).join(', ');
                toast.error(`Ficheiro(s) excede(m) ${maxSizeMB}MB: ${fileNames}`);
                return;
            }

            onChange([...selectedFiles, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        const newArray = [...selectedFiles];
        newArray.splice(index, 1);
        onChange(newArray);
    };

    return (
        <div className="space-y-2">
            <label
                htmlFor={resolvedInputId}
                className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-sm text-gray-600 dark:text-gray-300 hover:border-purple-600 transition-colors focus-within:ring-2 focus-within:ring-purple-500 focus-within:ring-offset-2 ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <input
                    id={resolvedInputId}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="sr-only"
                    accept={accept}
                    disabled={isUploading}
                    aria-describedby={helperId}
                />
                <Upload className="w-8 h-8 mb-2 text-purple-600 dark:text-purple-400" />
                <p className="font-medium text-gray-900 dark:text-gray-100">Clique ou prima Enter para selecionar ficheiros</p>
                <p id={helperId} className="text-xs text-gray-500 mt-1">
                    Suporta ficheiros de até {maxSizeMB}MB
                </p>
            </label>

            {selectedFiles.length > 0 && (
                <div className="space-y-2 mt-4">
                    <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-2">
                        Ficheiros selecionados ({selectedFiles.length})
                    </h3>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {selectedFiles.map((file, index) => (
                            <div
                                key={`${file.name}-${index}`}
                                className="flex items-center justify-between p-3 rounded border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <FileIcon className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                </div>
                                {!isUploading && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded flex-shrink-0 text-gray-500 dark:text-gray-400"
                                        aria-label="Remover ficheiro"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
