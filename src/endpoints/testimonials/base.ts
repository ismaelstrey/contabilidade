import { z } from 'zod';

/**
 * Schema Zod para validação de testimonials
 */
export const testimonial = z.object({
  id: z.number().int(),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),
  company: z.string().max(100, 'Nome da empresa deve ter no máximo 100 caracteres').optional(),
  message: z.string().min(10, 'Mensagem deve ter pelo menos 10 caracteres').max(1000, 'Mensagem deve ter no máximo 1000 caracteres'),
  rating: z.number().int().min(1, 'Avaliação deve ser entre 1 e 5').max(5, 'Avaliação deve ser entre 1 e 5'),
  photo: z.string().url('URL da foto deve ser válida').optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

/**
 * Schema para criação de testimonial (sem campos automáticos)
 */
export const testimonialCreate = testimonial.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

/**
 * Schema para atualização de testimonial (todos os campos opcionais)
 */
export const testimonialUpdate = testimonialCreate.partial();

/**
 * Schema para resposta pública
 */
export const testimonialResponse = testimonial;

/**
 * Modelo para Chanfana com tipagem correta
 */
export const TestimonialModel = {
  tableName: "testimonials",
  primaryKeys: ["id"],
  schema: testimonial,
  serializer: (obj: object): object => {
    const testimonial = obj as Record<string, unknown>;
    return {
      ...obj,
      rating: Number(testimonial.rating),
      company: testimonial.company || null,
      photo: testimonial.photo || null,
    };
  },
  serializerObject: testimonial,
};

/**
 * Tipos TypeScript derivados
 */
export type Testimonial = z.infer<typeof testimonial>;
export type TestimonialCreate = z.infer<typeof testimonialCreate>;
export type TestimonialUpdate = z.infer<typeof testimonialUpdate>;
export type TestimonialResponse = z.infer<typeof testimonialResponse>;

/**
 * Função para validar rating
 */
export function validateRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

/**
 * Função para sanitizar mensagem
 */
export function sanitizeMessage(message: string): string {
  return message.trim().replace(/\s+/g, ' ');
}