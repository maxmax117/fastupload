import Card from '@mui/joy/Card';
import Divider from '@mui/joy/Divider';
import {useDropzone} from 'react-dropzone';
import {useCallback, useEffect, useRef, useState} from "react";
import {Grid, IconButton, LinearProgress, Sheet, Stack} from "@mui/joy";
import PauseCircleOutlineOutlinedIcon from '@mui/icons-material/PauseCircleOutlineOutlined';
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { styled } from '@mui/joy/styles';
import { UploadFile } from './interface';
import {getUserId } from '../../api/axios';
import { nanoid } from 'nanoid';
import { useTranslation } from 'react-i18next';

function createData(
    name: string,
    calories: number,
    fat: number,
    carbs: number,
    protein: number,
) {
    return {name, calories, fat, carbs, protein};
}

const rows = [
    createData('Frozen yoghurt', 159, 6.0, 24, 4.0),
    createData('Ice cream sandwich', 237, 9.0, 37, 4.3),
    createData('Eclair', 262, 16.0, 24, 6.0),
    // createData('Cupcake', 305, 3.7, 67, 4.3),
    // createData('Gingerbread', 356, 16.0, 49, 3.9),
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CHUNK_SIZE = 1 * 1024 * 1024 //1M bytes
const MAX_WORKERS_FILE = 3;
const MAX_WORKERS = 5;

function FastUpload() {
    const { t } = useTranslation();
    const [progress, setProgress] = useState(0);
    const progressRef = useRef(0);
    const [fileSize, setFileSize] = useState(0)
    const fileActSize = useRef(0);
    const [fileName, setFileName] = useState('');
    const calChecksumTime = useRef(0);
    const uploadProgress = useRef({});
    const fileInputRef = useRef(null);
    const [canStop, setCanStop] = useState(false);
    const [fileColor, setFileColor] = useState('#4E79DA');
    const [uploadStatus, setUploadStatus] = useState('waiting');
    const workerRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const isCancelled = useRef(false);
    useEffect(() => {
        return () => {
            clearWorker();
        };
    }, []);

    // onDrop 函数会在文件被拖放时调用
    const onDrop = useCallback(async (acceptedFiles) => {
        clear();
        // Handle the files here
        const file = acceptedFiles[0]; 
        const uploadFile: UploadFile = {
            id: nanoid(4),
            file: file,
            progress: 0,
            status: 'waiting'
        };
        // setIsLoading(false);
        upload(uploadFile);

        // console.log( await getFileMD5(acceptedFiles[0]));
        // console.log(".................")
        // 例如, 将文件上传到服务器等
    }, []);

    const onDragEnter = useCallback(() => {
        clear();
    }, []);

    // useDropzone 钩子返回对应的属性和方法
    const {getRootProps, getInputProps, isDragActive} = useDropzone({
        onDrop,
        onDragEnter,
        noClick: true,  // 禁用点击打开文件选择器
        // 或者使用 preventDropOnDocument: true
    });
    const activeColor = isDragActive ? 'Black' : 'lightGray';

    function onFileSelect(e) {
        if(isCancelled.current) return;
        console.log('onFileSelect', e.target.files[0]);
        
        const file = e.target.files[0]; // 获取选中的文件
        const uploadFile: UploadFile = {
            id: nanoid(4),
            file: file,
            progress: 0,
            status: 'waiting'
        };
        setIsLoading(false);
        upload(uploadFile);
    }

    function upload(uploadFile: UploadFile) {
        console.log('start upload', uploadFile.file);
        setCanStop(true);
        setUploadStatus('uploading');
        const {file} = uploadFile;
        if (file) {
            // fileSize.current = file.size;
            
            setFileSize(formatFileSize(file.size));
            calChecksumTime.current = file.size * 0.2;
            fileActSize.current = file.size + calChecksumTime.current;
            // fileActSize.current = file.size;

            setFileName(file.name);

            if (workerRef.current) {
                workerRef.current.terminate();
            }

            const worker = new Worker(new URL('./UploadWorker.js', import.meta.url), {type: 'module'});
            workerRef.current = worker;

            worker.postMessage({action: 'upload', data: uploadFile, chunkSize: CHUNK_SIZE, userId: getUserId()});
            worker.onmessage = function (e) {
                console.log('received worker message:', e);
                const {action, loaded, fileId, data, time} = e.data;
                switch (action) {
                    case 'progress':
                        updateProgress(fileId, loaded);
                        if(progressRef.current === 100){
                            setCanStop(false);
                            setUploadStatus('completed');
                            clearWorker();
                        }

                        break;
                    case 'checksum_progress':
                        updateChecksumProgress(fileId, loaded);
                        break;
                    case 'completed':
                        setCanStop(false);
                        setProgress(100);
                        setUploadStatus('completed');
                        console.log('Time consumed:', time);
                        clearWorker();
                        break;
                    case 'error':
                        setFileColor('red');
                        setUploadStatus('error');
                        setCanStop(false);
                        break;
                    case 'stopped':
                        setCanStop(false);
                        setUploadStatus('stopped');
                        setProgress(0);
                        clearWorker();
                        break;
                    case 'paused':
                        setUploadStatus('paused');
                        break;
                    case 'resumed':
                        setUploadStatus('uploading');
                        break;
                }
            }
            worker.onerror = function (e) {
            }
        }
    }

    const clearWorker = () => {
        if(workerRef.current){
            workerRef.current.terminate();
            workerRef.current = null;
        }
        setCanStop(false);
    }

    const handlePause = () => {
        if (workerRef.current) {
            workerRef.current.postMessage({ action: 'pause' });
            setUploadStatus('paused');
        }
    };

    const handleResume = () => {
        if (workerRef.current) {
            workerRef.current.postMessage({ action: 'resume' });
            setUploadStatus('uploading');
        }
    };

    const handleStop = () => {
        if (workerRef.current) {
            workerRef.current.postMessage({ action: 'stop' });
            setUploadStatus('stopped');
            setCanStop(false);
            setProgress(0);
        }
    };

    function clear() {
        fileInputRef.current.value = '';
        setProgress(0);
        setFileSize('');
        setFileName('');
        setFileColor('#4E79DA');
        setUploadStatus('waiting');
        setCanStop(false);
        isCancelled.current = false;
        setIsLoading(false);
    }

    function updateProgress(fileId: string, loaded: number) {
        console.log('updateProgress', fileId, loaded);
        if (!uploadProgress.current[fileId])
            uploadProgress.current[fileId] = 0;
        uploadProgress.current[fileId] += loaded;

        progressRef.current = Math.floor(Math.min((uploadProgress.current[fileId] + calChecksumTime.current), fileActSize.current) / fileActSize.current * 100);
        setProgress(progressRef.current);
    }

    function updateChecksumProgress(fileId: string, loaded: number) {
        console.log('updateChecksumProgress', fileId, loaded);
        setProgress(Math.min(Math.round((loaded * 0.2) /fileActSize.current*100), 100));
    }

    function formatFileSize(bytes) {
        if (bytes === 0) {
            return '0 Bytes';
        }
        const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
        const significantDigits = 2;
        const base = 1024;
        const exponent = Math.floor(Math.log(bytes) / Math.log(base));
        const size = (bytes / Math.pow(base, exponent)).toFixed(significantDigits);
        return `${size} ${units[exponent]}`;
    }

    // 示例:
    // console.log(formatTime(123));     // 输出: "0.12s"
    // console.log(formatTime(12345));   // 输出: "00:12"
    // console.log(formatTime(1234567)); // 输出: "20:34"
    // console.log(formatTime(3600000)); // 输出: "01:00:00"
    //
    function formatTime(milliseconds) {
        if (milliseconds < 1000) {
            return `0.${(milliseconds / 1000).toFixed(2).slice(2)}s`; // 小于一秒且保留两位小数
        }

        let seconds = Math.floor(milliseconds / 1000);
        let minutes = Math.floor(seconds / 60);
        let hours = Math.floor(minutes / 60);

        seconds = seconds % 60; // 剩余秒数
        minutes = minutes % 60; // 剩余分钟数

        let secondsString = seconds.toString().padStart(2, '0');
        let minutesString = minutes.toString().padStart(2, '0');

        let timeString = `${minutesString}:${secondsString}`;
        if (hours > 0) {
            let hoursString = hours.toString().padStart(2, '0');
            timeString = `${hoursString}:${timeString}`;
        }

        return timeString;
    }

    const Item = styled(Sheet)(({ theme }) => ({
        backgroundColor:
            theme.palette.mode === 'dark' ? theme.palette.background.level1 : '#fff',
        ...theme.typography['body-sm'],
        padding: theme.spacing(1),
        textAlign: 'center',
        borderRadius: 4,
        color: theme.vars.palette.text.secondary,
    }));

    const handleClick = useCallback(() => {
        if (!fileInputRef.current) return;
        setIsLoading(true);
        isCancelled.current = false;
        fileInputRef.current.click();
    }, []);

    const handleCancel = () => {
        setIsLoading(false);
        isCancelled.current = true;
    }

    return (
        <>
            <Card style={{width: '500px'}}>
                <Stack direction='column' spacing={1}>
                    <span style={{textAlign: 'left', fontSize: '14px', marginTop: '-10px'}}>
                        {t('uploader.title')}
                    </span>
                    <Card {...getRootProps()} style={{border: `1px dashed ${activeColor}`, height: 50}}>
                        {
                            isDragActive ? (
                                <span style={{color: '#000'}}>
                                    {t('uploader.releaseText')}
                                </span>
                            ) : (
                                <a href={'#'} style={{fontWeight: 'normal', fontSize: '13px',color: '#000'}} onClick={(event) => {
                                    event.preventDefault();
                                    clear();
                                    handleClick();
                                }}>
                                    {t('uploader.dragText')} <span
                                    style={{fontWeight: 'bold', fontSize: '15px', color: '#4E79DA'}}>
                                    {t('uploader.clickText')}</span> {t('uploader.chooseFile')}
                                </a>
                            )
                        }

                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
                            <label style={{fontSize: '12px', color: fileColor}}>{fileName}</label>
                            <label style={{fontSize: '10px', color: 'gray'}}>{fileSize == 0 ? '' : fileSize}</label>
                        </div>

                        <form>
                            <input {...getInputProps()} type="file" ref={fileInputRef} style={{display: 'none'}}
                                   onChange={onFileSelect}/>
                        </form>
                        {/*<Button style={{width:100}}>Upload</Button>*/}
                    </Card>

                    <Sheet sx={{height: 70, overflow: 'none'}}>
                        <span style={{fontSize: '12px'}}>{progress}%</span>
                        <LinearProgress determinate value={progress} size='sm'>
                        </LinearProgress>
                        <div style={{height: '20px'}}></div>
                        <Divider style={{marginRight: '-17px', marginLeft: '-17px'}}/>
                        <div style={{display: 'flex', justifyContent: 'flex-end', marginRight: '20px'}}>
                            {uploadStatus === 'paused' ? (
                                <IconButton 
                                    variant="plain" 
                                    disabled={!canStop || uploadStatus === 'completed'} 
                                    onClick={handleResume}
                                    sx={{ 
                                        color: '#0B6BCB',
                                        '&:hover': { color: '#0A54A0' }
                                    }}
                                >
                                    <PlayArrowIcon />
                                </IconButton>
                            ) : (
                                <IconButton 
                                    variant="plain" 
                                    disabled={!canStop || uploadStatus === 'completed'} 
                                    onClick={handlePause}
                                    sx={{ 
                                        color: '#0B6BCB',
                                        '&:hover': { color: '#0A54A0' }
                                    }}
                                >
                                    <PauseCircleOutlineOutlinedIcon/>
                                </IconButton>
                            )}
                            <IconButton 
                                variant="plain" 
                                disabled={!canStop || uploadStatus === 'completed'} 
                                onClick={handleStop}
                                sx={{ 
                                    color: '#0B6BCB',
                                    '&:hover': { color: '#0A54A0' }
                                }}
                            >
                                <StopCircleOutlinedIcon/>
                            </IconButton>
                        </div>
                    </Sheet>
                </Stack>
                {isLoading && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        borderRadius: 'inherit'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span>{t('uploader.loading')}</span>
                            <span style={{ width: '24px', textAlign: 'left' }} className="loading-dots"></span>
                        </div>
                        <style>
                            {`
                                .loading-dots::after {
                                    content: '';
                                    animation: dots 1.5s steps(4, end) infinite;
                                }
                                
                                @keyframes dots {
                                    0%, 20% {
                                        content: '';
                                    }
                                    40% {
                                        content: '.';
                                    }
                                    60% {
                                        content: '..';
                                    }
                                    80%, 100% {
                                        content: '...';
                                    }
                                }
                            `}
                        </style>
                        <IconButton 
                            variant="plain" 
                            onClick={handleCancel}
                            sx={{ 
                                color: '#0B6BCB',
                                // '&:hover': { color: '#0A54A0' }
                            }}
                        >
                            <StopCircleOutlinedIcon/>
                        </IconButton>
                    </div>
                )}
            </Card>
        </>
    )
}

export default FastUpload
