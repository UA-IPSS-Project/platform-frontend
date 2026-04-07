import { useId } from 'react';
import { Upload, X, File as FileIcon } from 'lucide-react';
import { toast } from 'sonner';
import { formatFileSize } from '../../utils/fileUtils';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    const generatedId = useId();
    const resolvedInputId = inputId ?? `file-upload-${generatedId}`;
    const helperId = describedById ?? `${resolvedInputId}-help`;

    const MAX_FILES = 10;
    const MAX_TOTAL_SIZE_MB = 20;
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            const newFiles = Array.from(files);
            const MAX_FILE_SIZE = maxSizeMB * 1024 * 1024;
            const MAX_TOTAL_SIZE = MAX_TOTAL_SIZE_MB * 1024 * 1024;

            const oversizedFiles = newFiles.filter(file => file.size > MAX_FILE_SIZE);
            if (oversizedFiles.length > 0) {
                const fileNames = oversizedFiles.map(f => f.name).join(', ');
                toast.error(t('fileUpload.errors.maxSizeExceeded', {
                    maxSizeMB,
                    fileNames,
                }));
                return;
            }

            if (selectedFiles.length + newFiles.length > MAX_FILES) {
                toast.error(t('fileUpload.errors.maxFilesExceeded', {
                    maxFiles: MAX_FILES
                }));
                return;
            }

            // Check total size
            const totalSize = [...selectedFiles, ...newFiles].reduce((acc, file) => acc + file.size, 0);
            if (totalSize > MAX_TOTAL_SIZE) {
                toast.error(t('fileUpload.errors.maxTotalSizeExceeded', {
                    maxTotalSizeMB: MAX_TOTAL_SIZE_MB
                }));
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
                className={`border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-sm text-muted-foreground hover:border-primary transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
                <Upload className="w-8 h-8 mb-2 text-primary" />
                <p className="font-medium text-foreground">{t('fileUpload.selectPrompt')}</p>
                <p id={helperId} className="text-xs text-muted-foreground mt-1">
                    {t('fileUpload.maxSizeHint', { maxSizeMB })}
                </p>
            </label>

            {selectedFiles.length > 0 && (
                <div className="space-y-2 mt-4">
                    <h3 className="font-medium text-sm text-foreground mb-2">
                        {t('fileUpload.selectedFiles', { count: selectedFiles.length })}
                    </h3>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {selectedFiles.map((file, index) => (
                            <div
                                key={`${file.name}-${index}`}
                                className="flex items-center justify-between p-3 rounded border border-border bg-muted"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <FileIcon className="w-5 h-5 text-primary flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                </div>
                                {!isUploading && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                        className="p-1 hover:bg-accent rounded flex-shrink-0 text-muted-foreground"
                                        aria-label={t('fileUpload.removeFileAriaLabel')}
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
