export interface UploadFile {
    id: string;
    file: File;
    progress: number;
    status: 'waiting' | 'uploading' | 'completed' | 'error';
}