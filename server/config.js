// Every setting the server needs, read from .env in one place.
// New to .env files? See docs/help/environment-variables.md

const isProduction = process.env.NODE_ENV === 'production';

// Fail at startup with a clear message, instead of a confusing crash later.
function requireSetting(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing setting ${name}. Add it to your .env file (see .env.example).`);
  }
  return value;
}

// Required on the live site; optional on your laptop.
function productionSetting(name) {
  return isProduction ? requireSetting(name) : process.env[name] || '';
}

const config = {
  isProduction,
  isTest: process.env.NODE_ENV === 'test',
  port: Number(process.env.PORT) || 3000,
  // The site's address, used in email links. Required on the live site, or links would point at localhost.
  appUrl: productionSetting('APP_URL') || 'http://localhost:3000',
  sessionSecret: requireSetting('SESSION_SECRET'),
  databaseUrl: requireSetting('DATABASE_URL'),
  adminEmail: productionSetting('ADMIN_EMAIL').toLowerCase(),

  // Left empty locally: emails print in the terminal, photos save to uploads/.
  resendApiKey: productionSetting('RESEND_API_KEY'),
  emailFrom: process.env.EMAIL_FROM || 'Chalk <hello@biznudge.in>',
  cloudinaryUrl: productionSetting('CLOUDINARY_URL'),
};

export default config;
