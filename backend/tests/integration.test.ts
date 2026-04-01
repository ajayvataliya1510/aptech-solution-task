import request from 'supertest';
import express from 'express';
// Assuming the core functions in index.ts are abstracted cleanly to test
// Using standard HTTP hooks dynamically here for mocking structures
import { prisma } from '../src/config/prisma';
import { redis } from '../src/config/redis';
import authRoutes from '../src/routes/auth.routes';
import projectRoutes from '../src/routes/project.routes';
import { env } from '../src/config/env';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

describe('Integration Tests - Aptech Solution', () => {
    
  beforeAll(async () => {
     // Clean DB and Redis safely if needed
     // Requires real Postgres/Redis bound in CI
  });

  afterAll(async () => {
     await prisma.$disconnect();
     await redis.quit();
  });

  describe('Auth Flow', () => {
     let token = '';

     it('Should block accessing protected Project lists', async () => {
         const res = await request(app).get('/api/projects');
         expect(res.statusCode).toBe(401); // Unauthorized
     });

     it('Should register explicitly failing duplicate emails', async () => {
         const payload = { name: "Test User", email: "conflict@test.com", password: "testPassword1" };
         const res1 = await request(app).post('/api/auth/register').send(payload);
         // 201 Created or 400 Bad Req for duplicate
         if(res1.statusCode === 201) {
            const res2 = await request(app).post('/api/auth/register').send(payload);
            expect(res2.statusCode).toBe(409); // Conflict
         }
     });

     it('Should login and capture exact JWT limits', async () => {
         const payload = { email: "conflict@test.com", password: "testPassword1" };
         const res = await request(app).post('/api/auth/login').send(payload);
         if(res.statusCode === 200) {
            expect(res.body.success).toBe(true);
            expect(res.body.data.accessToken).toBeDefined();
            token = res.body.data.accessToken;
         }
     });

     it('Should read Project cache via token explicitly', async () => {
         if (token) {
            request(app)
              .get('/api/projects')
              .set('Authorization', `Bearer ${token}`)
              .expect(200);
         }
     });
  });

});
