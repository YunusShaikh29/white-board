"use client";
import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { PencilRuler, Eraser, Shapes, Share2 } from "lucide-react";
import { signIn, signUp } from "../services/auth";
import { toast } from "sonner";

const AuthPage = ({ signin }: { signin: boolean }) => {
  const [isSignIn, setIsSignIn] = useState(signin);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const router = useRouter();

  const toggleMode = () => {
    setIsSignIn(!isSignIn);
    if (isSignIn) {
      router.push("/signup");
    } else {
      router.push("/signin");
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Auth Form Section */}
      <div className="w-1/2 bg-slate-200 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            {isSignIn ? "Welcome Back!" : "Join Whiteboard"}
          </h1>
          <p className="text-gray-600 mb-8">
            {isSignIn
              ? "Sign in to continue your creative journey"
              : "Create an account to start collaborating"}
          </p>

          <form className="space-y-4" onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
              if (isSignIn) {
                await signIn({
                  email: formData.email,
                  password: formData.password
                });
                toast.success('Signed in successfully!');
                router.push('/rooms');
              } else {
                if (formData.password !== formData.confirmPassword) {
                  toast.error('Passwords do not match');
                  return;
                }
                await signUp({
                  name: formData.name,
                  email: formData.email,
                  password: formData.password
                });
                toast.success('Account created successfully!');
                router.push('/rooms');
              }
            } catch (error) {
              toast.error(error instanceof Error ? error.message : 'Authentication failed');
            } finally {
              setLoading(false);
            }
          }}>
            {!isSignIn && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Name
                </label>
                <Input
                  placeholder="Enter your name"
                  className="border-gray-200 focus:ring-purple-500 focus:border-purple-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <Input
                type="email"
                placeholder="Enter your email"
                className="border-gray-200 focus:ring-purple-500 focus:border-purple-500"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                type="password"
                placeholder="Enter your password"
                className="border-gray-200 focus:ring-purple-500 focus:border-purple-500"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            {!isSignIn && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  placeholder="Confirm your password"
                  className="border-gray-200 focus:ring-purple-500 focus:border-purple-500"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white"
              disabled={loading}
            >
              {isSignIn ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isSignIn ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={toggleMode}
                className="ml-2 text-purple-600 hover:text-purple-700 font-medium"
              >
                {isSignIn ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Creative Whiteboard Preview Section */}
      <div className="w-1/2 bg-gray-50 flex items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-70"></div>

        {/* Decorative Elements */}
        <div className="relative z-10 max-w-lg">
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 transform rotate-2">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Collaborative Whiteboard
            </h2>
            <div className="flex gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <PencilRuler className="w-5 h-5 text-purple-500" />
                <span>Draw</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shapes className="w-5 h-5 text-blue-500" />
                <span>Shapes</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Share2 className="w-5 h-5 text-green-500" />
                <span>Share</span>
              </div>
            </div>
            <div className="h-40 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
              <span className="text-gray-400">Preview Canvas</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 transform -rotate-1 -translate-y-4 translate-x-6">
            <div className="flex items-center gap-3">
              <Eraser className="w-5 h-5 text-purple-500" />
              <p className="text-sm text-gray-600">
                Real-time collaboration with your team
              </p>
            </div>
          </div>
        </div>

        {/* Background Patterns */}
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute top-20 left-20 w-40 h-40 bg-purple-500 rounded-full"></div>
          <div className="absolute bottom-40 right-20 w-60 h-60 bg-blue-500 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-green-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
