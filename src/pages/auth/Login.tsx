import { Box, Button, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { logIn } from "../../auth/Reducer";
import { PAGE_ENDPOINTS } from "../../api/endpoints";

const Login = () => {
    const [email, setEmail] = useState<string>("");
    const [pwd, setPwd] = useState<string>("");
    const navigate = useNavigate();
    const { dispatch } = useAuth();

    const handleLogin = () => {
        console.log("Login....")
        
    }

    useEffect(() => {
      dispatch(logIn({
           isAuthenticated: true,
           isInitialized: true,
           user: {
            id: 1,
            name: "Nguyen Van A",
            email: "nguyenvana@example.com",
            roles: ["admin"]
           }
        }));

      localStorage.setItem('ACCESS_TOKEN', "");
        
      navigate(PAGE_ENDPOINTS.HOME);

    })
    return (
        <Box sx={{ width: 300, margin: "50px auto" }}>
            <Typography variant="h4" mb={2}> Login </Typography>
            <form onSubmit={handleLogin}>
                <TextField label="Email" type="email" placeholder="Email" variant="outlined" fullWidth value={email} onChange={e => setEmail(e.target.value)} margin="normal" />
                <TextField label="Password" type="password" placeholder="Password" variant="outlined" fullWidth value={pwd} onChange={e => setPwd(e.target.value)} margin="normal" />

                <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
                    Login
                </Button>

                <Button variant="text" fullWidth sx={{ mt: 1 }} onClick={() => navigate("/register")}>
                    Create an account
                </Button>
                <button type="submit">Login</button>
            </form>
        </Box>
    )
}

export default Login;