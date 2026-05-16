// Handled inside AuthContext useEffect — this page just shows a loader
// while the PKCE callback is being processed.
export default function AuthCallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">A autenticar...</p>
      </div>
    </div>
  );
}
