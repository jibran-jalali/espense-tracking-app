import { useState, useCallback, useRef } from 'react'
import { motion } from 'motion/react'
import { useDropzone } from 'react-dropzone'
import { HiArrowLeft, HiPhotograph, HiCamera } from 'react-icons/hi'
import { OCRResult } from '../../types'
import { RunActionButton } from '../ui/RunActionButton'

interface OCRUploadProps {
  onResult: (result: OCRResult) => void
  onBack: () => void
}

export function OCRUpload({ onResult, onBack }: OCRUploadProps) {
  const [image, setImage] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [scanDone, setScanDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('Take a clear photo of the full receipt')
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const processImage = async (targetImage?: string) => {
    const imageToProcess = targetImage || image
    if (!imageToProcess) return

    setProcessing(true)
    setScanDone(false)
    setError(null)
    setStatus('Reading receipt details...')

    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 35000)
    try {
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageToProcess }),
        signal: controller.signal,
      })

      const text = await res.text()
      let data: any = null

      if (text) {
        try {
          data = JSON.parse(text)
        } catch {
          data = { error: text }
        }
      }

      if (!res.ok) throw new Error(data.error || 'OCR failed')

      setScanDone(true)
      setStatus('Receipt detected. Filling the form...')
      onResult(data as OCRResult)
    } catch (err: any) {
      setError(err.name === 'AbortError' ? 'Scanning took too long. Try a clearer, closer receipt photo.' : err.message || 'Failed to process image')
      setStatus('Try a brighter, flatter photo with the full receipt visible')
    } finally {
      window.clearTimeout(timeout)
      setProcessing(false)
    }
  }

  const handleFile = useCallback((file?: File) => {
    if (!file) return

    setError(null)
    setScanDone(false)
    setStatus('Preparing image...')
    resizeReceiptImage(file)
      .then((nextImage) => {
      setImage(nextImage)
      processImage(nextImage)
      })
      .catch(() => {
        setError('Could not read this image. Try another photo.')
        setStatus('Try a JPG or PNG receipt photo')
      })
  }, [])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    handleFile(acceptedFiles[0])
  }, [handleFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-gray-600">
        <HiArrowLeft className="h-4 w-4" /> Back
      </button>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0])
          e.currentTarget.value = ''
        }}
      />

      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <p className="mb-3 text-center text-sm font-semibold text-gray-700">
          Smart receipt scan
        </p>
        <p className="mb-3 text-center text-xs font-medium text-gray-400">{status}</p>
        <RunActionButton
          idleLabel="Open Camera"
          doneLabel="Receipt Ready"
          onStart={() => cameraInputRef.current?.click()}
          running={processing}
          done={scanDone}
          onCancel={() => setProcessing(false)}
          onReset={() => setScanDone(false)}
        />
      </div>

      {!image ? (
        <div
          {...getRootProps()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-all ${
            isDragActive
              ? 'border-black bg-white'
              : 'border-gray-200 bg-gray-50 hover:border-gray-300'
          }`}
        >
          <input {...getInputProps()} />
          <HiCamera className="mb-3 h-12 w-12 text-black" />
          <p className="text-sm font-medium text-gray-600">
            {isDragActive ? 'Drop receipt here' : 'Or tap here to upload receipt'}
          </p>
          <p className="mt-1 text-xs text-gray-400">Full receipt, bright light, JPG/PNG up to 10MB</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl">
            <img src={image} alt="Receipt" className="w-full object-contain" />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm font-medium text-red-500"
            >
              {error}
            </motion.p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                setImage(null)
                setScanDone(false)
                cameraInputRef.current?.click()
              }}
              className="flex-1 rounded-2xl border border-gray-200 px-5 py-3.5 text-sm font-semibold text-gray-600 transition-all active:scale-[0.98]"
            >
              Retake
            </button>
            <button
              onClick={() => processImage()}
              disabled={processing}
              className="flex-1 rounded-2xl bg-black px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-black/15 transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-60"
            >
              {processing ? 'Processing...' : 'Extract'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function resizeReceiptImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        if (!context) return reject(new Error('Canvas unavailable'))

        const attempts = [
          { maxSide: 1280, quality: 0.72 },
          { maxSide: 1100, quality: 0.64 },
          { maxSide: 900, quality: 0.58 },
          { maxSide: 760, quality: 0.52 },
        ]

        for (const attempt of attempts) {
          const scale = Math.min(1, attempt.maxSide / Math.max(img.width, img.height))
          const width = Math.max(1, Math.round(img.width * scale))
          const height = Math.max(1, Math.round(img.height * scale))
          canvas.width = width
          canvas.height = height
          context.clearRect(0, 0, width, height)
          context.drawImage(img, 0, 0, width, height)

          const dataUrl = canvas.toDataURL('image/jpeg', attempt.quality)
          // Keep the JSON request comfortably below Vercel's serverless body limit.
          if (dataUrl.length < 2_800_000 || attempt === attempts[attempts.length - 1]) {
            resolve(dataUrl)
            return
          }
        }
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}
