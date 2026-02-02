-- Enable leaked password protection for better security
UPDATE auth.config 
SET 
  password_min_length = 8,
  password_require_lowercase = true,
  password_require_uppercase = true,
  password_require_numbers = true,
  password_require_symbols = false,
  hibp_enabled = true
WHERE true;