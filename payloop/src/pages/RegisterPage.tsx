import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { supabase } = useAuth();

  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    setLoading(true);
    setError("");

    try {
      const fakeEmail = `${phone}@propman.co.ke`;

      // 1. Create user in Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: fakeEmail,
        password,
        options: {
          data: {
            full_name: ownerName,
            phone,
          },
        },
      });

      if (signUpError) throw signUpError;

      const userId = signUpData.user?.id;

      // 2. Store extra details in landlords table
      const { error: insertError } = await supabase.from("landlords").insert({
        id: userId,
        business_name: businessName,
        owner_name: ownerName,
        phone,
        email: fakeEmail,
      });

      if (insertError) throw insertError;

      // 3. Redirect to dashboard
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="space-y-4">
          <h2 className="text-xl font-bold text-center">Create Your Account</h2>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          <Input
            placeholder="Business Name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
          <Input
            placeholder="Owner Name"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
          />
          <Input
            placeholder="Phone Number (e.g., +2547xxxxxxx)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            disabled={loading}
            className="w-full"
            onClick={handleRegister}
          >
            {loading ? "Creating Account..." : "Register"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
