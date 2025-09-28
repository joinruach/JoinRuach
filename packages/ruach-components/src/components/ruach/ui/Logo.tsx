export default function Logo({ className="" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 24" role="img" aria-label="Ruach">
      <text x="0" y="18" fontFamily="ui-sans-serif,system-ui" fontSize="18" fontWeight="800">RUACH</text>
    </svg>
  );
}
