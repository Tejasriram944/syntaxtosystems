import type { VisualFlowImage, VisualFlowMediaType } from '../types'

export const MAX_VISUAL_FLOW_FILE_BYTES = 5 * 1024 * 1024
export const MAX_VISUAL_FLOW_DIMENSION = 4096
export const VISUAL_FLOW_SECTION_WIDTH = 1030
export const VISUAL_FLOW_IMAGE_WIDTH = 970
export const VISUAL_FLOW_VERTICAL_CHROME = 110
export const VISUAL_FLOW_MEDIA_TYPES: VisualFlowMediaType[] = ['image/png', 'image/jpeg', 'image/webp']

export function getVisualFlowDimensions(flowHeight: number) {
  const height = Math.max(0, flowHeight - VISUAL_FLOW_VERTICAL_CHROME)
  return {
    sectionWidth: VISUAL_FLOW_SECTION_WIDTH,
    sectionHeight: flowHeight,
    imageWidth: VISUAL_FLOW_IMAGE_WIDTH,
    imageHeight: height,
    aspectRatio: height > 0 ? VISUAL_FLOW_IMAGE_WIDTH / height : 0,
  }
}

export function validateVisualFlowFile(file: Pick<File, 'size' | 'type'>): string | null {
  if (!VISUAL_FLOW_MEDIA_TYPES.includes(file.type as VisualFlowMediaType)) return 'Choose a PNG, JPEG, or WebP image.'
  if (file.size > MAX_VISUAL_FLOW_FILE_BYTES) return 'The image must be 5 MB or smaller.'
  if (file.size === 0) return 'The selected image is empty.'
  return null
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read this image.'))
    reader.onerror = () => reject(new Error('Could not read this image.'))
    reader.readAsDataURL(file)
  })
}

function readImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => reject(new Error('The selected file is not a valid image.'))
    image.src = dataUrl
  })
}

function validateDimensions(dimensions: { width: number; height: number }) {
  if (!dimensions.width || !dimensions.height) throw new Error('The selected image has invalid dimensions.')
  if (dimensions.width > MAX_VISUAL_FLOW_DIMENSION || dimensions.height > MAX_VISUAL_FLOW_DIMENSION) {
    throw new Error('Image width and height must each be 4096 px or smaller.')
  }
  return dimensions
}

export async function inspectVisualFlowFile(file: File): Promise<{ width: number; height: number }> {
  const basicError = validateVisualFlowFile(file)
  if (basicError) throw new Error(basicError)
  const objectUrl = URL.createObjectURL(file)
  try {
    return validateDimensions(await readImageDimensions(objectUrl))
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export async function createVisualFlowImage(file: File): Promise<VisualFlowImage> {
  const basicError = validateVisualFlowFile(file)
  if (basicError) throw new Error(basicError)
  const dataUrl = await readAsDataUrl(file)
  const dimensions = validateDimensions(await readImageDimensions(dataUrl))
  return {
    filename: file.name.slice(0, 160),
    media_type: file.type as VisualFlowMediaType,
    data_url: dataUrl,
    ...dimensions,
  }
}
