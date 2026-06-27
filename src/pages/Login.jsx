const handleLogin = async () => {
    if (!username || !password) { setError("Please fill in all fields"); return; }

    const check = checkLoginAttempt(username);
    if (!check.allowed) { setError(check.message); return; }

    setLoading(true);

    try {
      const res = await fetch("https://irepair-backend-production.up.railway.app/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const result = recordLoginFail(username);
        if (result.locked) {
          setError("Too many failed attempts. Account locked for 15 minutes.");
        } else {
          setError(`Invalid credentials. ${result.remaining} attempt${result.remaining !== 1 ? "s" : ""} remaining.`);
        }
        setLoading(false);
        return;
      }

      const data = await res.json();
      localStorage.setItem("irepair_token", data.access_token);
      localStorage.setItem("auth", "true");
      recordLoginSuccess(username);
      navigate("/");
    } catch (err) {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };