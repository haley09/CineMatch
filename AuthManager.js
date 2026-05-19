class AuthManager {
  constructor() {
    this.usersKey = "cineMatchUsers";
    this.sessionKey = "cineMatchCurrentUser";
    this.users = this.loadUsers();
    this.currentUser = this.loadCurrentUser();
  }

  register(name, email, password) {
    const normalizedEmail = email.trim().toLowerCase();

    if (this.users.some((user) => user.email === normalizedEmail)) {
      throw new Error("An account with that email already exists.");
    }

    const user = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : String(Date.now()),
      name: name.trim(),
      email: normalizedEmail,
      password,
      createdAt: new Date().toISOString()
    };

    this.users.push(user);
    this.saveUsers();
    this.setCurrentUser(user);
    return user;
  }

  login(email, password) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = this.users.find(
      (savedUser) =>
        savedUser.email === normalizedEmail && savedUser.password === password
    );

    if (!user) {
      throw new Error("Email or password is incorrect.");
    }

    this.setCurrentUser(user);
    return user;
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem(this.sessionKey);
  }

  setCurrentUser(user) {
    this.currentUser = user;
    localStorage.setItem(this.sessionKey, user.id);
  }

  loadCurrentUser() {
    const userId = localStorage.getItem(this.sessionKey);
    return this.users.find((user) => user.id === userId) || null;
  }

  saveUsers() {
    localStorage.setItem(this.usersKey, JSON.stringify(this.users));
  }

  loadUsers() {
    try {
      const savedUsers = JSON.parse(localStorage.getItem(this.usersKey));
      return Array.isArray(savedUsers) ? savedUsers : [];
    } catch (error) {
      console.warn("Could not load CineMatch users from localStorage.", error);
      return [];
    }
  }
}
