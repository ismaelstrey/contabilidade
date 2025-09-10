import { D1DeleteEndpoint } from 'chanfana';
import { HandleArgs } from '../../types';
import { TestimonialModel } from './base';

/**
 * Endpoint para exclusão de testimonials
 * DELETE /testimonials/:id
 * Requer autenticação com role admin
 */
export class TestimonialDelete extends D1DeleteEndpoint<HandleArgs> {
  _meta = {
    model: TestimonialModel,
  };

  public schema = {
    security: [{ bearerAuth: [] }],
    tags: ['Testimonials'],
    summary: 'Exclui testimonial',
    description: 'Exclui um testimonial existente. Requer autenticação com role admin.',
  };
}