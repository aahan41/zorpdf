'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileCheck,
  X,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  File,
  Package,
  Trash2,
  ArrowRight,
  Zap,
  FileText,
  Layers,
} from 'lucide-react';

import type { Tool, ToolId } from './ToolsGrid';
import type { CompressionLevel } from '@/lib/imageCompression';
import type { ImageProcessingResult } from '@/lib/pdfMerger';

import {
  loadImageInfo,
  mergeImagesToPdf,
  type MergeResult,
} from '@/lib/pdfMerger';

import {
  formatBytes,
  calculateCompressionPercentage,
  compressImage,
} from '@/lib/imageCompression';

import { estimatePdfSize } from '@/lib/pdfEstimator';
import { DownloadButton } from '@/components/ui/DownloadButton';
import CompressionLevelSelector from '@/components/ui/CompressionLevelSelector';
import ImageReorderGrid from '@/components/ui/ImageReorderGrid';

interface UploadSectionProps {
  toolId: ToolId;
  tool: Tool;
}

interface FileItem {
  id: string;
  file: File;
  status:
    | 'pending'
    | 'loading'
    | 'ready'
    | 'converting'
    | 'done'
    | 'error';
  progress: number;
  thumbnail?: string;
  width?: number;
  height?: number;
  result?: {
    blob: Blob;
    filename: string;
  };
  pdfResult?: MergeResult;
  error?: string;
}

const MAX_FILES = 100;

const generateId = () =>
  Math.random().toString(36).substring(2, 15);

export default function UploadSection({
  toolId,
  tool,
}: UploadSectionProps) {
  const [state, setState] = useState<
    'idle' | 'loading' | 'selected' | 'converting' | 'done' | 'error'
  >('idle');

  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [compressionLevel, setCompressionLevel] =
    useState<CompressionLevel>('balanced');

  const [estimatedSize, setEstimatedSize] = useState<{
    min: number;
    max: number;
  } | null>(null);

  const [loadingProgress, setLoadingProgress] = useState({
    loaded: 0,
    total: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---------------------------------------------
     LOAD IMAGE THUMBNAILS
  --------------------------------------------- */

  useEffect(() => {
    if (
      toolId === 'jpg-to-pdf' &&
      state === 'loading' &&
      files.some((file) => file.status === 'pending')
    ) {
      loadPendingThumbnails();
    }
  }, [files, state, toolId]);

  const loadPendingThumbnails = async () => {
    const pendingFiles = files.filter(
      (file) => file.status === 'pending'
    );

    if (pendingFiles.length === 0) return;

    for (let i = 0; i < pendingFiles.length; i++) {
      const fileItem = pendingFiles[i];

      try {
        const info = await loadImageInfo(fileItem.file);

        setFiles((prev) =>
          prev.map((file) =>
            file.id === fileItem.id
              ? {
                  ...file,
                  status: 'ready',
                  thumbnail: info.thumbnail,
                  width: info.width,
                  height: info.height,
                }
              : file
          )
        );

        setLoadingProgress({
          loaded: i + 1,
          total: pendingFiles.length,
        });
      } catch (error) {
        console.error('Failed to load thumbnail:', error);
      }
    }

    setState('selected');
  };

  /* ---------------------------------------------
     ADD FILES
  --------------------------------------------- */

  const addFiles = async (
    newFiles: FileList | File[]
  ) => {
    const fileArray = Array.from(newFiles);

    const maxSize = 50 * 1024 * 1024;

    if (files.length + fileArray.length > MAX_FILES) {
      alert(`Maximum ${MAX_FILES} files allowed.`);
      return;
    }

    const oversizedFiles = fileArray.filter(
      (file) => file.size > maxSize
    );

    if (oversizedFiles.length > 0) {
      alert(
        `Some files exceed 50MB limit: ${oversizedFiles
          .map((file) => file.name)
          .join(', ')}`
      );
      return;
    }

    const newFileItems: FileItem[] =
      fileArray.map((file) => ({
        id: generateId(),
        file,
        status: 'pending',
        progress: 0,
      }));

    setFiles((prev) => [...prev, ...newFileItems]);

    if (toolId === 'jpg-to-pdf') {
      setState('loading');

      setLoadingProgress({
        loaded: 0,
        total: newFileItems.length,
      });

      const allFiles = [
        ...files.map((file) => file.file),
        ...fileArray,
      ];

      const size = estimatePdfSize(
        allFiles,
        compressionLevel
      );

      setEstimatedSize({
        min: size.minSize,
        max: size.maxSize,
      });
    } else {
      setState('selected');
    }
  };

  /* ---------------------------------------------
     REMOVE FILE
  --------------------------------------------- */

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const updated = prev.filter(
        (file) => file.id !== id
      );

      if (updated.length === 0) {
        setState('idle');
        setEstimatedSize(null);
      } else if (toolId === 'jpg-to-pdf') {
        const remainingFiles = updated
          .filter((file) => file.status === 'ready')
          .map((file) => file.file);

        if (remainingFiles.length > 0) {
          const size = estimatePdfSize(
            remainingFiles,
            compressionLevel
          );

          setEstimatedSize({
            min: size.minSize,
            max: size.maxSize,
          });
        }
      }

      return updated;
    });
  };

  /* ---------------------------------------------
     CLEAR ALL
  --------------------------------------------- */

  const clearAllFiles = () => {
    setFiles([]);
    setState('idle');
    setEstimatedSize(null);

    setLoadingProgress({
      loaded: 0,
      total: 0,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /* ---------------------------------------------
     DRAG & DROP
  --------------------------------------------- */

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);

      if (event.dataTransfer.files.length > 0) {
        addFiles(event.dataTransfer.files);
      }
    },
    [files, compressionLevel]
  );

  const handleDragOver = (
    event: React.DragEvent
  ) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (
      event.target.files &&
      event.target.files.length > 0
    ) {
      addFiles(event.target.files);
    }
  };

  /* ---------------------------------------------
     FILE STATUS
  --------------------------------------------- */

  const updateFileProgress = (
    id: string,
    progress: number
  ) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === id
          ? {
              ...file,
              progress,
            }
          : file
      )
    );
  };

  const updateFileStatus = (
    id: string,
    status: FileItem['status'],
    result?: {
      blob: Blob;
      filename: string;
    },
    pdfResult?: MergeResult,
    error?: string
  ) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === id
          ? {
              ...file,
              status,
              result,
              pdfResult,
              error,
            }
          : file
      )
    );
  };

  /* ---------------------------------------------
     CONVERT / MERGE
  --------------------------------------------- */

  const processFilesWithCompression = async () => {
    if (files.length === 0) return;

    setState('converting');

    try {
      /* JPG → PDF */

      if (toolId === 'jpg-to-pdf') {
        const readyFiles = files.filter(
          (file) =>
            file.status === 'ready' &&
            file.thumbnail
        );

        if (readyFiles.length === 0) {
          throw new Error(
            'No valid images ready for conversion'
          );
        }

        const imageData: ImageProcessingResult[] =
          readyFiles.map((file) => ({
            id: file.id,
            file: file.file,
            thumbnail: file.thumbnail!,
            width: file.width!,
            height: file.height!,
          }));

        readyFiles.forEach((file) => {
          updateFileStatus(
            file.id,
            'converting'
          );
        });

        const result = await mergeImagesToPdf(
          imageData,
          compressionLevel,
          (current, total, imageId) => {
            const progress = Math.round(
              (current / total) * 100
            );

            updateFileProgress(
              imageId,
              progress
            );
          }
        );

        updateFileStatus(
          readyFiles[0].id,
          'done',
          {
            blob: result.blob,
            filename: result.filename,
          },
          result
        );

        readyFiles
          .slice(1)
          .forEach((file) => {
            updateFileStatus(
              file.id,
              'done'
            );
          });

      /* PNG → JPG */

      } else if (toolId === 'png-to-jpg') {
        for (const fileItem of files) {
          updateFileStatus(
            fileItem.id,
            'converting'
          );

          updateFileProgress(
            fileItem.id,
            20
          );

          try {
            const compressed =
              await compressImage(
                fileItem.file,
                compressionLevel
              );

            const baseName =
              fileItem.file.name.replace(
                /\.[^.]+$/,
                ''
              );

            updateFileProgress(
              fileItem.id,
              100
            );

            updateFileStatus(
              fileItem.id,
              'done',
              {
                blob: compressed.blob,
                filename: `${baseName}.jpg`,
              }
            );
          } catch (error: any) {
            updateFileStatus(
              fileItem.id,
              'error',
              undefined,
              undefined,
              error?.message ||
                'Conversion failed'
            );
          }
        }

      /* Other tools */

      } else {
        for (const fileItem of files) {
          updateFileStatus(
            fileItem.id,
            'error',
            undefined,
            undefined,
            'This conversion is not yet implemented. Try JPG to PDF, PNG to JPG, or Image Compressor.'
          );
        }
      }

      setState('done');

    } catch (error: any) {
      setState('error');

      files.forEach((file) => {
        updateFileStatus(
          file.id,
          'error',
          undefined,
          undefined,
          error?.message ||
            'Conversion failed'
        );
      });
    }
  };

  /* ---------------------------------------------
     DOWNLOAD
  --------------------------------------------- */

  const downloadFile = (
    fileItem: FileItem
  ) => {
    if (!fileItem.result) return;

    const url = URL.createObjectURL(
      fileItem.result.blob
    );

    const anchor =
      document.createElement('a');

    anchor.href = url;
    anchor.download =
      fileItem.result.filename;

    document.body.appendChild(anchor);
    anchor.click();

    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);
  };

  const downloadAllAsZip = async () => {
    const completedFiles =
      files.filter(
        (file) =>
          file.status === 'done' &&
          file.result
      );

    if (completedFiles.length === 0)
      return;

    const JSZip =
      (await import('jszip')).default;

    const zip = new JSZip();

    completedFiles.forEach((file) => {
      if (file.result) {
        zip.file(
          file.result.filename,
          file.result.blob
        );
      }
    });

    const zipBlob =
      await zip.generateAsync({
        type: 'blob',
      });

    const url =
      URL.createObjectURL(zipBlob);

    const anchor =
      document.createElement('a');

    anchor.href = url;
    anchor.download =
      `converted-files-${Date.now()}.zip`;

    document.body.appendChild(anchor);
    anchor.click();

    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);
  };

  /* ---------------------------------------------
     VALUES
  --------------------------------------------- */

  const totalSize = files.reduce(
    (sum, file) =>
      sum + file.file.size,
    0
  );

  const completedCount =
    files.filter(
      (file) => file.status === 'done'
    ).length;

  const hasErrors =
    files.some(
      (file) => file.status === 'error'
    );

  const mergedPdf =
    files.find(
      (file) => file.pdfResult
    )?.pdfResult;

  const totalSavings = mergedPdf
    ? calculateCompressionPercentage(
        mergedPdf.originalSize,
        mergedPdf.pdfSize
      )
    : 0;

  const readyImages: ImageProcessingResult[] =
    files
      .filter(
        (file) =>
          file.status === 'ready' &&
          file.thumbnail
      )
      .map((file) => ({
        id: file.id,
        file: file.file,
        thumbnail: file.thumbnail!,
        width: file.width!,
        height: file.height!,
      }));

  /* ---------------------------------------------
     UI
  --------------------------------------------- */

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">

        {/* =========================================
            UPLOAD / SELECTED
        ========================================= */}

        {(state === 'idle' ||
          state === 'loading' ||
          state === 'selected') && (
          <motion.div
            key="upload"
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -8,
            }}
            transition={{
              duration: 0.25,
            }}
          >

            {/* Compression */}
            {toolId === 'jpg-to-pdf' &&
              files.length > 0 && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: -8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="mb-5"
                >
                  <CompressionLevelSelector
                    value={compressionLevel}
                    onChange={(level) => {
                      setCompressionLevel(level);

                      if (
                        readyImages.length > 0
                      ) {
                        const size =
                          estimatePdfSize(
                            readyImages.map(
                              (image) =>
                                image.file
                            ),
                            level
                          );

                        setEstimatedSize({
                          min: size.minSize,
                          max: size.maxSize,
                        });
                      }
                    }}
                  />
                </motion.div>
              )}

            {/* Main upload card */}

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() =>
                fileInputRef.current?.click()
              }
              className={`
                relative overflow-hidden
                rounded-2xl
                border
                transition-all duration-200
                cursor-pointer
                bg-white
                ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-100'
                    : 'border-slate-200 hover:border-blue-400 hover:shadow-md'
                }
              `}
            >

              <div className="flex flex-col items-center justify-center py-14 px-6 text-center">

                {/* Upload icon */}

                <motion.div
                  animate={{
                    scale: isDragging
                      ? 1.08
                      : 1,
                  }}
                  className="
                    w-16 h-16
                    rounded-2xl
                    bg-blue-50
                    border border-blue-100
                    flex items-center
                    justify-center
                    mb-5
                  "
                >
                  <Upload
                    className="
                      w-8 h-8
                      text-blue-600
                    "
                  />
                </motion.div>

                <h3 className="
                  text-slate-900
                  text-xl
                  font-bold
                  mb-2
                ">
                  {isDragging
                    ? 'Drop your files here'
                    : 'Upload your files'}
                </h3>

                <p className="
                  text-slate-500
                  text-sm
                  mb-6
                ">
                  {toolId === 'jpg-to-pdf'
                    ? `Upload up to ${MAX_FILES} images and combine them into one PDF`
                    : 'Drag & drop your files here, or browse from your device'}
                </p>

                {/* Browse button */}

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    px-7 py-3
                    rounded-lg
                    bg-blue-600
                    hover:bg-blue-700
                    text-white
                    text-sm
                    font-semibold
                    transition-colors
                    shadow-sm
                  "
                >
                  <Upload className="w-4 h-4" />
                  UPLOAD FILES
                </button>

                <p className="
                  text-slate-400
                  text-xs
                  mt-4
                ">
                  Supported: {tool.accept}
                  {' '}• Max 50MB per file
                </p>

              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={tool.accept}
                className="hidden"
                onChange={handleInputChange}
              />

            </div>

            {/* =====================================
                FILES
            ===================================== */}

            {files.length > 0 && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="mt-5"
              >

                {/* Loading */}

                {state === 'loading' &&
                  toolId === 'jpg-to-pdf' && (
                    <div className="
                      mb-4
                      px-4 py-3
                      rounded-xl
                      bg-blue-50
                      border border-blue-100
                    ">
                      <div className="
                        flex items-center
                        gap-3
                      ">
                        <div className="
                          w-7 h-7
                          rounded-full
                          border-2
                          border-blue-100
                          border-t-blue-600
                          animate-spin
                        />

                        <span className="
                          text-slate-600
                          text-sm
                        ">
                          Loading thumbnails...
                          {' '}
                          {loadingProgress.loaded}
                          {' '}
                          of
                          {' '}
                          {loadingProgress.total}
                        </span>
                      </div>
                    </div>
                  )}

                {/* JPG thumbnails */}

                {toolId === 'jpg-to-pdf' &&
                  readyImages.length > 0 && (
                    <div className="mb-5">
                      <ImageReorderGrid
                        images={readyImages}
                        onReorder={(reordered) => {
                          const reorderedMap =
                            new Map(
                              reordered.map(
                                (image, index) => [
                                  image.id,
                                  index,
                                ]
                              )
                            );

                          setFiles((prev) =>
                            [
                              ...prev,
                            ].sort(
                              (a, b) => {
                                const aIndex =
                                  reorderedMap.get(
                                    a.id
                                  ) ??
                                  prev.indexOf(a);

                                const bIndex =
                                  reorderedMap.get(
                                    b.id
                                  ) ??
                                  prev.indexOf(b);

                                return (
                                  aIndex -
                                  bIndex
                                );
                              }
                            )
                          );
                        }}
                        onRemove={removeFile}
                      />
                    </div>
                  )}

                {/* Other file types */}

                {toolId !== 'jpg-to-pdf' && (
                  <div className="
                    flex items-center
                    justify-between
                    mb-4
                    px-1
                  ">

                    <div className="
                      flex items-center
                      gap-2
                    ">
                      <Package className="
                        w-5 h-5
                        text-blue-600
                      " />

                      <span className="
                        text-slate-800
                        font-semibold
                        text-sm
                      ">
                        {files.length}
                        {' '}
                        file
                        {files.length !== 1
                          ? 's'
                          : ''}
                        {' '}selected
                      </span>

                      <span className="
                        text-slate-400
                        text-sm
                      ">
                        ({formatBytes(totalSize)})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={clearAllFiles}
                      className="
                        text-slate-400
                        hover:text-red-500
                        transition-colors
                        flex items-center
                        gap-1.5
                        text-sm
                      "
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear all
                    </button>

                  </div>
                )}

                {/* Estimated size */}

                {toolId === 'jpg-to-pdf' &&
                  estimatedSize &&
                  readyImages.length > 0 && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: -5,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      className="
                        mb-4
                        px-4 py-3
                        rounded-xl
                        bg-slate-50
                        border border-slate-200
                      "
                    >
                      <div className="
                        flex items-center
                        justify-between
                        flex-wrap
                        gap-4
                      ">

                        <div className="
                          flex items-center
                          gap-4
                        ">
                          <div>
                            <p className="
                              text-slate-400
                              text-xs
                            ">
                              Original
                            </p>

                            <p className="
                              text-slate-800
                              font-semibold
                              text-sm
                            ">
                              {formatBytes(
                                totalSize
                              )}
                            </p>
                          </div>

                          <ArrowRight className="
                            w-4 h-4
                            text-slate-300
                          " />

                          <div>
                            <p className="
                              text-slate-400
                              text-xs
                            ">
                              Est. PDF
                            </p>

                            <p className="
                              text-green-600
                              font-semibold
                              text-sm
                            ">
                              {formatBytes(
                                estimatedSize.min
                              )}
                              {' - '}
                              {formatBytes(
                                estimatedSize.max
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="
                          flex items-center
                          gap-2
                          bg-green-50
                          border border-green-100
                          px-3 py-1.5
                          rounded-lg
                        ">
                          <Zap className="
                            w-4 h-4
                            text-green-600
                          " />

                          <span className="
                            text-green-700
                            text-xs
                            font-semibold
                          ">
                            ~
                            {Math.round(
                              70 -
                              (estimatedSize.min /
                                totalSize) *
                                100
                            )}
                            % smaller
                          </span>
                        </div>

                      </div>
                    </motion.div>
                  )}

                {/* JPG clear button */}

                {toolId === 'jpg-to-pdf' &&
                  readyImages.length > 0 && (
                    <div className="
                      flex justify-end
                      mb-4
                    ">
                      <button
                        type="button"
                        onClick={clearAllFiles}
                        className="
                          inline-flex
                          items-center
                          gap-1.5
                          px-3 py-2
                          rounded-lg
                          text-slate-500
                          hover:text-red-500
                          hover:bg-red-50
                          text-sm
                          transition-colors
                        "
                      >
                        <Trash2 className="w-4 h-4" />
                        CLEAR
                      </button>
                    </div>
                  )}

                {/* Main action */}

                <button
                  type="button"
                  onClick={processFilesWithCompression}
                  disabled={
                    files.length === 0 ||
                    (toolId === 'jpg-to-pdf' &&
                      readyImages.length === 0)
                  }
                  className="
                    w-full
                    py-3.5
                    rounded-xl
                    bg-blue-600
                    hover:bg-blue-700
                    disabled:bg-slate-300
                    disabled:cursor-not-allowed
                    text-white
                    text-sm
                    font-bold
                    shadow-sm
                    transition-colors
                    flex items-center
                    justify-center
                    gap-2
                  "
                >
                  {toolId === 'jpg-to-pdf' ? (
                    <>
                      <Layers className="w-5 h-5" />
                      COMBINE
                      <span className="
                        min-w-6 h-6
                        px-1.5
                        rounded-full
                        bg-white/20
                        flex items-center
                        justify-center
                        text-xs
                      ">
                        {readyImages.length}
                      </span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-5 h-5" />
                      Convert to {tool.to}
                    </>
                  )}
                </button>

              </motion.div>
            )}

          </motion.div>
        )}

        {/* =========================================
            CONVERTING
        ========================================= */}

        {state === 'converting' && (
          <motion.div
            key="converting"
            initial={{
              opacity: 0,
              scale: 0.97,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="py-10"
          >

            <div className="
              text-center
              mb-7
            ">
              <div className="
                w-16 h-16
                mx-auto
                mb-4
                rounded-full
                border-4
                border-blue-100
                border-t-blue-600
                animate-spin
              />

              <p className="
                text-slate-900
                font-bold
                text-xl
                mb-2
              ">
                {toolId === 'jpg-to-pdf'
                  ? 'Merging images into PDF...'
                  : 'Converting files...'}
              </p>

              {toolId === 'jpg-to-pdf' &&
                mergedPdf === undefined && (
                  <p className="
                    text-slate-500
                    text-sm
                  ">
                    Processing
                    {' '}
                    {
                      files.filter(
                        (file) =>
                          file.status ===
                          'converting'
                      ).length
                    }
                    {' '}of{' '}
                    {
                      files.filter(
                        (file) =>
                          file.status !==
                          'pending'
                      ).length
                    }
                    {' '}pages
                  </p>
                )}
            </div>

            {toolId === 'jpg-to-pdf' && (
              <div className="
                space-y-2
                max-h-72
                overflow-y-auto
              ">
                {files
                  .filter(
                    (file) =>
                      file.status ===
                        'converting' ||
                      file.progress > 0
                  )
                  .map((fileItem) => (
                    <div
                      key={fileItem.id}
                      className="
                        flex items-center
                        gap-3
                        p-3
                        rounded-xl
                        bg-slate-50
                        border border-slate-100
                      "
                    >

                      <div className="
                        w-16 h-16
                        rounded-lg
                        bg-slate-100
                        flex items-center
                        justify-center
                        flex-shrink-0
                        overflow-hidden
                      ">
                        {fileItem.thumbnail ? (
                          <img
                            src={
                              fileItem.thumbnail
                            }
                            alt=""
                            className="
                              w-full h-full
                              object-cover
                            "
                          />
                        ) : (
                          <File className="
                            w-6 h-6
                            text-blue-500
                          " />
                        )}
                      </div>

                      <div className="
                        flex-1
                        min-w-0
                      ">
                        <div className="
                          flex items-center
                          justify-between
                          mb-1.5
                        ">
                          <p className="
                            text-slate-900
                            text-sm
                            font-medium
                            truncate
                          ">
                            {fileItem.file.name}
                          </p>

                          <span className="
                            text-blue-600
                            text-xs
                            font-medium
                          ">
                            {fileItem.progress}%
                          </span>
                        </div>

                        <div className="
                          w-full
                          bg-slate-200
                          rounded-full
                          h-1.5
                          overflow-hidden
                        ">
                          <motion.div
                            className="
                              h-full
                              bg-blue-600
                              rounded-full
                            "
                            initial={{
                              width: 0,
                            }}
                            animate={{
                              width: `${fileItem.progress}%`,
                            }}
                          />
                        </div>
                      </div>

                    </div>
                  ))}
              </div>
            )}

          </motion.div>
        )}

        {/* =========================================
            DONE
        ========================================= */}

        {state === 'done' && (
          <motion.div
            key="done"
            initial={{
              opacity: 0,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="py-8"
          >

            <div className="
              text-center
              mb-8
            ">

              <motion.div
                initial={{
                  scale: 0,
                }}
                animate={{
                  scale: 1,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                }}
                className="
                  w-20 h-20
                  rounded-full
                  bg-green-100
                  border border-green-200
                  flex items-center
                  justify-center
                  mb-6
                  mx-auto
                "
              >
                <CheckCircle2 className="
                  w-10 h-10
                  text-green-600
                " />
              </motion.div>

              <h3 className="
                text-slate-900
                font-bold
                text-2xl
                mb-2
              ">
                {toolId === 'jpg-to-pdf'
                  ? 'PDF Created!'
                  : 'Conversion Complete!'}
              </h3>

              {toolId === 'jpg-to-pdf' &&
                mergedPdf && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 10,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    className="
                      mt-4
                      p-5
                      rounded-xl
                      bg-green-50
                      border border-green-100
                      inline-block
                    "
                  >
                    <div className="
                      flex items-center
                      justify-center
                      gap-3
                      text-sm
                      mb-3
                    ">
                      <div className="text-center">
                        <p className="
                          text-slate-500
                          text-xs
                          mb-1
                        ">
                          Images
                        </p>
                        <p className="
                          text-slate-900
                          font-bold
                          text-lg
                        ">
                          {mergedPdf.pageCount}
                        </p>
                      </div>

                      <ArrowRight className="
                        w-5 h-5
                        text-green-500
                      " />

                      <div className="text-center">
                        <p className="
                          text-slate-500
                          text-xs
                          mb-1
                        ">
                          PDF Pages
                        </p>
                        <p className="
                          text-slate-900
                          font-bold
                          text-lg
                        ">
                          {mergedPdf.pageCount}
                        </p>
                      </div>
                    </div>

                    <div className="
                      flex items-center
                      justify-center
                      gap-3
                      text-sm
                    ">
                      <div className="text-center">
                        <p className="
                          text-slate-500
                          text-xs
                          mb-1
                        ">
                          Original Size
                        </p>
                        <p className="
                          text-slate-900
                          font-semibold
                        ">
                          {formatBytes(
                            mergedPdf.originalSize
                          )}
                        </p>
                      </div>

                      <ArrowRight className="
                        w-5 h-5
                        text-green-500
                      " />

                      <div className="text-center">
                        <p className="
                          text-slate-500
                          text-xs
                          mb-1
                        ">
                          PDF Size
                        </p>
                        <p className="
                          text-green-600
                          font-bold
                        ">
                          {formatBytes(
                            mergedPdf.pdfSize
                          )}
                        </p>
                      </div>

                      <div className="
                        ml-2
                        px-3 py-1.5
                        bg-green-200
                        rounded-lg
                      ">
                        <p className="
                          text-green-700
                          font-bold
                        ">
                          {totalSavings}% saved
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

              {!hasErrors &&
                toolId !== 'jpg-to-pdf' && (
                  <p className="
                    text-slate-500
                    text-sm
                    mt-4
                  ">
                    {completedCount} file
                    {completedCount !== 1
                      ? 's'
                      : ''}{' '}
                    converted successfully
                  </p>
                )}
            </div>

            {/* PDF result */}

            {toolId === 'jpg-to-pdf' &&
            mergedPdf ? (
              <div className="
                space-y-3
                mb-8
              ">
                <div className="
                  flex items-center
                  gap-3
                  p-4
                  rounded-xl
                  bg-slate-50
                  border border-slate-100
                ">

                  <div className="
                    w-12 h-12
                    rounded-lg
                    bg-red-100
                    flex items-center
                    justify-center
                    flex-shrink-0
                  ">
                    <FileText className="
                      w-6 h-6
                      text-red-500
                    " />
                  </div>

                  <div className="
                    flex-1
                    min-w-0
                  ">
                    <p className="
                      text-slate-900
                      text-sm
                      font-medium
                      truncate
                    ">
                      {mergedPdf.filename}
                    </p>

                    <p className="
                      text-slate-500
                      text-xs
                    ">
                      {mergedPdf.pageCount}
                      {' '}
                      page
                      {mergedPdf.pageCount !== 1
                        ? 's'
                        : ''}
                      {' | '}
                      {formatBytes(
                        mergedPdf.pdfSize
                      )}
                    </p>
                  </div>

                  <DownloadButton
                    onClick={() => {
                      const fileItem =
                        files.find(
                          (file) =>
                            file.pdfResult
                        );

                      if (fileItem) {
                        downloadFile(
                          fileItem
                        );
                      }
                    }}
                    size="md"
                    text="Download"
                  />

                </div>
              </div>
            ) : (
              <div className="
                space-y-2
                max-h-64
                overflow-y-auto
                pr-2
                mb-8
              ">
                {files.map((fileItem) => (
                  <div
                    key={fileItem.id}
                    className={`
                      flex items-center
                      gap-3
                      p-3
                      rounded-xl
                      border
                      ${
                        fileItem.status ===
                        'done'
                          ? 'bg-slate-50 border-slate-100'
                          : 'bg-red-50 border-red-100'
                      }
                    `}
                  >

                    <div
                      className={`
                        w-10 h-10
                        rounded-lg
                        flex items-center
                        justify-center
                        flex-shrink-0
                        ${
                          fileItem.status ===
                          'done'
                            ? 'bg-green-100'
                            : 'bg-red-100'
                        }
                      `}
                    >
                      {fileItem.status ===
                      'done' ? (
                        <CheckCircle2 className="
                          w-5 h-5
                          text-green-600
                        " />
                      ) : (
                        <AlertCircle className="
                          w-5 h-5
                          text-red-500
                        " />
                      )}
                    </div>

                    <div className="
                      flex-1
                      min-w-0
                    ">
                      <p className="
                        text-slate-900
                        text-sm
                        font-medium
                        truncate
                      ">
                        {fileItem.result
                          ?.filename ||
                          fileItem.file.name}
                      </p>

                      <p className="
                        text-slate-500
                        text-xs
                      ">
                        {fileItem.result
                          ? formatBytes(
                              fileItem
                                .result
                                .blob
                                .size
                            )
                          : fileItem.error ||
                            'Failed'}
                      </p>
                    </div>

                    {fileItem.status ===
                      'done' &&
                      fileItem.result && (
                        <DownloadButton
                          onClick={() =>
                            downloadFile(
                              fileItem
                            )
                          }
                          size="sm"
                          text="Download"
                        />
                      )}

                  </div>
                ))}
              </div>
            )}

            {/* Bottom buttons */}

            <div className="
              flex flex-col
              gap-3
            ">
              {completedCount > 1 &&
                toolId !== 'jpg-to-pdf' && (
                  <DownloadButton
                    onClick={
                      downloadAllAsZip
                    }
                    text="Download All as ZIP"
                    size="md"
                    fullWidth
                  />
                )}

              <button
                type="button"
                onClick={clearAllFiles}
                className="
                  w-full
                  py-3.5
                  rounded-xl
                  text-sm
                  font-semibold
                  text-slate-600
                  hover:text-slate-900
                  bg-slate-100
                  hover:bg-slate-200
                  border border-slate-200
                  flex items-center
                  justify-center
                  gap-2
                  transition-all
                "
              >
                <RotateCcw className="w-4 h-4" />
                Convert More
              </button>
            </div>

          </motion.div>
        )}

        {/* =========================================
            ERROR
        ========================================= */}

        {state === 'error' && (
          <motion.div
            key="error"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            className="py-10 text-center"
          >
            <div className="
              w-16 h-16
              mx-auto mb-4
              rounded-full
              bg-red-50
              border border-red-100
              flex items-center
              justify-center
            ">
              <AlertCircle className="
                w-8 h-8
                text-red-500
              " />
            </div>

            <h3 className="
              text-slate-900
              font-bold
              text-xl
              mb-2
            ">
              Something went wrong
            </h3>

            <p className="
              text-slate-500
              text-sm
              mb-6
            ">
              Please try again with your files.
            </p>

            <button
              type="button"
              onClick={clearAllFiles}
              className="
                inline-flex
                items-center
                gap-2
                px-6 py-3
                rounded-lg
                bg-blue-600
                hover:bg-blue-700
                text-white
                text-sm
                font-semibold
              "
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
