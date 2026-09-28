import { Archive } from "lucide-react";
import Badge from "../ui/Badge";
import SectionHeading from "../ui/SectionHeading";
import DocumentPreview from "./DocumentPreview";
import VaultDocumentList from "./VaultDocumentList";
import useVaultDocuments from "./useVaultDocuments";

export default function DocumentVault() {
  const vault = useVaultDocuments();

  return (
    <div className="space-y-8">
      <SectionHeading eyebrow="Privé · lecture seule" title="Le coffre-fort" description="Consultez vos billets et réservations. Enregistrez chaque document sur cet appareil avant le départ pour le retrouver hors connexion." />
      <p role="status" className={`rounded-2xl border p-4 text-sm ${vault.cachedTicketCount === 4 ? "border-mint/20 bg-mint/[0.05] text-mint" : "border-amber-200/15 bg-amber-200/[0.05] text-amber-100"}`}>
        {vault.cachedTicketCount === 4
          ? "Les quatre billets sont enregistrés sur cet appareil pour un accès hors ligne."
          : `${vault.cachedTicketCount} billet${vault.cachedTicketCount === 1 ? "" : "s"} sur 4 enregistré${vault.cachedTicketCount === 1 ? "" : "s"} hors ligne. Enregistrez chaque billet avant d'activer le mode avion.`}
      </p>
      {vault.offline && <p className="rounded-2xl border border-amber-200/15 bg-amber-200/[0.05] p-4 text-sm text-amber-100">Hors connexion : seuls les fichiers déjà enregistrés sur cet appareil sont disponibles.</p>}
      {vault.offlineWarning && <p role="status" className="rounded-2xl border border-amber-200/15 bg-amber-200/[0.05] p-4 text-sm text-amber-100">{vault.offlineWarning} Conservez aussi une copie dans les fichiers sécurisés de l’appareil.</p>}
      {vault.error && <p role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-4 text-sm text-rose-200">{vault.error}</p>}

      <section>
        <div className="mb-4 flex items-center gap-3"><Archive size={19} className="text-mint" /><h2 className="text-lg font-semibold text-white">Documents du voyage</h2><Badge tone="mint">{vault.displayedDocuments.length} fichier{vault.displayedDocuments.length === 1 ? "" : "s"}</Badge></div>
        {vault.displayedDocuments.length
          ? <VaultDocumentList documents={vault.displayedDocuments} savedOffline={vault.savedOffline} busy={vault.busy} onDownload={vault.handleDownload} onPreview={vault.handlePreview} />
          : <div className="glass-card rounded-3xl p-8 text-center text-sm text-muted">Aucun document n'est encore disponible.</div>}
      </section>

      <DocumentPreview preview={vault.preview} onClose={vault.closePreview} />
    </div>
  );
}
