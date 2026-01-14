module.exports = {
  access: {
    secret: process.env.JWT_ACCESS_SECRET,
    expiresIn: '15m' // 15 minutes
  },
  refresh: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d' // 7 days
  }
};
