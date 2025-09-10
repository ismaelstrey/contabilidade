import { D1ReadEndpoint } from 'chanfana';
import { HandleArgs } from '../../types';
import { TestimonialModel } from './base';

/**
 * Endpoint para leitura de testimonial específico
 * GET /testimonials/:id
 * Endpoint público (não requer autenticação)
 */
export class TestimonialRead extends D1ReadEndpoint<HandleArgs> {
  _meta = {
    model: TestimonialModel,
  };

  public schema = {
    tags: ['Testimonials'],
    summary: 'Busca testimonial por ID',
    description: 'Retorna um testimonial específico pelo ID. Endpoint público.',
  };
}