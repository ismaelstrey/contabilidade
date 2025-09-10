import { Hono } from 'hono';
import { fromHono } from 'chanfana';
import { TestimonialCreate } from './testimonialCreate';
import { TestimonialList } from './testimonialList';
import { TestimonialRead } from './testimonialRead';
import { TestimonialUpdate } from './testimonialUpdate';
import { TestimonialDelete } from './testimonialDelete';
import { rateLimiter } from '../../middleware/rateLimiting';

// Cria uma instância do Hono para aplicar middleware
const app = new Hono();

// Aplicar rate limiting apenas ao endpoint público de criação
app.use("/", rateLimiter(5, 60000)); // 5 requests por minuto

// Cria o router dos testimonials
const testimonialsRouter = fromHono(app);

// Registra os endpoints
testimonialsRouter.post('/', TestimonialCreate);           // POST /testimonials - Criar depoimento (público)
testimonialsRouter.get('/', TestimonialList);              // GET /testimonials - Listar depoimentos
testimonialsRouter.get('/:id', TestimonialRead);           // GET /testimonials/:id - Obter depoimento específico
testimonialsRouter.put('/:id', TestimonialUpdate);         // PUT /testimonials/:id - Atualizar depoimento
testimonialsRouter.delete('/:id', TestimonialDelete);      // DELETE /testimonials/:id - Deletar depoimento

export { testimonialsRouter };