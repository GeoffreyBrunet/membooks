import { Elysia, t } from "elysia";

const APP_NAME = "MemBooks";

function htmlPage(content: string, title: string = APP_NAME): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f5f5f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      padding: 40px;
      max-width: 400px;
      width: 100%;
    }
    h1 {
      color: #1a1a1a;
      font-size: 24px;
      margin-bottom: 8px;
      text-align: center;
    }
    .subtitle {
      color: #6a6a6a;
      font-size: 14px;
      text-align: center;
      margin-bottom: 32px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      color: #4a4a4a;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;
    }
    input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.2s;
    }
    input:focus {
      outline: none;
      border-color: #0066cc;
    }
    button {
      width: 100%;
      padding: 14px;
      background-color: #0066cc;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    button:hover {
      background-color: #0052a3;
    }
    button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
    .error {
      background-color: #fee;
      border: 1px solid #fcc;
      color: #c00;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 14px;
    }
    .success {
      background-color: #efe;
      border: 1px solid #cfc;
      color: #060;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 14px;
      text-align: center;
    }
    .app-link {
      text-align: center;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #eee;
    }
    .app-link p {
      color: #6a6a6a;
      font-size: 14px;
      margin-bottom: 12px;
    }
    .app-link a {
      color: #0066cc;
      text-decoration: none;
      font-weight: 500;
    }
    .app-link a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
}

export const pageRoutes = new Elysia()
  .get("/reset-password", ({ query, set }) => {
    const { token } = query;

    if (!token) {
      set.headers["content-type"] = "text/html";
      return htmlPage(`
        <div class="container">
          <h1>Invalid Link</h1>
          <p class="subtitle">This password reset link is invalid or has expired.</p>
        </div>
      `, "Invalid Link - " + APP_NAME);
    }

    set.headers["content-type"] = "text/html";
    return htmlPage(`
      <div class="container">
        <h1>Reset Password</h1>
        <p class="subtitle">Enter your new password below</p>

        <div id="error" class="error" style="display: none;"></div>
        <div id="success" class="success" style="display: none;"></div>

        <form id="resetForm">
          <input type="hidden" name="token" value="${token}">

          <div class="form-group">
            <label for="password">New Password</label>
            <input type="password" id="password" name="password" required minlength="8" placeholder="Minimum 8 characters">
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input type="password" id="confirmPassword" name="confirmPassword" required minlength="8" placeholder="Confirm your password">
          </div>

          <button type="submit" id="submitBtn">Reset Password</button>
        </form>

        <div class="app-link">
          <p>Have the app installed?</p>
          <a href="membooks://reset-password?token=${token}">Open in MemBooks App</a>
        </div>
      </div>

      <script>
        const form = document.getElementById('resetForm');
        const errorDiv = document.getElementById('error');
        const successDiv = document.getElementById('success');
        const submitBtn = document.getElementById('submitBtn');

        form.addEventListener('submit', async (e) => {
          e.preventDefault();

          const password = document.getElementById('password').value;
          const confirmPassword = document.getElementById('confirmPassword').value;
          const token = form.querySelector('input[name="token"]').value;

          errorDiv.style.display = 'none';
          successDiv.style.display = 'none';

          if (password !== confirmPassword) {
            errorDiv.textContent = 'Passwords do not match';
            errorDiv.style.display = 'block';
            return;
          }

          if (password.length < 8) {
            errorDiv.textContent = 'Password must be at least 8 characters';
            errorDiv.style.display = 'block';
            return;
          }

          submitBtn.disabled = true;
          submitBtn.textContent = 'Resetting...';

          try {
            const response = await fetch('/auth/reset-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token, newPassword: password })
            });

            const data = await response.json();

            if (response.ok) {
              successDiv.textContent = 'Password reset successfully! You can now log in with your new password.';
              successDiv.style.display = 'block';
              form.style.display = 'none';
            } else {
              errorDiv.textContent = data.error || 'Failed to reset password';
              errorDiv.style.display = 'block';
              submitBtn.disabled = false;
              submitBtn.textContent = 'Reset Password';
            }
          } catch (err) {
            errorDiv.textContent = 'An error occurred. Please try again.';
            errorDiv.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reset Password';
          }
        });
      </script>
    `, "Reset Password - " + APP_NAME);
  }, {
    query: t.Object({
      token: t.Optional(t.String()),
    }),
  });
