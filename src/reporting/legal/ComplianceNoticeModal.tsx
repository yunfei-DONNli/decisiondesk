import {
  getLegalConfirmationItems,
  getLegalDisclaimerFull
} from "./legalContent";
import type { Locale } from "@/i18n/messages";
import { t } from "@/i18n/messages";

type ComplianceNoticeModalProps = {
  locale: Locale;
  onAcknowledge: () => void;
};

export function ComplianceNoticeModal({ locale, onAcknowledge }: ComplianceNoticeModalProps) {
  return (
    <div className="compliance-overlay" role="presentation">
      <section
        aria-labelledby="compliance-modal-title"
        aria-modal="true"
        className="compliance-modal"
        role="dialog"
      >
        <span className="compliance-kicker">{t(locale, "complianceKicker")}</span>
        <h2 id="compliance-modal-title">{t(locale, "complianceTitle")}</h2>
        <p className="compliance-copy">{getLegalDisclaimerFull(locale)}</p>
        <ul className="compliance-list">
          {getLegalConfirmationItems(locale).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="compliance-actions">
          <button className="primary-button" onClick={onAcknowledge} type="button">
            {t(locale, "complianceContinue")}
          </button>
        </div>
      </section>
    </div>
  );
}
