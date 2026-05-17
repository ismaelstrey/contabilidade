import { Context } from 'hono';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const UPLOAD_PATH = 'images/testimonials/';

type UploadEnv = Env & {
  MEDIA_BUCKET?: R2Bucket;
  MEDIA_PUBLIC_URL?: string;
};

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo nao permitido. Tipos aceitos: ${ALLOWED_IMAGE_TYPES.join(', ')}`
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho maximo: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }

  return { valid: true };
}

export function generateUniqueFileName(originalName: string): string {
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  return `testimonial_${crypto.randomUUID()}.${extension}`;
}

export async function uploadImage(file: File, env: UploadEnv): Promise<UploadResult> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error
    };
  }

  if (!env.MEDIA_BUCKET) {
    return {
      success: false,
      error: 'Bucket R2 nao configurado'
    };
  }

  const fileName = generateUniqueFileName(file.name);
  const fullPath = UPLOAD_PATH + fileName;

  await env.MEDIA_BUCKET.put(fullPath, file.stream(), {
    httpMetadata: { contentType: file.type }
  });

  const publicBase = env.MEDIA_PUBLIC_URL?.replace(/\/$/, '');
  const imageUrl = publicBase ? `${publicBase}/${fullPath}` : fullPath;

  return {
    success: true,
    url: imageUrl
  };
}

export async function processImageUpload(c: Context<{ Bindings: Env }>): Promise<UploadResult> {
  const formData = await c.req.formData();
  const file = formData.get('photo');

  if (!(file instanceof File)) {
    return {
      success: false,
      error: 'Nenhum arquivo de imagem fornecido'
    };
  }

  return await uploadImage(file, c.env as UploadEnv);
}

export async function deleteImage(imageUrl: string, env: UploadEnv): Promise<boolean> {
  if (!env.MEDIA_BUCKET) {
    return false;
  }

  await env.MEDIA_BUCKET.delete(imageUrl.replace(/^https?:\/\/[^/]+\//, ''));
  return true;
}
