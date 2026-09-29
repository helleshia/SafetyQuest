import Icon from "../shared/Icon";

export default function AcademicIdentity({ icon, label, tone = "peach", onClick }: { icon: string; label: string; tone?: "peach" | "sage" | "blue" | "lavender"; onClick: () => void }) {
  return <button type="button" className="academic-identity" onClick={onClick}><span className={`academic-identity-icon tone-${tone}`}><Icon name={icon} /></span><span>{label}</span></button>;
}
