jest.mock('swagger-jsdoc', () => {
  return jest.fn(() => 'mocked swagger doc');
});

const request = require('supertest');
const app = require('../app');
const { close, connect } = require('../config/db');

const validToken = process.env.validToken;
const inValidToken = process.env.inValidToken;
const notAdminToken = process.env.notAdminToken;
const API_KEY = process.env.API_KEY;

beforeAll(async () => {
  await connect().catch(console.error);
}, 10000);


//something just doesn't make sense which is that
//the jest takes too long to close the connection
//when I close it manually it just takes a second
//but here it takes over 5 minutes what the hell is this nonsense
afterAll(async () => {
  await close().catch(console.error);
});


describe('signup', () => {
    it('should not create a new user', async () => {
      const res = await request(app)
        .post('/api/user/signup')
        .send({
          name: 'Test User',
          phone: '1234567890',
          email: 'ahmedosamaa975@gmail.com',
          username: 'testuser'
        })
        .set('X-API-KEY', API_KEY);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error');
    });
});

describe('verifyEmailCode', () => {
    it('should not verify the user\'s email', async () => {
      const res = await request(app)
        .post('/api/user/verify-email-code')
        .send({
          email: 'ahmedosamaa975@gmail.com'
        })
        .set('X-API-KEY', API_KEY);
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('error')
    });
});

describe('login', () => {
    it('should log in the user', async () => {
      const res = await request(app)
        .post('/api/user/login')
        .send({
          email: 'ahmedosamaa975@gmail.com',
          password: '12345'
      })
      .set('X-API-KEY', API_KEY);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
    });
});

describe('sendOtp', () => {
    it('should send an OTP to the user\'s email', async () => {
      const res = await request(app)
        .post('/api/user/forgot-password/send-otp')
        .send({
          email: 'ahmedosamaa975@gmail.com'
        })
        .set('X-API-KEY', API_KEY);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message');
    });
});


describe('verifyOtpAndSetNewPassword', () => {
    it('should return an error for invalid OTP', async () => {
      const res = await request(app)
        .post('/api/user/forgot-password/verify-otp-and-set-new-password')
        .send({
          email: 'ahmedosamaa975@gmail.com',
          otp: '123456',
          newPassword: 'newpassword'
        })
        .set('X-API-KEY', API_KEY);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error');
    });
});
  
describe('sendVerificationCode', () => {
    it('should return an error for non-existing user', async () => {
      const res = await request(app)
        .post('/api/user/send-verification-code')
        .send({
          email: 'ahmedosamaa975@gmail.com'
        })
        .set('X-API-KEY', API_KEY);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message');
    });
});
  
describe('checkBanStatus', () => {
    it('should return an error for non-existing user', async () => {
      const res = await request(app)
        .get('/api/user/check-ban-status')
        .set('X-API-KEY', API_KEY)
        .set('Authorization', `Bearer ${inValidToken}`);
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error');
    });
});

describe('checkBanStatus', () => {
    it('should return an error for non-existing user', async () => {
      const res = await request(app)
        .get('/api/user/check-ban-status')
        .set('X-API-KEY', API_KEY)
        .set('Authorization', `Bearer ${validToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message');
    });
});
  

describe('referredUser', () => {
    it('should return an error for invalid referral code', async () => {
      const res = await request(app)
        .post('/api/user/refer-user')
        .set('X-API-KEY', API_KEY)
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          referralCode: 'invalidCode'
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error');
    });
});


describe('searchUsersUsingPagination', () => {
  it('should return an error for missing username', async () => {
    const res = await request(app)
      .get('/api/user/search')
      .query({ username: 'm' })
      .set('X-API-KEY', API_KEY)
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('users');
  });
});

describe('autocompleteUsers', () => {
  it('should return an error for missing username', async () => {
    const res = await request(app)
      .get('/api/user/autocomplete')
      .query({ username: '' })
      .set('X-API-KEY', API_KEY)
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('banUser', () => {
  it('should return an error for unauthroized user', async () => {
    const res = await request(app)
      .put('/api/user/ban/2')
      .set('X-API-KEY', API_KEY)
      .set('Authorization', `Bearer ${notAdminToken}`)
      .send({ toBeBannedUserId: '2' });
    expect(res.statusCode).toEqual(403);
    expect(res.body).toHaveProperty('error');
  });
});

describe('unbanUser', () => {
  it('should return an error for unauthroized user', async () => {
    const res = await request(app)
      .put('/api/user/unban/2')
      .set('X-API-KEY', API_KEY)
      .set('Authorization', `Bearer ${notAdminToken}`)
      .send({ toBeUnbannedUserId: '2' });
    expect(res.statusCode).toEqual(403);
    expect(res.body).toHaveProperty('error');
  });
});

describe('getUserInfo', () => {
  it('should return an error for unauthroized user', async () => {
    const res = await request(app)
      .get('/api/user/info/2')
      .set('X-API-KEY', API_KEY)
      .set('Authorization', `Bearer ${notAdminToken}`);
    expect(res.statusCode).toEqual(403);
    expect(res.body).toHaveProperty('error');
  });
});

describe('setUserIsVerified', () => {
  it('should return an error for unauthroized user', async () => {
    const res = await request(app)
      .put('/api/user/verify/2')
      .set('X-API-KEY', API_KEY)
      .set('Authorization', `Bearer ${notAdminToken}`);
    expect(res.statusCode).toEqual(403);
    expect(res.body).toHaveProperty('error');
  });
});

