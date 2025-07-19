import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { supabase } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    businessName: "",
    ownerName: "",
    phone: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    const { email, phone, password, businessName, ownerName } = formData;

    if (!email || !phone || !password || !businessName || !ownerName) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Step 1: Register user in Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
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
      if (!userId) throw new Error("Signup successful but user ID not returned.");

      // Step 2: Insert into landlords table
      const { error: insertError } = await supabase.from("landlords").insert({
        id: userId,
        business_name: businessName,
        owner_name: ownerName,
        phone,
        email,
      });

      if (insertError) throw insertError;

      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong during registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg border">
        <CardContent className="space-y-5 py-8">
          <h2 className="text-2xl font-bold text-center text-gray-800">Create Your Landlord Account</h2>

          {error && (
            <div className="flex items-center text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}

          <Input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <Input
            name="businessName"
            placeholder="Business Name"
            value={formData.businessName}
            onChange={handleChange}
            required
          />
          <Input
            name="ownerName"
            placeholder="Owner's Full Name"
            value={formData.ownerName}
            onChange={handleChange}
            required
          />
          <Input
            name="phone"
            placeholder="Phone Number (e.g. +254712345678)"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          <Input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <Button
            disabled={loading}
            className="w-full"
            onClick={handleRegister}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Register"
            )}
          </Button>

          <p className="text-center text-sm text-gray-500">
            Already have an account? <a href="/login" className="text-blue-600 hover:underline">Sign In</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
