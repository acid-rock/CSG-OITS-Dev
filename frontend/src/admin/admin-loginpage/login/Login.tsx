import axios from "axios";
import "./login.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

const Login = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    email: "",
    password: "",
  });

  const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const res = await axios.post(`${API_URL}/user/login`, {
      email: data.email,
      password: data.password,
    });

    if (res.status === 200) {
      navigate("/admin");
    }
  };

  const handleEmailChange = (e: React.FormEvent<HTMLInputElement>) => {
    setData({ ...data, email: e.currentTarget.value });
  };

  const handlePasswordChange = (e: React.FormEvent<HTMLInputElement>) => {
    setData({ ...data, password: e.currentTarget.value });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo — centered above card */}
        <div className="logo-wrapper">
          <img src="/CSG_logo.svg" alt="CSG Logo" className="logo-img" />
        </div>

        {/* Header — centered */}
        <div className="login-header">
          <h2 className="login-title">
            Online Information Transparency System
          </h2>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={submitHandler}>
          <div className="input-group">
            <img src="/user-login.png" alt="User" className="input-icon" />
            <input
              type="email"
              placeholder="Email"
              className="input-field"
              onChange={handleEmailChange}
            />
          </div>

          <div className="input-group">
            <img src="/padlock.png" alt="Lock" className="input-icon" />
            <input
              type="password"
              placeholder="Password"
              className="input-field"
              onChange={handlePasswordChange}
            />
          </div>

          <div className="form-footer">
            <Link to="/admin/forgot-password" className="forgot-link">
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="sign-in-button">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
