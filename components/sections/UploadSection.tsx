'use client';

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type PointerEvent,
} from 'react';

import {
  AlertCircle,
  ArrowDownCircle,
  ArrowRight,
  ArrowUpCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  GripVertical,
  RotateCcw,
  XCircle,
  Zap,
} from 'lucide-react';

import type { Tool, ToolId } from './ToolsGrid';
import type { CompressionLevel } from '@/lib/imageCompression';

import type {
  ImageProcessingResult,
  MergeResult,
} from '@/lib/pdfMerger';

import {
  loadImageInfo,
  mergeImagesToPdf,
} from '@/lib/pdfMerger';

import {
  calculateCompressionPercentage,
  compressImage,
  formatBytes,
} from '@/lib/imageCompression';

import { estimatePdfSize } from '@/lib/pdfEstimator';

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
const MAX_FILE_SIZE = 50 * 1024 * 1024;

function createId(): string {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export default function UploadSection({
  toolId,
  tool,
}: UploadSectionProps) {
  const [state, setState] = useState<
    'idle' | 'loading' | 'selected' | 'converting' | 'done' | 'error'
  >('idle');

  const [files, setFiles] = useState<FileItem[]>([]);

  const [compressionLevel, setCompressionLevel] =
    useState<CompressionLevel>('balanced');

  const [isDragging, setIsDragging] = useState(false);

  const [loadingProgress, setLoadingProgress] = useState({
    loaded: 0,
    total: 0,
  });

  const [estimatedSize, setEstimatedSize] = useState<{
    min: number;
    max: number;
  } | null>(null);

  const [downloadingId, setDownloadingId] =
    useState<string | null>(null);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const updateFile = (
    id: string,
    changes: Partial<FileItem>
  ) => {
    setFiles((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              ...changes,
            }
          : item
      )
    );
  };

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

  const removeFile = (id: string) => {
    setFiles((current) => {
      const next = current.filter(
        (item) => item.id !== id
      );

      if (next.length === 0) {
        setState('idle');
        setEstimatedSize(null);
      }

      return next;
    });
  };

  useEffect(() => {
    if (toolId !== 'jpg-to-pdf') {
      return;
    }

    const pendingFiles = files.filter(
      (item) =>
        item.status === 'pending'
    );

    if (pendingFiles.length === 0) {
      return;
    }

    let cancelled = false;

    const loadImages = async () => {
      setState('loading');

      setLoadingProgress({
        loaded: 0,
        total: pendingFiles.length,
      });

      for (
        let index = 0;
        index < pendingFiles.length;
        index++
      ) {
        const item =
          pendingFiles[index];

        try {
          const info =
            await loadImageInfo(
              item.file
            );

          if (cancelled) {
            return;
          }

          updateFile(item.id, {
            status: 'ready',
            thumbnail:
              info.thumbnail,
            width: info.width,
            height: info.height,
          });
        } catch (error) {
          console.error(
            'Could not load image:',
            error
          );

          if (!cancelled) {
            updateFile(item.id, {
              status: 'error',
              error:
                'Could not read this image.',
            });
          }
        }

        if (!cancelled) {
          setLoadingProgress({
            loaded: index + 1,
            total:
              pendingFiles.length,
          });
        }
      }

      if (!cancelled) {
        setState('selected');
      }
    };

    loadImages();

    return () => {
      cancelled = true;
    };
  }, [files, toolId]);

  useEffect(() => {
    if (toolId !== 'jpg-to-pdf') {
      return;
    }

    const readyFiles = files
      .filter(
        (item) =>
          item.status === 'ready'
      )
      .map(
        (item) => item.file
      );

    if (readyFiles.length === 0) {
      setEstimatedSize(null);
      return;
    }

    try {
      const estimate =
        estimatePdfSize(
          readyFiles,
          compressionLevel
        );

      setEstimatedSize({
        min: estimate.minSize,
        max: estimate.maxSize,
      });
    } catch (error) {
      console.error(
        'Could not estimate PDF size:',
        error
      );
    }
  }, [
    files,
    compressionLevel,
    toolId,
  ]);

  const addFiles = (
    fileList: FileList | File[]
  ) => {
    const incoming =
      Array.from(fileList);

    if (incoming.length === 0) {
      return;
    }

    if (
      files.length +
        incoming.length >
      MAX_FILES
    ) {
      window.alert(
        `You can upload a maximum of ${MAX_FILES} files.`
      );

      return;
    }

    const invalidSize =
      incoming.filter(
        (file) =>
          file.size > MAX_FILE_SIZE
      );

    if (invalidSize.length > 0) {
      window.alert(
        'Each file must be smaller than 50MB.'
      );

      return;
    }

    const newItems: FileItem[] =
      incoming.map((file) => ({
        id: createId(),
        file,
        status: 'pending',
        progress: 0,
      }));

    setFiles((current) => [
      ...current,
      ...newItems,
    ]);

    if (toolId !== 'jpg-to-pdf') {
      setState('selected');
    }
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files) {
      addFiles(
        event.target.files
      );
    }
  };

  const handleDragOver = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();

    if (
      event.dataTransfer.types?.includes(
        'Files'
      )
    ) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();

    setIsDragging(false);

    const isFileDrop =
      event.dataTransfer.types?.includes(
        'Files'
      );

    if (
      isFileDrop &&
      event.dataTransfer.files &&
      event.dataTransfer.files.length > 0
    ) {
      addFiles(
        event.dataTransfer.files
      );
    }
  };

  const downloadSingleImageAsPdf =
    async (item: FileItem) => {
      if (
        !item.thumbnail ||
        !item.width ||
        !item.height
      ) {
        return;
      }

      setDownloadingId(item.id);

      try {
        const result =
          await mergeImagesToPdf(
            [
              {
                id: item.id,
                file: item.file,
                thumbnail:
                  item.thumbnail,
                width: item.width,
                height: item.height,
              },
            ],
            compressionLevel
          );

        const url =
          URL.createObjectURL(
            result.blob
          );

        const anchor =
          document.createElement('a');

        anchor.href = url;

        anchor.download =
          result.filename;

        document.body.appendChild(
          anchor
        );

        anchor.click();

        anchor.remove();

        URL.revokeObjectURL(url);
      } catch (error) {
        console.error(
          'Single file download failed:',
          error
        );
      } finally {
        setDownloadingId(null);
      }
    };

  const downloadResult = (
    item: FileItem
  ) => {
    if (!item.result) {
      return;
    }

    const url =
      URL.createObjectURL(
        item.result.blob
      );

    const anchor =
      document.createElement('a');

    anchor.href = url;

    anchor.download =
      item.result.filename;

    document.body.appendChild(
      anchor
    );

    anchor.click();

    anchor.remove();

    URL.revokeObjectURL(url);
  };

  const processFiles = async () => {
    if (files.length === 0) {
      return;
    }

    setState('converting');

    if (toolId === 'jpg-to-pdf') {
      const readyItems =
        files.filter(
          (item) =>
            item.status === 'ready' &&
            item.thumbnail
        );

      if (
        readyItems.length === 0
      ) {
        setState('error');
        return;
      }

      readyItems.forEach(
        (item) => {
          updateFile(item.id, {
            status: 'converting',
            progress: 0,
          });
        }
      );

      try {
        const imageData:
          ImageProcessingResult[] =
          readyItems.map(
            (item) => ({
              id: item.id,
              file: item.file,
              thumbnail:
                item.thumbnail!,
              width:
                item.width!,
              height:
                item.height!,
            })
          );

        const result =
          await mergeImagesToPdf(
            imageData,
            compressionLevel,
            (
              current,
              total,
              imageId
            ) => {
              const progress =
                total > 0
                  ? Math.round(
                      (current /
                        total) *
                        100
                    )
                  : 0;

              updateFile(
                imageId,
                {
                  progress,
                }
              );
            }
          );

        updateFile(
          readyItems[0].id,
          {
            status: 'done',
            progress: 100,
            result: {
              blob: result.blob,
              filename:
                result.filename,
            },
            pdfResult: result,
          }
        );

        readyItems
          .slice(1)
          .forEach((item) => {
            updateFile(
              item.id,
              {
                status: 'done',
                progress: 100,
              }
            );
          });

        setState('done');
      } catch (error) {
        console.error(
          'JPG to PDF failed:',
          error
        );

        readyItems.forEach(
          (item) => {
            updateFile(
              item.id,
              {
                status: 'error',
                error:
                  'PDF creation failed.',
              }
            );
          }
        );

        setState('error');
      }

      return;
    }

    if (toolId === 'png-to-jpg') {
      let failed = false;

      for (const item of files) {
        updateFile(
          item.id,
          {
            status: 'converting',
            progress: 10,
          }
        );

        try {
          const compressed =
            await compressImage(
              item.file,
              compressionLevel
            );

          updateFile(
            item.id,
            {
              status: 'done',
              progress: 100,
              result: {
                blob:
                  compressed.blob,
                filename:
                  item.file.name.replace(
                    /\.[^/.]+$/,
                    ''
                  ) + '.jpg',
              },
            }
          );
        } catch (error) {
          console.error(
            'PNG to JPG failed:',
            error
          );

          failed = true;

          updateFile(
            item.id,
            {
              status: 'error',
              error:
                'Image conversion failed.',
            }
          );
        }
      }

      setState(
        failed ? 'error' : 'done'
      );

      return;
    }

    if (toolId === 'pdf-to-jpg') {
      const {
        convertPdfToImages,
        createZipFromImages,
      } = await import(
        '@/lib/pdfToImage'
      );

      let failed = false;

      for (const item of files) {
        updateFile(
          item.id,
          {
            status: 'converting',
            progress: 10,
          }
        );

        try {
          const {
            images,
            totalPages,
          } =
            await convertPdfToImages(
              item.file,
              (
                current,
                total
              ) => {
                const progress =
                  total > 0
                    ? Math.round(
                        (current /
                          total) *
                          100
                      )
                    : 0;

                updateFile(
                  item.id,
                  {
                    progress,
                  }
                );
              }
            );

          if (
            totalPages === 1
          ) {
            updateFile(
              item.id,
              {
                status: 'done',
                progress: 100,
                result: {
                  blob:
                    images[0]
                      .blob,
                  filename:
                    images[0]
                      .filename,
                },
              }
            );
          } else {
            const zipBlob =
              await createZipFromImages(
                images
              );

            const baseName =
              item.file.name.replace(
                /\.[^/.]+$/,
                ''
              );

            updateFile(
              item.id,
              {
                status: 'done',
                progress: 100,
                result: {
                  blob: zipBlob,
                  filename:
                    `${baseName}-pages.zip`,
                },
              }
            );
          }
        } catch (error) {
          console.error(
            'PDF to JPG failed:',
            error
          );

          failed = true;

          updateFile(
            item.id,
            {
              status: 'error',
              error:
                'Could not convert this PDF.',
            }
          );
        }
      }

      setState(
        failed ? 'error' : 'done'
      );

      return;
    }

    files.forEach(
      (item) => {
        updateFile(
          item.id,
          {
            status: 'error',
            error:
              'This converter is not implemented yet.',
          }
        );
      }
    );

    setState('error');
  };

  const totalSize =
    files.reduce(
      (total, item) =>
        total + item.file.size,
      0
    );

  const readyImages =
    files.filter(
      (item) =>
        item.status === 'ready' &&
        item.thumbnail
    );

  const completedFiles =
    files.filter(
      (item) =>
        item.status === 'done' &&
        item.result
    );

  const pdfResult =
    files.find(
      (item) => item.pdfResult
    )?.pdfResult;

  const savings =
    pdfResult &&
    pdfResult.originalSize > 0
      ? calculateCompressionPercentage(
          pdfResult.originalSize,
          pdfResult.pdfSize
        )
      : 0;

  // =============================================
  // RENDER
  // =============================================

  if (state === 'converting') {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 animate-spin items-center justify-center rounded-full border-4 border-blue-100 border-t-blue-600" />
        <h2 className="text-xl font-bold text-slate-900">
          {toolId === 'jpg-to-pdf'
            ? 'Creating your PDF...'
            : 'Converting your files...'}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Please wait while your files are being processed.
        </p>
      </div>
    );
  }

  if (state === 'done') {
    return (
      <div className="py-8">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="mt-5 text-2xl font-bold text-slate-900">
            {toolId === 'jpg-to-pdf'
              ? 'PDF Created!'
              : 'Conversion Complete!'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Your file is ready to download.
          </p>
        </div>

        {pdfResult && (
          <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50">
                <FileText className="h-6 w-6 text-red-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {pdfResult.filename}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {pdfResult.pageCount} page
                  {pdfResult.pageCount !== 1 ? 's' : ''} •{' '}
                  {formatBytes(pdfResult.pdfSize)}
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-xs text-slate-400">Original</p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {formatBytes(pdfResult.originalSize)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-xs text-slate-400">PDF</p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {formatBytes(pdfResult.pdfSize)}
                </p>
              </div>
              <div className="rounded-xl bg-green-50 p-3 text-center">
                <p className="text-xs text-green-600">Saved</p>
                <p className="mt-1 text-sm font-bold text-green-700">
                  {savings}%
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const resultFile =
                  files.find(
                    (item) => item.result
                  );
                if (resultFile) {
                  downloadResult(resultFile);
                }
              }}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Download PDF
            </button>
          </div>
        )}

        {!pdfResult && completedFiles.length > 0 && (
          <div className="mx-auto mt-8 max-w-xl space-y-3">
            {completedFiles.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-green-50">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {item.result?.filename}
                  </p>
                  <p className="text-xs text-slate-400">
                    {item.result ? formatBytes(item.result.blob.size) : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadResult(item)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={clearAllFiles}
          className="mx-auto mt-4 flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
        >
          <RotateCcw className="h-4 w-4" />
          Convert More
        </button>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="mt-5 text-xl font-bold text-slate-900">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Please try again with your files.
        </p>
        <button
          type="button"
          onClick={clearAllFiles}
          className="mx-auto mt-6 flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <RotateCcw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    );
  }

  // =============================================
  // IDLE / LOADING / SELECTED STATE
  // =============================================

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">UPLOAD FILES</h2>
        <button
          type="button"
          onClick={clearAllFiles}
          disabled={files.length === 0}
          className="text-sm font-medium text-red-400 hover:text-red-600 disabled:opacity-50"
        >
          CLEAR
        </button>
      </div>

      {/* Drop Zone + File List */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          rounded-xl border-2 border-dashed p-4 transition-all cursor-pointer
          ${isDragging ? 'border-blue-400 bg-blue-50/70' : 'border-blue-200 bg-white hover:border-blue-300'}
          ${files.length === 0 ? 'min-h-[180px] flex items-center justify-center' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={tool.accept}
          onChange={handleInputChange}
          className="hidden"
        />

        {files.length === 0 ? (
          <div className="text-center">
            <div className="text-4xl mb-2">📁</div>
            <p className={`text-base font-semibold ${isDragging ? 'text-blue-500' : 'text-blue-200'}`}>
              {isDragging ? 'Drop files here' : 'Drop Your Files Here'}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {files.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg border border-slate-100"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-sm font-medium text-slate-700 truncate">
                    {item.file.name}
                  </span>
                </div>

                {toolId === 'jpg-to-pdf' && item.status === 'ready' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadSingleImageAsPdf(item);
                    }}
                    disabled={downloadingId === item.id}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50 shrink-0 ml-2"
                  >
                    {downloadingId === item.id ? '...' : 'DOWNLOAD'}
                  </button>
                )}

                {item.status === 'error' && (
                  <span className="text-xs text-red-500 shrink-0 ml-2">Error</span>
                )}

                {item.status === 'converting' && (
                  <span className="text-xs text-blue-500 shrink-0 ml-2">{item.progress}%</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File Count */}
      {files.length > 0 && (
        <p className="mt-2 text-xs text-slate-400 text-center">
          {files.length} file{files.length !== 1 ? 's' : ''} selected • {formatBytes(totalSize)}
        </p>
      )}

      {/* Loading */}
      {state === 'loading' && (
        <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
            <span className="text-sm text-blue-700">
              Loading images... {loadingProgress.loaded} / {loadingProgress.total}
            </span>
          </div>
        </div>
      )}

      {/* Estimate */}
      {toolId === 'jpg-to-pdf' && estimatedSize && readyImages.length > 0 && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-400">Original:</span>
              <span className="font-bold text-slate-800">{formatBytes(totalSize)}</span>
              <span className="text-slate-300">→</span>
              <span className="text-slate-400">PDF:</span>
              <span className="font-bold text-green-600">
                {formatBytes(estimatedSize.min)} - {formatBytes(estimatedSize.max)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5">
              <Zap className="h-3.5 w-3.5 text-green-600" />
              <span className="text-xs font-semibold text-green-700">Smart Compression</span>
            </div>
          </div>
        </div>
      )}

      {/* COMBINE */}
      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={processFiles}
          disabled={files.length === 0 || (toolId === 'jpg-to-pdf' && readyImages.length === 0)}
          className="
            flex items-center justify-center gap-2 rounded-full
            bg-slate-800 px-8 py-3 text-sm font-bold text-white
            transition-all hover:bg-slate-900 hover:shadow-md
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          <ArrowDownCircle className="h-4 w-4" />
          COMBINE
          {readyImages.length > 0 && toolId === 'jpg-to-pdf' && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-xs">
              {readyImages.length}
            </span>
          )}
        </button>
      </div>

      {/* Supported */}
      <p className="mt-3 text-center text-xs text-slate-400">
        Supported: {tool.accept} • Max 50MB per file
      </p>
    </div>
  );
}
