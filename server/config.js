// Every setting the server uses is read here, in one place.
// Other files import `config` instead of reading process.env themselves,
// so you never have to hunt through the code to find out what goes in .env.

const isProduction = process.env.NODE_ENV === 'production';

// Stop the server straight away if a required setting is missing.
// A clear error at startup is much easier to fix than a confusing crash later.
function requireSetting(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing setting ${name}. Add it to your .env file (see .env.example).`);
  }
  return value;
}

// Settings that are only required in production, where emails and photos must really work.
function productionSetting(name) {
  return isProduction ? requireSetting(name) : process.env[name] || '';
}

const config = {
  isProduction,
  port: Number(process.env.PORT) || 3000,
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  sessionSecret: requireSetting('SESSION_SECRET'),
  databaseUrl: requireSetting('DATABASE_URL'),

  adminEmail: productionSetting('ADMIN_EMAIL').toLowerCase(),

  // When these are empty (local development), emails are printed in the terminal
  // and photos are saved to the uploads/ folder instead.
  resendApiKey: productionSetting('RESEND_API_KEY'),
  emailFrom: process.env.EMAIL_FROM || 'Chalk <hello@biznudge.in>',
  cloudinaryUrl: productionSetting('CLOUDINARY_URL'),
};

export default config;
