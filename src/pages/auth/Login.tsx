import { useState } from "react"

const Login = () => {
    const [email, setEmail] = useState<string>("");
    const [pwd, setPwd] = useState<string>("");

    const handleLogin = () => {
        console.log("Login....")
    }   

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                <input type="password" placeholder="Password" value={pwd} onChange={e => setPwd(e.target.value)} />
                <button type="submit">Login</button>
            </form>
        </div>
    )
}

export default Login;