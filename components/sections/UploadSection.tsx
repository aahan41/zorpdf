'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowRight,
  ArrowUpCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Layers,
  RotateCcw,
  XCircle,
  Zap,
} from 'lucide-react';

import type { Tool, ToolId } from './ToolsGrid';
import type { CompressionLevel } from '@/lib/imageCompression';
import type { ImageProcessingResult, MergeResult } from '@/lib/pdfMerger';

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef =
    useRef<HTMLDivElement>(null);

  /*
   * --------------------------------------------------
   * HELPERS
   * --------------------------------------------------
   */

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

  /*
   * --------------------------------------------------
   * LOAD IMAGE INFORMATION
   * --------------------------------------------------
   */

  useEffect(() => {
    if (toolId !== 'jpg-to-pdf') {
      return;
    }

    const pendingFiles = files.filter(
      (item) => item.status === 'pending'
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

      for (let index = 0; index < pendingFiles.length; index++) {
        const item = pendingFiles[index];

        try {
          const info = await loadImageInfo(item.file);

          if (cancelled) {
            return;
          }

          updateFile(item.id, {
            status: 'ready',
            thumbnail: info.thumbnail,
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
              error: 'Could not read this image.',
            });
          }
        }

        if (!cancelled) {
          setLoadingProgress({
            loaded: index + 1,
            total: pendingFiles.length,
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

  /*
   * --------------------------------------------------
   * UPDATE ESTIMATED PDF SIZE
   * --------------------------------------------------
   */

  useEffect(() => {
    if (toolId !== 'jpg-to-pdf') {
      return;
    }

    const readyFiles = files
      .filter(
        (item) => item.status === 'ready'
      )
      .map((item) => item.file);

    if (readyFiles.length === 0) {
      setEstimatedSize(null);
      return;
    }

    try {
      const estimate = estimatePdfSize(
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

  /*
   * --------------------------------------------------
   * ADD FILES
   * --------------------------------------------------
   */

  const addFiles = (
    fileList: FileList | File[]
  ) => {
    const incoming = Array.from(fileList);

    if (incoming.length === 0) {
      return;
    }

    if (
      files.length + incoming.length >
      MAX_FILES
    ) {
      window.alert(
        `You can upload a maximum of ${MAX_FILES} files.`
      );
      return;
    }

    const invalidSize = incoming.filter(
      (file) => file.size > MAX_FILE_SIZE
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

  /*
   * --------------------------------------------------
   * FILE INPUT
   * --------------------------------------------------
   */

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files) {
      addFiles(event.target.files);
    }
  };

  /*
   * --------------------------------------------------
   * DRAG AND DROP
   * --------------------------------------------------
   */

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setIsDragging(false);

    if (event.dataTransfer.files) {
      addFiles(event.dataTransfer.files);
    }
  };

  /*
   * --------------------------------------------------
   * SINGLE FILE DOWNLOAD (jpg-to-pdf grid button)
   * --------------------------------------------------
   */

  const downloadSingleImageAsPdf = async (
    item: FileItem
  ) => {
    if (!item.thumbnail || !item.width || !item.height) {
      return;
    }

    setDownloadingId(item.id);

    try {
      const result = await mergeImagesToPdf(
        [
          {
            id: item.id,
            file: item.file,
            thumbnail: item.thumbnail,
            width: item.width,
            height: item.height,
          },
        ],
        compressionLevel
      );

      const url = URL.createObjectURL(result.blob);
      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download = result.filename;

      document.body.appendChild(anchor);
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

  /*
   * --------------------------------------------------
   * DOWNLOAD
   * --------------------------------------------------
   */

  const downloadResult = (
    item: FileItem
  ) => {
    if (!item.result) {
      return;
    }

    const url = URL.createObjectURL(
      item.result.blob
    );

    const anchor =
      document.createElement('a');

    anchor.href = url;
    anchor.download =
      item.result.filename;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  };

  /*
   * --------------------------------------------------
   * ZIP DOWNLOAD
   * --------------------------------------------------
   */

  const downloadAllAsZip = async () => {
    const completed = files.filter(
      (item) =>
        item.status === 'done' &&
        item.result
    );

    if (completed.length === 0) {
      return;
    }

    try {
      const JSZip =
        (await import('jszip')).default;

      const zip = new JSZip();

      completed.forEach((item) => {
        if (item.result) {
          zip.file(
            item.result.filename,
            item.result.blob
          );
        }
      });

      const blob =
        await zip.generateAsync({
          type: 'blob',
        });

      const url =
        URL.createObjectURL(blob);

      const anchor =
        document.createElement('a');

      anchor.href = url;
      anchor.download = `converted-files-${Date.now()}.zip`;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        'ZIP creation failed:',
        error
      );
    }
  };

  /*
   * --------------------------------------------------
   * CONVERT FILES
   * --------------------------------------------------
   */

  const processFiles = async () => {
    if (files.length === 0) {
      return;
    }

    setState('converting');

    /*
     * JPG TO PDF
     */

    if (toolId === 'jpg-to-pdf') {
      const readyItems = files.filter(
        (item) =>
          item.status === 'ready' &&
          item.thumbnail
      );

      if (readyItems.length === 0) {
        setState('error');
        return;
      }

      readyItems.forEach((item) => {
        updateFile(item.id, {
          status: 'converting',
          progress: 0,
        });
      });

      try {
        const imageData: ImageProcessingResult[] =
          readyItems.map((item) => ({
            id: item.id,
            file: item.file,
            thumbnail: item.thumbnail!,
            width: item.width!,
            height: item.height!,
          }));

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
                      (current / total) *
                        100
                    )
                  : 0;

              updateFile(imageId, {
                progress,
              });
            }
          );

        updateFile(readyItems[0].id, {
          status: 'done',
          progress: 100,
          result: {
            blob: result.blob,
            filename: result.filename,
          },
          pdfResult: result,
        });

        readyItems
          .slice(1)
          .forEach((item) => {
            updateFile(item.id, {
              status: 'done',
              progress: 100,
              pdfResult: result,
            });
          });

        setState('done');
      } catch (error) {
        console.error(
          'JPG to PDF failed:',
          error
        );

        readyItems.forEach((item) => {
          updateFile(item.id, {
            status: 'error',
            error:
              'PDF creation failed.',
          });
        });

        setState('error');
      }

      return;
    }

    /*
     * PNG TO JPG
     */

    if (toolId === 'png-to-jpg') {
      let failed = false;

      for (const item of files) {
        updateFile(item.id, {
          status: 'converting',
          progress: 10,
        });

        try {
          const compressed =
            await compressImage(
              item.file,
              compressionLevel
            );

          updateFile(item.id, {
            status: 'done',
            progress: 100,
            result: {
              blob: compressed.blob,
              filename:
                item.file.name.replace(
                  /\.[^/.]+$/,
                  ''
                ) + '.jpg',
            },
          });
        } catch (error) {
          console.error(
            'PNG to JPG failed:',
            error
          );

          failed = true;

          updateFile(item.id, {
            status: 'error',
            error:
              'Image conversion failed.',
          });
        }
      }

      setState(
        failed ? 'error' : 'done'
      );

      return;
    }

    /*
     * OTHER TOOLS
     *
     * Keep the UI working while the
     * individual converter is implemented.
     */

    files.forEach((item) => {
      updateFile(item.id, {
        status: 'error',
        error:
          'This converter is not implemented yet.',
      });
    });

    setState('error');
  };

  /*
   * --------------------------------------------------
   * DERIVED VALUES
   * --------------------------------------------------
   */

  const totalSize = files.reduce(
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

  const goPrev = () => {
    scrollContainerRef.current?.scrollBy({
      left: -190,
      behavior: 'smooth',
    });
  };

  const goNext = () => {
    scrollContainerRef.current?.scrollBy({
      left: 190,
      behavior: 'smooth',
    });
  };

  const pdfResult = files.find(
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

  /*
   * --------------------------------------------------
   * RENDER
   * --------------------------------------------------
   */

  return (
    <div className="w-full">
      {state === 'idle' ||
      state === 'loading' ||
      state === 'selected' ? (
        <div>
          {/* TOP ACTION BUTTONS */}

          <div className="flex items-center justify-center gap-3 mb-6">
            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="
                inline-flex
                items-center
                gap-2
                rounded-lg
                bg-blue-600
                px-6
                py-3
                text-sm
                font-bold
                text-white
                shadow-sm
                transition
                hover:bg-blue-700
              "
            >
              <ArrowUpCircle className="h-4 w-4" />
              UPLOAD FILES
            </button>

            <button
              type="button"
              onClick={clearAllFiles}
              disabled={files.length === 0}
              className="
                inline-flex
                items-center
                gap-2
                rounded-lg
                bg-red-100
                px-6
                py-3
                text-sm
                font-bold
                text-red-400
                shadow-sm
                transition
                hover:bg-red-200
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              <XCircle className="h-4 w-4" />
              CLEAR
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={tool.accept}
              onChange={handleInputChange}
              className="hidden"
            />
          </div>

          {/* DROP ZONE */}

          <div className="relative flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={goPrev}
              disabled={files.length === 0}
              aria-label="Scroll left"
              className="
                shrink-0
                text-red-300
                transition
                hover:text-red-400
                disabled:cursor-not-allowed
                disabled:opacity-30
              "
            >
              <ChevronLeft className="h-8 w-8" />
            </button>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                flex-1
                min-h-[220px]
                rounded-xl
                border-2
                border-dashed
                flex
                items-center
                ${
                  files.length === 0
                    ? 'justify-center'
                    : ''
                }
                px-4
                py-6
                text-center
                transition-all
                ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-blue-200 bg-white'
                }
              `}
            >
              {files.length === 0 ? (
                <p className="font-semibold text-blue-200">
                  {isDragging
                    ? 'Drop files here'
                    : 'Drop Your Files Here'}
                </p>
              ) : (
                <div
                  ref={scrollContainerRef}
                  className="flex w-full gap-4 overflow-x-auto scroll-smooth py-1 px-1"
                >
                  {files.map((item) => (
                    <div
                      key={item.id}
                      className="w-[170px] shrink-0"
                    >
                      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                        <div className="truncate bg-slate-800/90 px-2 py-1.5 text-[11px] font-semibold text-white">
                          {item.file.name}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeFile(item.id)
                          }
                          aria-label="Remove file"
                          className="absolute right-1.5 top-8 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow transition hover:bg-red-50 hover:text-red-600"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>

                        <div className="flex h-24 w-full items-center justify-center bg-slate-100">
                          {toolId === 'jpg-to-pdf' &&
                          item.thumbnail ? (
                            <img
                              src={item.thumbnail}
                              alt={item.file.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FileText className="h-8 w-8 text-blue-600" />
                          )}
                        </div>
                      </div>

                      {toolId === 'jpg-to-pdf' && (
                        <button
                          type="button"
                          onClick={() =>
                            downloadSingleImageAsPdf(
                              item
                            )
                          }
                          disabled={
                            downloadingId === item.id ||
                            item.status !== 'ready'
                          }
                          className="
                            mx-auto
                            mt-2
                            flex
                            items-center
                            justify-center
                            gap-1.5
                            rounded-full
                            border
                            border-slate-200
                            bg-white
                            px-4
                            py-1.5
                            text-[11px]
                            font-bold
                            text-slate-700
                            shadow-sm
                            transition
                            hover:bg-slate-50
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                          "
                        >
                          {downloadingId === item.id ? (
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                          ) : (
                            <ArrowDownCircle className="h-3.5 w-3.5" />
                          )}
                          DOWNLOAD
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={goNext}
              disabled={files.length === 0}
              aria-label="Scroll right"
              className="
                shrink-0
                text-red-300
                transition
                hover:text-red-400
                disabled:cursor-not-allowed
                disabled:opacity-30
              "
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          </div>

          {files.length > 0 && (
            <p className="mt-3 text-center text-xs text-slate-400">
              {files.length} file
              {files.length !== 1 ? 's' : ''} selected
              {' • '}
              {formatBytes(totalSize)}
            </p>
          )}

          {/* LOADING */}

          {state === 'loading' && (
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />

                <span className="text-sm text-blue-700">
                  Loading images...
                  {' '}
                  {loadingProgress.loaded}
                  {' / '}
                  {loadingProgress.total}
                </span>
              </div>
            </div>
          )}

          {/* ESTIMATE */}

          {toolId === 'jpg-to-pdf' &&
            estimatedSize &&
            readyImages.length > 0 && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-slate-400">
                        Original
                      </p>

                      <p className="text-sm font-bold text-slate-800">
                        {formatBytes(totalSize)}
                      </p>
                    </div>

                    <ArrowRight className="h-4 w-4 text-slate-300" />

                    <div>
                      <p className="text-xs text-slate-400">
                        Estimated PDF
                      </p>

                      <p className="text-sm font-bold text-green-600">
                        {formatBytes(estimatedSize.min)}
                        {' - '}
                        {formatBytes(estimatedSize.max)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
                    <Zap className="h-4 w-4 text-green-600" />

                    <span className="text-xs font-semibold text-green-700">
                      Smart Compression
                    </span>
                  </div>
                </div>
              </div>
            )}

          {/* COMBINE / CONVERT */}

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={processFiles}
              disabled={
                files.length === 0 ||
                (toolId === 'jpg-to-pdf' &&
                  readyImages.length === 0)
              }
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-lg
                bg-slate-400
                px-8
                py-3
                text-sm
                font-bold
                text-white
                shadow-sm
                transition
                enabled:bg-blue-600
                enabled:hover:bg-blue-700
                disabled:cursor-not-allowed
                disabled:opacity-70
              "
            >
              {toolId === 'jpg-to-pdf' ? (
                <>
                  <ArrowDownCircle className="h-4 w-4" />
                  COMBINE
                  {readyImages.length > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-xs">
                      {readyImages.length}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <ArrowDownCircle className="h-4 w-4" />
                  {`CONVERT TO ${tool.to.toUpperCase()}`}
                </>
              )}
            </button>
          </div>

          <p className="mt-3 text-center text-xs text-slate-400">
            Supported: {tool.accept} • Max 50MB per file
          </p>
        </div>
      ) : null}

      {/* CONVERTING */}

      {state === 'converting' && (
        <div className="py-16 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 animate-spin items-center justify-center rounded-full border-4 border-blue-100 border-t-blue-600">
            <span />
          </div>

          <h2 className="text-xl font-bold text-slate-900">
            {toolId === 'jpg-to-pdf'
              ? 'Creating your PDF...'
              : 'Converting your files...'}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Please wait while your files are
            being processed.
          </p>
        </div>
      )}

      {/* DONE */}

      {state === 'done' && (
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

          {/* PDF RESULT */}

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
                    {pdfResult.pageCount}{' '}
                    page
                    {pdfResult.pageCount !== 1
                      ? 's'
                      : ''}{' '}
                    •{' '}
                    {formatBytes(
                      pdfResult.pdfSize
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className="text-xs text-slate-400">
                    Original
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {formatBytes(
                      pdfResult.originalSize
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className="text-xs text-slate-400">
                    PDF
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {formatBytes(
                      pdfResult.pdfSize
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-green-50 p-3 text-center">
                  <p className="text-xs text-green-600">
                    Saved
                  </p>

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
                      (item) =>
                        item.result
                    );

                  if (resultFile) {
                    downloadResult(
                      resultFile
                    );
                  }
                }}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Download PDF
              </button>
            </div>
          )}

          {/* OTHER RESULTS */}

          {!pdfResult &&
            completedFiles.length > 0 && (
              <div className="mx-auto mt-8 max-w-xl space-y-3">
                {completedFiles.map(
                  (item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-green-50">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {
                            item
                              .result
                              ?.filename
                          }
                        </p>

                        <p className="text-xs text-slate-400">
                          {item.result
                            ? formatBytes(
                                item
                                  .result
                                  .blob
                                  .size
                              )
                            : ''}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          downloadResult(
                            item
                          )
                        }
                        className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                      >
                        Download
                      </button>
                    </div>
                  )
                )}
              </div>
            )}

          {/* DOWNLOAD ZIP */}

          {completedFiles.length > 1 &&
            !pdfResult && (
              <button
                type="button"
                onClick={downloadAllAsZip}
                className="mx-auto mt-4 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Download All as ZIP
              </button>
            )}

          {/* RESET */}

          <button
            type="button"
            onClick={clearAllFiles}
            className="mx-auto mt-4 flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
          >
            <RotateCcw className="h-4 w-4" />
            Convert More
          </button>
        </div>
      )}

      {/* ERROR */}

      {state === 'error' && (
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
      )}
    </div>
  );
}
