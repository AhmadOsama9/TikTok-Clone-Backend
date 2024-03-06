const request = require('supertest');
const app = require("../server");

describe('Profile Image Change', () => {
  it('should return 400 if no image is provided', async () => {
    const res = await request(app)
      .post('/api/profile/change-image')
      .set('X-API-KEY', 'VZ0|yN#v0*BDx>~%&v{psTMD')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcwOTAxNzU0Mn0.08f7xwmwtnzEXTZ9gqfSsrbAV1i0q3hFkmgoUIdCEec')
      .send({}); // No image provided

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('error');
  });

  // Add more tests for different scenarios
});