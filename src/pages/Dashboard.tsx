import { useNavigate } from "react-router";
import { useSession } from "../features/auth/sessionContext";
import { signOut } from "../services/auth";
import { formatZimPhone } from "../utils/phone";

/** First protected screen. Meters and balances arrive in stage 1E. */
export default function Dashboard() {
  const { session } = useSession();
  const navigate = useNavigate();
  const rawPhone = session?.user.phone ?? "";
  const phone = rawPhone
    ? formatZimPhone("+" + rawPhone.replace(/^\+/, ""))
    : "—";

  return (
    <div className="flex flex-col gap-6 pt-8">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <div className="rounded-xl border border-line bg-white p-4">
        <p className="font-mono text-[11px] tracking-widest text-ink-soft uppercase">
          Signed in
        </p>
        <p className="mt-1 font-mono text-lg">{phone}</p>
      </div>
      <p className="text-[15px] text-ink-soft">
        Your meters appear here in stage 1E — claiming, verification against
        the registry, and live balances.
      </p>
      <button
        type="button"
        onClick={() => {
          void signOut().then(() => navigate("/login", { replace: true }));
        }}
        className="rounded-xl border border-line px-5 py-4 text-[15px] font-semibold text-ink active:bg-white"
      >
        Sign out
      </button>
    </div>
  );
}
