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

/*
 * --------------------------------------------------
 * CAROUSEL
 * --------------------------------------------------
 *
 * 5 cards:
 *
 * 170 * 5 = 850
 * 12 * 4 = 48
 * Total = 898px
 */

const CARD_WIDTH = 170;
const CARD_GAP = 12;
const VISIBLE_CARDS = 5;

const CAROUSEL_WIDTH =
  CARD_WIDTH * VISIBLE_CARDS +
  CARD_GAP * (VISIBLE_CARDS - 1);

/*
 * Drag tab/start threshold.
 *
 * Small enough for smooth dragging,
 * large enough to prevent accidental drag
 * when simply clicking a card.
 */
const DRAG_START_DISTANCE = 4;

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

  /*
   * --------------------------------------------------
   * CARD REORDER STATE
   * --------------------------------------------------
   */

  const [reorderDragId, setReorderDragId] =
    useState<string | null>(null);

  const [reorderOverId, setReorderOverId] =
    useState<string | null>(null);

  /*
   * This ref keeps drag information outside React
   * state so pointermove doesn't create renders.
   */
  const reorderSessionRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    active: boolean;
    currentTargetId: string;
  } | null>(null);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

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

    setReorderDragId(null);
    setReorderOverId(null);

    reorderSessionRef.current = null;

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
   * REORDER
   * --------------------------------------------------
   */

  const reorderFiles = (
    draggedId: string,
    targetId: string
  ) => {
    if (
      !draggedId ||
      !targetId ||
      draggedId === targetId
    ) {
      return;
    }

    setFiles((current) => {
      const draggedIndex =
        current.findIndex(
          (item) => item.id === draggedId
        );

      const targetIndex =
        current.findIndex(
          (item) => item.id === targetId
        );

      if (
        draggedIndex === -1 ||
        targetIndex === -1
      ) {
        return current;
      }

      const next = [...current];

      const [draggedItem] =
        next.splice(draggedIndex, 1);

      /*
       * After removing the dragged card,
       * calculate the target index again.
       *
       * This avoids the common off-by-one jump
       * while dragging left/right.
       */
      const newTargetIndex =
        next.findIndex(
          (item) => item.id === targetId
        );

      if (newTargetIndex === -1) {
        return current;
      }

      next.splice(
        newTargetIndex,
        0,
        draggedItem
      );

      return next;
    });
  };

  /*
   * --------------------------------------------------
   * FULL CARD POINTER DRAG
   * --------------------------------------------------
   *
   * User can grab:
   *
   * - image
   * - header
   * - empty card area
   *
   * Whole card is draggable.
   *
   * Only buttons are excluded.
   * --------------------------------------------------
   */

  const startReorderDrag = (
    event: PointerEvent<HTMLDivElement>,
    id: string
  ) => {
    /*
     * Only primary mouse button.
     */
    if (
      event.pointerType === 'mouse' &&
      event.button !== 0
    ) {
      return;
    }

    /*
     * Never start reorder from buttons/inputs.
     */
    const target =
      event.target as HTMLElement | null;

    if (
      target?.closest(
        'button, a, input, select, textarea'
      )
    ) {
      return;
    }

    /*
     * Don't let browser start image/native drag.
     */
    event.preventDefault();

    const session = {
      id,
      startX: event.clientX,
      startY: event.clientY,
      active: false,
      currentTargetId: id,
    };

    reorderSessionRef.current =
      session;

    /*
     * Keep existing document styles so they
     * can be restored after drag.
     */
    const previousUserSelect =
      document.body.style.userSelect;

    const previousCursor =
      document.body.style.cursor;

    const previousTouchAction =
      document.body.style.touchAction;

    const cleanup = () => {
      document.body.style.userSelect =
        previousUserSelect;

      document.body.style.cursor =
        previousCursor;

      document.body.style.touchAction =
        previousTouchAction;

      window.removeEventListener(
        'pointermove',
        handlePointerMove
      );

      window.removeEventListener(
        'pointerup',
        handlePointerUp
      );

      window.removeEventListener(
        'pointercancel',
        handlePointerUp
      );

      reorderSessionRef.current =
        null;

      setReorderDragId(null);
      setReorderOverId(null);
    };

    const handlePointerMove = (
      moveEvent: globalThis.PointerEvent
    ) => {
      const currentSession =
        reorderSessionRef.current;

      if (!currentSession) {
        return;
      }

      const deltaX =
        moveEvent.clientX -
        currentSession.startX;

      const deltaY =
        moveEvent.clientY -
        currentSession.startY;

      const distance = Math.sqrt(
        deltaX * deltaX +
          deltaY * deltaY
      );

      /*
       * Wait for actual movement.
       */
      if (
        !currentSession.active &&
        distance < DRAG_START_DISTANCE
      ) {
        return;
      }

      /*
       * Activate drag once.
       */
      if (!currentSession.active) {
        currentSession.active = true;

        document.body.style.userSelect =
          'none';

        document.body.style.cursor =
          'grabbing';

        document.body.style.touchAction =
          'none';

        setReorderDragId(
          currentSession.id
        );

        setReorderOverId(
          currentSession.id
        );
      }

      /*
       * Find card under pointer.
       */
      const element =
        document.elementFromPoint(
          moveEvent.clientX,
          moveEvent.clientY
        ) as HTMLElement | null;

      const card =
        element?.closest(
          '[data-file-id]'
        ) as HTMLElement | null;

      const targetId =
        card?.getAttribute(
          'data-file-id'
        );

      if (
        !targetId ||
        targetId ===
          currentSession.currentTargetId
      ) {
        return;
      }

      /*
       * Reorder only when crossing into
       * another card.
       *
       * This keeps pointermove lightweight.
       */
      reorderFiles(
        currentSession.id,
        targetId
      );

      currentSession.currentTargetId =
        targetId;

      setReorderOverId(targetId);
    };

    function handlePointerUp() {
      cleanup();
    }

    window.addEventListener(
      'pointermove',
      handlePointerMove,
      {
        passive: false,
      }
    );

    window.addEventListener(
      'pointerup',
      handlePointerUp
    );

    window.addEventListener(
      'pointercancel',
      handlePointerUp
    );
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

  /*
   * --------------------------------------------------
   * ESTIMATED PDF SIZE
   * --------------------------------------------------
   */

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

  /*
   * --------------------------------------------------
   * ADD FILES
   * --------------------------------------------------
   */

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

  /*
   * --------------------------------------------------
   * INPUT
   * --------------------------------------------------
   */

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files) {
      addFiles(
        event.target.files
      );
    }
  };

  /*
   * --------------------------------------------------
   * OUTER FILE DRAG & DROP
   * --------------------------------------------------
   */

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

  /*
   * --------------------------------------------------
   * SINGLE IMAGE DOWNLOAD
   * --------------------------------------------------
   */

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

  /*
   * --------------------------------------------------
   * NORMAL DOWNLOAD
   * --------------------------------------------------
   */

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

  /*
   * --------------------------------------------------
   * ZIP
   * --------------------------------------------------
   */

  const downloadAllAsZip =
    async () => {
      const completed =
        files.filter(
          (item) =>
            item.status === 'done' &&
            item.result
        );

      if (completed.length === 0) {
        return;
      }

      try {
        const JSZip =
          (
            await import('jszip')
          ).default;

        const zip = new JSZip();

        completed.forEach(
          (item) => {
            if (item.result) {
              zip.file(
                item.result.filename,
                item.result.blob
              );
            }
          }
        );

        const blob =
          await zip.generateAsync({
            type: 'blob',
          });

        const url =
          URL.createObjectURL(
            blob
          );

        const anchor =
          document.createElement('a');

        anchor.href = url;

        anchor.download =
          `converted-files-${Date.now()}.zip`;

        document.body.appendChild(
          anchor
        );

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
   * PROCESS FILES
   * --------------------------------------------------
   */

  const processFiles = async () => {
    if (files.length === 0) {
      return;
    }

    setState('converting');

    /*
     * JPG -> PDF
     */

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

    /*
     * PNG -> JPG
     */

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

    /*
     * PDF -> JPG
     */

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

    /*
     * OTHER TOOLS
     */

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

  /*
   * --------------------------------------------------
   * DERIVED VALUES
   * --------------------------------------------------
   */

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

  /*
   * --------------------------------------------------
   * CAROUSEL NAVIGATION
   * --------------------------------------------------
   */

  const goPrev = () => {
    const container =
      scrollContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollBy({
      left:
        -container.clientWidth,
      behavior: 'smooth',
    });
  };

  const goNext = () => {
    const container =
      scrollContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollBy({
      left:
        container.clientWidth,
      behavior: 'smooth',
    });
  };

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

  /*
   * --------------------------------------------------
   * RENDER (Modified with Left-Right Layout)
   * --------------------------------------------------
   */

  return (
    <div className="w-full">
      {state === 'idle' ||
      state === 'loading' ||
      state === 'selected' ? (
        <div className="flex gap-6">
          {/* =========================================
              LEFT PANEL - Simple Upload UI
          ========================================== */}
          <div className="w-[320px] shrink-0">
            {/* Back button with border arrow */}
            <button
              type="button"
              onClick={() => window.history.back()}
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-800"
            >
              <span className="inline-block h-2 w-2 rotate-45 border-b-2 border-l-2 border-slate-500 transition hover:border-slate-800"></span>
              Back to all tools
            </button>

            {/* Upload Files + Clear */}
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">UPLOAD FILES</h2>
              <button
                type="button"
                onClick={clearAllFiles}
                disabled={files.length === 0}
                className="flex items-center gap-1 text-sm font-medium text-red-400 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                CLEAR
              </button>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center
                rounded-2xl border-2 border-dashed transition-all
                ${isDragging ? 'border-blue-400 bg-blue-50/70' : 'border-blue-200 bg-white hover:border-blue-300'}
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

              <div className="text-center">
                <div className="text-5xl">📁</div>
                <p className={`mt-3 text-base font-semibold ${isDragging ? 'text-blue-500' : 'text-blue-200'}`}>
                  {isDragging ? 'Drop files here' : 'Drop Your Files Here'}
                </p>
                {files.length > 0 && (
                  <p className="mt-2 text-xs text-slate-400">
                    {files.length} file{files.length !== 1 ? 's' : ''} selected • {formatBytes(totalSize)}
                  </p>
                )}
              </div>
            </div>

            {/* COMBINE Button */}
            <div className="mt-5">
              <button
                type="button"
                onClick={processFiles}
                disabled={files.length === 0 || (toolId === 'jpg-to-pdf' && readyImages.length === 0)}
                className="
                  flex w-full items-center justify-center gap-2 rounded-full
                  bg-slate-300 px-8 py-3 text-sm font-bold text-white
                  transition-all enabled:bg-slate-800 enabled:hover:bg-slate-900
                  enabled:hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70
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

          {/* =========================================
              RIGHT PANEL - Existing Carousel
          ========================================== */}
          <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* ACTION BUTTONS */}
            <div className="mb-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="
                  inline-flex
                  h-11
                  items-center
                  gap-2
                  rounded-md
                  bg-blue-600
                  px-6
                  text-sm
                  font-bold
                  text-white
                  shadow-sm
                  transition
                  hover:bg-blue-700
                  active:scale-[0.98]
                "
              >
                <ArrowUpCircle className="h-5 w-5" />
                UPLOAD FILES
              </button>

              <button
                type="button"
                onClick={clearAllFiles}
                disabled={files.length === 0}
                className="
                  inline-flex
                  h-11
                  items-center
                  gap-2
                  rounded-md
                  border
                  border-red-400
                  bg-white
                  px-6
                  text-sm
                  font-bold
                  text-red-500
                  transition
                  hover:bg-red-50
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <XCircle className="h-5 w-5" />
                CLEAR
              </button>
            </div>

            {/* UPLOAD / CAROUSEL AREA */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative
                mx-auto
                w-full
                px-2
                py-3
                transition-all
                ${
                  files.length === 0 ||
                  isDragging
                    ? 'max-w-[898px] min-h-[200px] rounded-2xl border-2 border-dashed'
                    : 'min-h-0'
                }
                ${
                  isDragging
                    ? 'border-blue-400 bg-blue-50/70'
                    : files.length === 0
                    ? 'border-blue-200 bg-white'
                    : 'border-transparent bg-transparent'
                }
              `}
            >
              {files.length === 0 ? (
                <div className="flex min-h-[170px] items-center justify-center">
                  <p
                    className={`
                      text-base
                      font-semibold
                      ${
                        isDragging
                          ? 'text-blue-500'
                          : 'text-blue-200'
                      }
                    `}
                  >
                    {isDragging
                      ? 'Drop files here'
                      : 'Drop Your Files Here'}
                  </p>
                </div>
              ) : (
                /* CAROUSEL */
                <div
                  className="
                    relative
                    mx-auto
                    flex
                    w-full
                    max-w-[982px]
                    items-center
                    justify-center
                  "
                >
                  {/* LEFT ARROW */}
                  <button
                    type="button"
                    onClick={goPrev}
                    disabled={files.length <= VISIBLE_CARDS}
                    aria-label="Previous files"
                    className="
                      z-20
                      flex
                      h-12
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      text-red-300
                      transition-all
                      hover:scale-110
                      hover:text-red-400
                      disabled:pointer-events-none
                      disabled:opacity-0
                    "
                  >
                    <ChevronLeft className="h-10 w-10 stroke-[2.5]" />
                  </button>

                  {/* VIEWPORT */}
                  <div
                    ref={scrollContainerRef}
                    className="
                      min-w-0
                      max-w-[898px]
                      flex-1
                      overflow-x-auto
                      overflow-y-visible
                      scroll-smooth
                      px-0
                      py-2
                      [scrollbar-width:none]
                      [&::-webkit-scrollbar]:hidden
                    "
                    style={{
                      touchAction: 'pan-x',
                    }}
                  >
                    <div
                      className="
                        flex
                        w-max
                        items-stretch
                        gap-3
                      "
                    >
                      {files.map((item) => (
                        <div
                          key={item.id}
                          data-file-id={item.id}
                          onPointerDown={(event) =>
                            startReorderDrag(event, item.id)
                          }
                          className={`
                            relative
                            w-[170px]
                            min-w-[170px]
                            max-w-[170px]
                            shrink-0
                            select-none
                            touch-none
                            cursor-grab
                            will-change-transform
                            ${
                              reorderDragId === item.id
                                ? 'z-50 scale-[1.025] cursor-grabbing'
                                : ''
                            }
                            ${
                              reorderOverId === item.id &&
                              reorderDragId !== item.id
                                ? 'scale-[1.01]'
                                : ''
                            }
                          `}
                          style={{
                            WebkitUserSelect: 'none',
                            WebkitTouchCallout: 'none',
                          }}
                        >
                          {/* CARD */}
                          <div
                            className="
                              relative
                              overflow-hidden
                              rounded-xl
                              border
                              border-slate-200
                              bg-white
                              shadow-[0_2px_8px_rgba(15,23,42,0.10)]
                            "
                          >
                            {/* CARD HEADER */}
                            <div
                              className="
                                flex
                                h-8
                                items-center
                                gap-1
                                bg-slate-800
                                px-1.5
                                text-white
                              "
                            >
                              <div
                                className="
                                  flex
                                  h-6
                                  w-6
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded
                                  text-white/60
                                "
                              >
                                <GripVertical className="h-4 w-4" />
                              </div>

                              <span
                                className="
                                  min-w-0
                                  flex-1
                                  truncate
                                  text-[11px]
                                  font-semibold
                                "
                                title={item.file.name}
                              >
                                {item.file.name}
                              </span>
                            </div>

                            {/* REMOVE */}
                            <button
                              type="button"
                              onPointerDown={(event) => {
                                event.stopPropagation();
                              }}
                              onClick={() => removeFile(item.id)}
                              aria-label="Remove file"
                              className="
                                absolute
                                right-1.5
                                top-9
                                z-30
                                flex
                                h-5
                                w-5
                                items-center
                                justify-center
                                rounded-full
                                bg-white
                                text-slate-500
                                shadow-md
                                transition
                                hover:bg-red-50
                                hover:text-red
