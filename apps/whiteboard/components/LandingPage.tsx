"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import React from 'react';

export default function LandingPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex flex-col relative overflow-x-hidden">
      {/* Animated background shapes */}
      <div className="absolute -top-24 -left-32 w-[500px] h-[500px] bg-gradient-to-br from-indigo-200 via-purple-300 to-pink-200 rounded-full blur-3xl opacity-60 animate-pulse z-0" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tr from-pink-200 via-purple-100 to-indigo-100 rounded-full blur-2xl opacity-60 animate-pulse z-0" />
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-6 z-10 relative">
        <span className="text-2xl font-bold text-indigo-700 tracking-tight drop-shadow-lg">WhiteboardX</span>
        <nav className="space-x-4">
          <Button variant="outline" onClick={() => router.push("/signin")}>Sign In</Button>
          <Button onClick={() => router.push("/signup")}>Sign Up</Button>
        </nav>
      </header>
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 z-10 relative">
        <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-6 drop-shadow-2xl">
          Unleash Your Creativity
        </h1>
        <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-2xl">
          Collaborate, brainstorm, and visualize ideas in real-time with the most beautiful online whiteboard.
        </p>
        <Button size="lg" className="px-8 py-4 text-lg font-semibold shadow-xl animate-bounce" onClick={() => router.push("/rooms")}>Start Drawing</Button>
        {/* Hero Illustration + Gallery Preview */}
        <div className="mt-16 flex flex-col md:flex-row items-center justify-center gap-8 w-full max-w-5xl">
          <img
            src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80"
            alt="Team collaborating on a whiteboard"
            className="w-full max-w-lg rounded-3xl shadow-2xl border-4 border-white"
          />
          <div className="flex flex-col gap-4 w-full max-w-md">
            <img
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80"
              alt="Brainstorming illustration"
              className="rounded-2xl shadow-lg border-2 border-white hover:scale-105 transition-transform"
            />
            <img
              src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=600&q=80"
              alt="Creativity and idea generation illustration"
              className="rounded-2xl shadow-lg border-2 border-white hover:scale-105 transition-transform"
            />
          </div>
        </div>
      </main>
      {/* How It Works Section */}
      <section className="py-20 bg-white bg-opacity-80 backdrop-blur-md rounded-t-3xl shadow-inner mt-24 z-10 relative">
        <h2 className="text-3xl font-extrabold text-center mb-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">How It Works</h2>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 px-6">
          <div className="flex flex-col items-center">
            <span className="mb-4">
              <img
                src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80"
                alt="Real-Time Collaboration"
                className="w-20 h-20"
              />
            </span>
            <h3 className="font-bold text-lg mb-2 text-indigo-700">Create or Join</h3>
            <p className="text-gray-600">Start a new whiteboard or join an existing one with a link.</p>
          </div>
          <div className="flex flex-col items-center">
            <span className="mb-4">
              <img
                src="/assets/teamwork.svg"
                alt="Teamwork"
                className="w-20 h-20"
              />
            </span>
            <h3 className="font-bold text-lg mb-2 text-purple-700">Collaborate Live</h3>
            <p className="text-gray-600">Draw, write, and brainstorm together in real-time.</p>
          </div>
          <div className="flex flex-col items-center">
            <span className="mb-4">
              <img
                src="/assets/share.svg"
                alt="Share & Export"
                className="w-20 h-20"
              />
            </span>
            <h3 className="font-bold text-lg mb-2 text-pink-700">Share & Export</h3>
            <p className="text-gray-600">Share your board or export your work in one click.</p>
          </div>
        </div>
      </section>
      {/* Features Section - Expanded */}
      <section className="py-20 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-t-3xl shadow-inner mt-12 z-10 relative">
        <h2 className="text-3xl font-extrabold text-center mb-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Features</h2>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 px-6">
          <FeatureCard icon="🖊️" title="Fluid Drawing" desc="Draw naturally with pencil, shapes, arrows, and more." />
          <FeatureCard icon="🤝" title="Multi-user Sync" desc="See changes from everyone instantly, no lag." />
          <FeatureCard icon="🧠" title="AI Assistance" desc="Smart shape recognition and suggestions." />
          <FeatureCard icon="🗂️" title="Organize Boards" desc="Manage all your whiteboards in one place." />
          <FeatureCard icon="🔒" title="Private & Secure" desc="Your data is encrypted and safe." />
          <FeatureCard icon="📱" title="Mobile Friendly" desc="Beautiful on every device, from phone to desktop." />
          <FeatureCard icon="🌈" title="Themes" desc="Switch between light and dark mode instantly." />
          <FeatureCard icon="⚡" title="Fast & Reliable" desc="Lightning-fast performance, always available." />
        </div>
      </section>
      {/* Testimonials Section */}
      <section className="py-20 bg-white bg-opacity-80 backdrop-blur-md rounded-t-3xl shadow-inner mt-12 z-10 relative">
        <h2 className="text-3xl font-extrabold text-center mb-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Loved by Creators</h2>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-6">
          <TestimonialCard
            quote="WhiteboardX has transformed our remote meetings! It's so intuitive and fun."
            name="Priya S."
            role="Product Designer"
            img="https://randomuser.me/api/portraits/women/68.jpg"
          />
          <TestimonialCard
            quote="The real-time collaboration is seamless. Our team can't live without it now!"
            name="Alex T."
            role="Team Lead"
            img="https://randomuser.me/api/portraits/men/44.jpg"
          />
          <TestimonialCard
            quote="I love the export options and how easy it is to share boards."
            name="Maria G."
            role="Educator"
            img="https://randomuser.me/api/portraits/women/65.jpg"
          />
        </div>
      </section>
      {/* Sticky CTA */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none" style={{maxWidth:'100vw'}}>
        <div className="pointer-events-auto select-auto">
          <Button size="lg" className="px-8 py-4 text-lg font-bold shadow-2xl bg-gradient-to-r from-indigo-500 to-pink-500 text-white animate-pulse" onClick={() => router.push("/rooms")}>Try WhiteboardX Now</Button>
        </div>
      </div>
      {/* Footer */}
      <footer className="py-16 text-center text-gray-400 text-sm mt-24 z-10 relative flex flex-col gap-2 bg-transparent" style={{paddingBottom: '96px'}}>
        <div className="flex justify-center gap-4 mb-2">
          <a href="https://twitter.com" className="hover:text-indigo-500 transition-colors" target="_blank" rel="noopener noreferrer">Twitter</a>
          <a href="https://github.com" className="hover:text-indigo-500 transition-colors" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="mailto:support@whiteboardx.com" className="hover:text-indigo-500 transition-colors">Contact</a>
        </div>
        &copy; {new Date().getFullYear()} WhiteboardX. All rights reserved.
      </footer>
    </div>
  );
}

// FeatureCard component
function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-white/80 shadow-lg rounded-2xl p-6 flex flex-col items-center text-center hover:scale-105 transition-transform border border-gray-100">
      <span className="text-4xl mb-3">{icon}</span>
      <h4 className="font-semibold text-lg mb-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">{title}</h4>
      <p className="text-gray-600 text-sm">{desc}</p>
    </div>
  );
}

// TestimonialCard component
function TestimonialCard({ quote, name, role, img }: { quote: string; name: string; role: string; img: string }) {
  return (
    <div className="bg-white/90 rounded-2xl shadow-xl p-6 flex flex-col items-center text-center border border-gray-100">
      <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`} alt={name} className="w-16 h-16 rounded-full mb-4 shadow-md border-2 border-indigo-200 bg-white" />
      <p className="italic text-gray-700 mb-3">“{quote}”</p>
      <span className="font-bold text-indigo-700">{name}</span>
      <span className="text-xs text-gray-400">{role}</span>
    </div>
  );
}
