import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function BackToExplore() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate("/explorer")}
      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 text-sm font-medium text-slate-300 transition hover:border-mint/20 hover:bg-mint/[0.06] hover:text-mint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
    >
      <ArrowLeft size={16} aria-hidden="true" />
      Retour à Explorer
    </button>
  );
}
