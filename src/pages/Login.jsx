import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSecurity } from "../context/SecurityContext";
import HourglassLoader from "../components/HourglassLoader";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();
  const { checkLoginAttempt, recordLoginSuccess, recordLoginFail } = useSecurity();

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

  return (
    <div style={{ minHeight:"100vh", fontFamily:"'Inter',system-ui,sans-serif", background:"linear-gradient(135deg,#0d0f1a 0%,#111827 50%,#0d0f1a 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes fadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}input::placeholder{color:rgba(255,255,255,0.18)}"}</style>
      <div style={{ position:"fixed", top:"10%", left:"5%", width:600, height:600, borderRadius:"50%", background:"rgba(102,126,234,0.08)", filter:"blur(100px)", pointerEvents:"none" }} />
      <div style={{ position:"fixed", bottom:"10%", right:"5%", width:400, height:400, borderRadius:"50%", background:"rgba(139,92,246,0.07)", filter:"blur(80px)", pointerEvents:"none" }} />

      <div style={{ width:"100%", maxWidth:420, animation:"fadeIn .5s ease" }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ width:72, height:72, margin:"0 auto 20px", borderRadius:22, background:"linear-gradient(135deg,#667eea,#764ba2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, boxShadow:"0 20px 60px rgba(102,126,234,0.5)" }}>🔧</div>
          <h1 style={{ color:"#f1f5f9", fontSize:30, fontWeight:800, letterSpacing:-1 }}>iRepair</h1>
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:14, marginTop:8 }}>Owner portal — sign in to continue</p>
        </div>

        <div style={{ background:"rgba(255,255,255,0.03)", backdropFilter:"blur(24px)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:24, padding:36, boxShadow:"0 24px 80px rgba(0,0,0,0.5)" }}>
          <div style={{ marginBottom:18 }}>
            <label style={{ display:"block", color:"rgba(255,255,255,0.4)", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1.2, marginBottom:9 }}>Username</label>
            <input type="text" value={username} placeholder="owner"
              onChange={e=>{setUsername(e.target.value);setError("");}}
              onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              style={{ width:"100%", padding:"14px 18px", borderRadius:13, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#f1f5f9", fontSize:15, outline:"none" }}
              onFocus={e=>{e.target.style.border="1px solid rgba(102,126,234,0.7)";e.target.style.background="rgba(255,255,255,0.07)";}}
              onBlur={e=>{e.target.style.border="1px solid rgba(255,255,255,0.1)";e.target.style.background="rgba(255,255,255,0.05)";}}
            />
          </div>
          <div style={{ marginBottom:22 }}>
            <label style={{ display:"block", color:"rgba(255,255,255,0.4)", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1.2, marginBottom:9 }}>Password</label>
            <div style={{ position:"relative" }}>
              <input type={showPass?"text":"password"} value={password} placeholder="••••••••"
                onChange={e=>{setPassword(e.target.value);setError("");}}
                onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                style={{ width:"100%", padding:"14px 48px 14px 18px", borderRadius:13, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#f1f5f9", fontSize:15, outline:"none" }}
                onFocus={e=>{e.target.style.border="1px solid rgba(102,126,234,0.7)";e.target.style.background="rgba(255,255,255,0.07)";}}
                onBlur={e=>{e.target.style.border="1px solid rgba(255,255,255,0.1)";e.target.style.background="rgba(255,255,255,0.05)";}}
              />
              <button onClick={()=>setShowPass(!showPass)} style={{ position:"absolute", right:15, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"rgba(255,255,255,0.3)", cursor:"pointer", fontSize:18 }}>{showPass?"🙈":"👁️"}</button>
            </div>
          </div>
          {error && <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10, padding:"10px 14px", color:"#fca5a5", fontSize:13, marginBottom:18 }}>⚠️ {error}</div>}
          <button onClick={handleLogin} disabled={loading} style={{ width:"100%", padding:"15px", borderRadius:14, border:"none", background:loading?"rgba(102,126,234,0.35)":"linear-gradient(135deg,#667eea,#764ba2)", color:"#fff", fontSize:15, fontWeight:700, cursor:loading?"not-allowed":"pointer", boxShadow:loading?"none":"0 8px 32px rgba(102,126,234,0.4)", transition:"all .2s" }}>
            {loading ? "Verifying..." : "Sign In →"}
          </button>
        </div>

        <p style={{ textAlign:"center", marginTop:16, fontSize:11, color:"rgba(255,255,255,0.2)" }}>🔒 Protected by iRepair Security</p>
      </div>
    </div>
  );
}