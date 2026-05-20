class AuthManager {
  constructor() {
    this.tokenKey = "cineMatchToken";
    this.token = localStorage.getItem(this.tokenKey);
    this.currentUser = null;
  }

  async register(name, email, password) {
    const data = await this.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password
      })
    });

    this.setSession(data);
    return data.user;
  }

  async login(email, password) {
    const data = await this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password
      })
    });

    this.setSession(data);
    return data.user;
  }

  logout() {
    this.currentUser = null;
    this.token = null;
    localStorage.removeItem(this.tokenKey);
  }

  async loadCurrentUser() {
    if (!this.token) {
      this.currentUser = null;
      return null;
    }

    try {
      const data = await this.request("/api/auth/me");
      this.currentUser = data.user;
      return this.currentUser;
    } catch (error) {
      this.logout();
      return null;
    }
  }

  setSession(data) {
    this.token = data.token;
    this.currentUser = data.user;
    localStorage.setItem(this.tokenKey, data.token);
  }

  async request(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...(options.headers || {})
      }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong.");
    }

    return data;
  }
}
