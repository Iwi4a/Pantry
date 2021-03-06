import request from 'supertest';
import { app } from './../server';
import { userData } from './../__mocks__/user';
import { startDB, stopDB } from './../__mocks__/db';

describe('User tests', () => {
    
    beforeAll(async () => {
        startDB();
    })

    afterAll(async () => {
        stopDB(); 
    })

    it('it fails when token does not exist', async () => {
        let response = await request(app)
                                .post('/auth/checkAuth')
        expect(response.statusCode).toBe(401)
    })

    it('it signs up a new user', async () => {
        const response = await request(app)
                                .post('/auth/signup')
                                .send(userData);
        expect(response.statusCode).toBe(200)
    });

    it('fails to create new user if password is missing', async () => {
        const response = await request(app)
                                .post('/auth/signup')
                                .send({ email: 'test@dada.da'});
        expect(response.statusCode).toBe(500)
    });

    it('rejects with error if password is not correct', async () => {
        await request(app).post('/auth/signup').send(userData);
        const response = await request(app)
                                .post('/auth/signin')
                                .send({ email: userData.email, password: 'meeh'});

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBeDefined();
    });

    it('signs a new user in', async () => {
        await request(app).post('/auth/signup').send(userData);
        const response = await request(app)
                                .post('/auth/signin')
                                .send(userData);
        expect(response.statusCode).toBe(200)
    });

    it('it passes auth check when token exists', async () => {
        await request(app).post('/auth/signup').send(userData);
        let signUserIn = await request(app).post('/auth/signin').send(userData);
        let response = await request(app)
                                .post('/auth/checkAuth')
                                .set('Cookie', signUserIn.header['set-cookie'])
        expect(response.statusCode).toBe(200)
    });
});