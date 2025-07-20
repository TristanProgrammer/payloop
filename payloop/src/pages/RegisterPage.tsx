import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/input";
import { Button } from "@/components/button";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    // Check if user object exists
    const user = data.user;
    if (!user) {
      setErrorMsg("Something went wrong. No user returned.");
      setLoading(false);
      return;
    }

    // Update profile in 'profiles' table
    const { error: profileError } = await supabase.from("profiles").update({
      display_name: displayName,
      phone: phone,
    }).eq("id", user.id);

    if (profileError) {
      setErrorMsg("Error saving user profile.");
      setLoading(false);
      return;
    }

    // Auto redirect
    navigate("/dashboard");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleRegister}
        className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center">Register</h2>

        <Input
          type="text"
          placeholder="Full Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
        <Input
          type="tel"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {errorMsg && <p className="text-red-500 text-sm text-center">{errorMsg}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Registering..." : "Register"}
        </Button>
      </form>
    </div>
  );
}
