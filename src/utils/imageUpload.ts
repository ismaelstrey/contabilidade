import { Context } from 'hono';

// Tipos permitidos de imagem
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const UPLOAD_PATH = 'images/testimonials/';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Valida se o arquivo é uma imagem válida
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Verifica o tipo do arquivo
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido. Tipos aceitos: ${ALLOWED_IMAGE_TYPES.join(', ')}`
    };
  }

  // Verifica o tamanho do arquivo
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }

  return { valid: true };
}

/**
 * Gera um nome único para o arquivo
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  return `testimonial_${timestamp}_${randomString}.${extension}`;
}

/**
 * Faz upload da imagem para o Cloudflare R2 (ou storage configurado)
 * Por enquanto, retorna uma URL simulada - implementar integração real conforme necessário
 */
export async function uploadImage(file: File, env: any): Promise<UploadResult> {
  try {
    // Valida o arquivo
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Gera nome único para o arquivo
    const fileName = generateUniqueFileName(file.name);
    const fullPath = UPLOAD_PATH + fileName;

    // TODO: Implementar upload real para Cloudflare R2 ou outro storage
    // Por enquanto, simula o upload e retorna uma URL
    
    // Simula delay de upload
    await new Promise(resolve => setTimeout(resolve, 100));

    // Retorna URL simulada - substituir pela URL real do storage
    const baseUrl = env.BASE_URL || 'https://contabilidade.ismaelstrey.workers.dev';
    const imageUrl = `${baseUrl}/${fullPath}`;

    return {
      success: true,
      url: imageUrl
    };

  } catch (error) {
    console.error('Erro no upload da imagem:', error);
    return {
      success: false,
      error: 'Erro interno no upload da imagem'
    };
  }
}

/**
 * Processa upload de imagem a partir do FormData
 */
export async function processImageUpload(c: Context): Promise<UploadResult> {
  try {
    const formData = await c.req.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      return {
        success: false,
        error: 'Nenhum arquivo de imagem fornecido'
      };
    }

    return await uploadImage(file, c.env);

  } catch (error) {
    console.error('Erro ao processar upload:', error);
    return {
      success: false,
      error: 'Erro ao processar upload da imagem'
    };
  }
}

/**
 * Remove uma imagem do storage (implementar conforme necessário)
 */
export async function deleteImage(imageUrl: string, env: any): Promise<boolean> {
  try {
    // TODO: Implementar remoção real do storage
    // Por enquanto, apenas simula a remoção
    console.log('Removendo imagem:', imageUrl);
    return true;
  } catch (error) {
    console.error('Erro ao remover imagem:', error);
    return false;
  }
}