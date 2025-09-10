import { D1ListEndpoint } from 'chanfana';
import { HandleArgs } from '../../types';
import { TestimonialModel } from './base';

/**
 * Endpoint para listagem de testimonials
 * GET /testimonials
 * Endpoint público (não requer autenticação)
 */
export class TestimonialList extends D1ListEndpoint<HandleArgs> {
  _meta = {
    model: TestimonialModel,
  };

  public schema = {
    tags: ['Testimonials'],
    summary: 'Lista testimonials',
    description: 'Lista todos os testimonials com paginação. Endpoint público.',
  };
}