import { D1CreateEndpoint } from 'chanfana';
import { HandleArgs } from '../../types';
import { TestimonialModel } from './base';

/**
 * Endpoint para criação de testimonials
 * POST /testimonials
 * Endpoint público (não requer autenticação)
 */
export class TestimonialCreate extends D1CreateEndpoint<HandleArgs> {
  _meta = {
    model: TestimonialModel,
    fields: TestimonialModel.schema.pick({
      name: true,
      company: true,
      message: true,
      rating: true,
      photo: true,
    }),
  };

  public schema = {
    tags: ['Testimonials'],
    summary: 'Cria novo testimonial',
    description: 'Cria um novo testimonial no sistema. Endpoint público.',
  };

  async beforeCreate(data: any) {
    // Adiciona timestamps manualmente já que removemos o trigger do banco
    const now = new Date().toISOString();
    data.created_at = now;
    data.updated_at = now;
    return data;
  }
}