import { Link } from "react-router";

/** Placeholder — phone + OTP sign-in is implemented in stage 1D. */
export default function Login() {
  return (
    <div className="flex flex-col gap-4 pt-8">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="text-[15px] leading-relaxed text-ink-soft">
        Phone sign-in with a one-time code arrives in stage 1D. Demo phone
        numbers with fixed codes will be listed right here.
      </p>
      <Link to="/" className="text-sm text-credit underline underline-offset-4">
        Back to start
      </Link>
    </div>
  );
}
