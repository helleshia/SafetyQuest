import logo from "../assets/SAFETYQUEST.png";

export default function BrandLogo({ className = "" }: { className?: string }) {
  const source = typeof logo === "string" ? logo : logo.src;
  return <img className={`brand-logo ${className}`.trim()} src={source} alt="SafetyQuest" />;
}
