import { D1UpdateEndpoint } from 'chanfana';
import { HandleArgs } from '../../types';
import { TestimonialModel } from './base';

/**
 * Endpoint para atualização de testimonials
 * PUT /testimonials/:id
 * Requer autenticação com role admin
 */
export class TestimonialUpdate extends D1UpdateEndpoint<HandleArgs> {
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
    security: [{ bearerAuth: [] }],
    tags: ['Testimonials'],
    summary: 'Atualiza testimonial',
    description: 'Atualiza um testimonial existente. Requer autenticação com role admin.',
  };

  async beforeUpdate(data: any) {
    // Adiciona updated_at manualmente já que removemos o trigger do banco
    data.updated_at = new Date().toISOString();
    return data;
  }
}