export default function SignupPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="mx-auto w-full max-w-[400px] p-6 text-center">
        <h1 className="text-3xl font-serif mb-2">Create Account</h1>
        <p className="text-muted-foreground mb-8">Start your wedding journey</p>
        <div className="space-y-4">
          <input 
            type="email" 
            placeholder="Email address"
            className="w-full p-3 rounded-lg border border-border outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all">
            Join Timely AI
          </button>
        </div>
      </div>
    </div>
  );
}
